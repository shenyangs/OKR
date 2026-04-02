# OKR 协同管理工作台

一个基于 `Next.js 14 + React + TypeScript + Tailwind CSS + Radix UI + Framer Motion` 的内部 OKR 可视化协同工作台。

## 本地运行

```bash
npm install
cp .env.example .env.local
# 然后把 .env.local 里的 MINIMAX_API_KEY 改成你自己的 Key
npm run dev
```

浏览器打开：

```bash
http://localhost:3000
```

如果要验证 AI 识别 KR 功能，必须先在 `.env.local` 里配置：

```env
MINIMAX_API_KEY=你的_MiniMax_M2.7_Token_Plan_Key
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
MINIMAX_MODEL=MiniMax-M2.7
```

## 功能说明

- 顶部支持身份切换，当前身份全局共享
- 首页优先展示部门大盘，可展开查看所有 Objective 和 KR
- 我的工作台独立在 `/workspace` 页面，只显示当前成员参与的 KR
- O 可在首页头部直接编辑，KR 可在详情弹窗中切换到编辑态
- 支持 AI 识别 KR：粘贴一段新的 KR 文本，系统会自动匹配到对应 O / KR，并在确认后覆盖旧内容
- 所有编辑结果都为前端本地保存，会写入当前浏览器 `localStorage`

## Docker / 极空间部署

项目已经按环境变量方式设计，代码里继续读取：

```ts
process.env.MINIMAX_API_KEY
```

这意味着：

- 本地调试：用 `.env.local`
- Docker / 极空间：在容器环境变量里填 `MINIMAX_API_KEY`

### 方式一：本机用 docker-compose

先在当前终端注入环境变量，或者准备一个 `.env` 文件：

```bash
export MINIMAX_API_KEY=你的_MiniMax_M2.7_Token_Plan_Key
export MINIMAX_BASE_URL=https://api.minimaxi.com/v1
export MINIMAX_MODEL=MiniMax-M2.7
docker compose up --build
```

启动后访问：

```bash
http://localhost:3000
```

### 方式二：极空间 Docker

创建容器时：

- 镜像使用本项目构建出的镜像
- 端口映射 `3000:3000`
- 环境变量新增 `MINIMAX_API_KEY=你的实际 Key`

这样后面换 Key 时，不需要改代码，也不需要重新改源码文件。

## 关键文件

- `app/page.tsx`：页面入口
- `app/workspace/page.tsx`：我的工作台页面入口
- `app/api/ai-kr-rewrite/route.ts`：AI 识别 KR 服务端接口
- `components/okr-dashboard-page.tsx`：首页部门大盘
- `components/okr-workspace-page.tsx`：个人工作台页面
- `components/ai-kr-rewrite-modal.tsx`：AI 识别 KR 弹窗
- `components/department-view.tsx`：部门大盘
- `components/personal-workspace.tsx`：我的工作台
- `components/kr-detail-modal.tsx`：KR 详情与更新弹窗
- `components/objective-edit-modal.tsx`：O 编辑弹窗
- `components/okr-data-context.tsx`：可编辑数据的本地持久化状态
- `lib/data.ts`：OKR 数据模型与 Mock 数据
