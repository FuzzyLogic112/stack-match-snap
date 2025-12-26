import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LevelSelect from "./pages/LevelSelect";
import Play from "./pages/Play";
import Auth from "./pages/Auth";
import Shop from "./pages/Shop";
import DailyChallenge from "./pages/DailyChallenge";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LevelSelect />} />
          <Route path="/play/:levelId" element={<Play />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/daily" element={<DailyChallenge />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
