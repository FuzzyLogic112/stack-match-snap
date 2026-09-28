# Stack Match Snap · 叠叠消

羊了个羊玩法的三消叠叠乐网页游戏：点击没被压住的方块放进底部托盘，凑齐 3 个相同图案即消除，清空棋盘过关。带金币、道具、每日挑战、好友排行和成就系统。

## 功能

| 模块 | 说明 |
| --- | --- |
| 关卡 | 简单 / 普通 / 困难三档，每档 20 关，共 60 关；层数、方块数、图案种类逐关递增，困难档是深层高密度的“羊了个羊”式布局 |
| 托盘 | 7 格，满了即失败 |
| 道具商店 | 用过关获得的金币购买：洗牌、撤销、移除 3 个、提示 |
| 每日挑战 | 每天一关，连续完成有额外金币加成 |
| 排行榜 | 提交成绩到全局排行榜；好友排行榜 |
| 好友 | 搜索用户、发送 / 处理好友请求 |
| 成就 | 达成条件自动解锁并弹出提示 |
| 反馈 | 粒子特效、震屏、彩纸、音效与背景音乐 |

## 技术栈

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase：账号登录、玩家资料、排行榜、每日挑战、好友与成就（表结构见 `supabase/migrations/`）
- 项目最初由 [Lovable](https://lovable.dev) 生成

## 本地运行

需要 Node.js 18 以上。

```bash
npm install
npm run dev
```

Supabase 连接信息在根目录 `.env`：

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

想接自己的 Supabase 项目，把这三项换成你的，再依次执行 `supabase/migrations/` 下的 SQL 建表即可。

## 目录

```
src/
├── pages/        # 首页、关卡选择、游戏、商店、每日挑战、好友、成就、登录
├── components/   # game（棋盘/方块/托盘）、friends、achievements、effects
├── hooks/        # useGameLogic 游戏核心逻辑、useAuth、useLeaderboard 等
├── config/       # levels.ts 关卡生成、powerups.ts 道具
└── integrations/supabase/
supabase/migrations/  # 数据库表结构
```

## 其他命令

```bash
npm run build     # 生产构建，输出到 dist/
npm run preview   # 预览构建结果
npm run lint      # ESLint 检查
```
