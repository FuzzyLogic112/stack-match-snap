import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  username: string;
  coins: number;
  max_level: number;
  shuffle_count: number;
  undo_count: number;
  remove_three_count: number;
  hint_count: number;
  daily_streak: number;
  last_daily_date: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile after auth change (deferred to avoid deadlock)
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, coins, max_level, shuffle_count, undo_count, remove_three_count, hint_count, daily_streak, last_daily_date')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile({
        ...data,
        daily_streak: data.daily_streak ?? 0,
        last_daily_date: data.last_daily_date ?? null
      } as Profile);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const refreshProfile = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

  // Type for RPC responses
  interface RpcResponse {
    success: boolean;
    error?: string;
    new_max_level?: number;
    streak?: number;
  }

  // Server-side RPC: Purchase powerup
  const purchasePowerup = async (powerupId: string, price: number) => {
    const { data, error } = await supabase.rpc('purchase_powerup', {
      p_powerup_id: powerupId,
      p_price: price
    });
    
    const result = data as unknown as RpcResponse | null;
    
    if (!error && result?.success) {
      refreshProfile();
      return { success: true, error: null };
    }
    
    return { 
      success: false, 
      error: error || new Error(result?.error || 'Purchase failed') 
    };
  };

  // Server-side RPC: Use powerup
  const usePowerup = async (powerupId: string) => {
    const { data, error } = await supabase.rpc('use_powerup', {
      p_powerup_id: powerupId
    });
    
    const result = data as unknown as RpcResponse | null;
    
    if (!error && result?.success) {
      refreshProfile();
      return { success: true, error: null };
    }
    
    return { 
      success: false, 
      error: error || new Error(result?.error || 'Use powerup failed') 
    };
  };

  // Server-side RPC: Complete level
  const completeLevel = async (levelNum: number, coinReward: number) => {
    const { data, error } = await supabase.rpc('complete_level', {
      p_level_num: levelNum,
      p_coin_reward: coinReward
    });
    
    const result = data as unknown as RpcResponse | null;
    
    if (!error && result?.success) {
      refreshProfile();
      return { success: true, newMaxLevel: result.new_max_level ?? null, error: null };
    }
    
    return { 
      success: false, 
      newMaxLevel: null,
      error: error || new Error(result?.error || 'Complete level failed') 
    };
  };

  // Server-side RPC: Complete daily challenge
  const completeDailyChallenge = async (coinReward: number) => {
    const { data, error } = await supabase.rpc('complete_daily_challenge', {
      p_coin_reward: coinReward
    });
    
    const result = data as unknown as RpcResponse | null;
    
    if (!error && result?.success) {
      refreshProfile();
      return { success: true, error: null, data: { streak: result.streak } };
    }
    
    return { 
      success: false, 
      error: error || new Error(result?.error || 'Daily challenge completion failed'),
      data: null
    };
  };

  // Server-side RPC: Check if daily challenge is completed
  const checkDailyChallengeCompleted = async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_daily_challenge_completed');
    if (error) return false;
    return data === true;
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    purchasePowerup,
    usePowerup,
    completeLevel,
    completeDailyChallenge,
    checkDailyChallengeCompleted
  };
};
