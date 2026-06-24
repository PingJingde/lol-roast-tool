# LOL 审判之眼 — 玩家战绩查询 & 锐评工具

> 设计文档 · 2026-06-24 · v1.0

---

## 1. 产品概述

一款面向英雄联盟国服玩家的 Web 工具。用户输入召唤师名称 + 选择大区后，查询战绩数据，并获得一条 AI 驱动的"锐评"——用毒舌幽默的风格吐槽玩家的游戏表现。所有人都可查，自带传播属性。

### 核心体验闭环
**搜索 → 战绩展示 → 锐评卡片**

### 二期规划
- 分享卡片（截图/链接）
- 锐评排行榜
- 社交媒体一键分享

---

## 2. 技术架构

### 2.1 整体方案：纯前端 SPA

| 层 | 技术选型 |
|---|---|
| 框架 | Vue 3 (Composition API + script setup) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 构建 | Vite |
| 路由 | Vue Router |
| 测试 | Vitest |
| 部署 | Vercel (免费托管) |

**为什么纯前端？** — 零服务器成本、开发快、Vercel 全球 CDN 自动部署。数据获取通过 CORS 代理转发，锐评在浏览器端完成。

### 2.2 数据流

```
用户输入(名称+大区) → CORS 代理 → lolhelper.cn 类数据站
                                          ↓
结果渲染 ← 锐评引擎(模板/AI) ← 数据解析(段位/胜率/KDA/英雄)
```

### 2.3 CORS 代理方案

第三方 LOL 数据站不允许跨域请求，需代理中转：
- **首选方案**：Cloudflare Workers 免费代理（10 万次/天免费额度）
- **备选方案**：自建 Node.js 代理，部署在 Vercel Serverless Functions
- **降级方案**：多个公开 CORS 代理服务轮询

---

## 3. 页面结构

### 3.1 路由设计
| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | SearchPage | 搜索首页 |
| `/result` | ResultPage | 查询结果（战绩+锐评） |

### 3.2 组件树

```
App
├── SearchPage
│   ├── SearchBar          — 大区选择器 + 名称输入框
│   └── RecentSearches     — 最近搜索记录 (localStorage)
│
└── ResultPage
    ├── PlayerHeader       — 召唤师基本信息
    ├── StatsPanel         — 数据面板 (段位/胜率/KDA)
    ├── ChampionList       — 常用英雄列表
    ├── RoastCard          — 锐评卡片 (核心)
    │   ├── TemplateRoast  — 模板匹配锐评
    │   └── AIRoast        — DeepSeek AI 锐评
    └── ShareButton        — 分享 (二期)
```

### 3.3 布局
- **Desktop**：搜索结果页采用左右两栏布局 — 左侧战绩数据（StatsPanel + ChampionList），右侧锐评卡片（RoastCard）
- **Mobile**：上下堆叠，锐评卡片置顶吸引眼球

---

## 4. 锐评引擎（核心）

### 4.1 双引擎架构

```
战绩数据 → 模板匹配 → 命中(分数≥阈值)? → YES → 输出模板锐评
                        ↓ NO
                   构建 Prompt → DeepSeek Web → 安全过滤 → 输出 AI 锐评
```

- **模板优先**：快速、免费、可控、不依赖外部服务
- **AI 兜底**：模板未命中或分数不够时，调用 DeepSeek 网页版生成个性化锐评

### 4.2 模板匹配规则

每条模板结构：
```typescript
interface RoastTemplate {
  id: string
  condition: MatchCondition  // 触发条件
  text: string               // 段子文本，支持 {变量} 插值
  grade: 'S' | 'A' | 'B' | 'C'
  tags: string[]             // 归类标签
}

interface MatchCondition {
  // 所有字段可选，AND 逻辑组合
  winRateBelow?: number      // 胜率低于
  winRateAbove?: number      // 胜率高于
  deathsAboveKills?: number  // 死亡/击杀比
  gamesAbove?: number        // 总场次高于
  tierBelow?: string         // 段位低于
  champions?: string[]       // 匹配特定英雄
  championWinRateBelow?: number // 英雄胜率低于且
  championGamesAbove?: number   // 英雄场次高于
}
```

### 4.3 模板示例

| 触发条件 | 模板文本 | 评级 |
|---|---|---|
| 常用英雄胜率<45% 且 场次>100 | "你的 {champion} 玩了 {games} 场，胜率 {winrate}——建议去玩人机找找自信。" | S |
| 死亡数 > 击杀数×1.5 | "KDA {kda}，你的死亡次数比补刀还稳定。" | A |
| 段位<黄金 且 总场次>500 | "{tier} 段位，{total} 场——质量和数量你选了后者。" | S |
| 英雄=亚索/劫/永恩 且 胜率<48% | "又一个 {champion} 绝活哥——绝活指把队友活活气绝。" | S |
| 胜率>55% 且 KDA>3.0 | "胜率 {winrate}——你是代练还是炸鱼？建议自首。" | B |

### 4.4 DeepSeek AI 调用方案

**Prompt 模板：**
```
你是一个LOL锐评机器人，说话风格毒舌、幽默、一针见血。
请根据以下玩家数据，生成一段100字以内的锐评：

- 召唤师：{name}
- 段位：{tier}
- 胜率：{winrate}
- KDA：{kda}
- 常用英雄：{champions}
- 总场次：{games}

要求：语气像朋友间互相损，针对具体数据吐槽，加点LOL玩家才懂的梗，禁止人身攻击和脏话。
```

**调用方式**：前端 fetch → DeepSeek 网页版对话 API（chat.deepseek.com），无需 API Key。

**降级策略**：AI 超时 5 秒自动回退到模板匹配，保证始终有结果返回。

### 4.5 安全控制
- **敏感词库**：过滤脏话、人身攻击、政治敏感内容
- **输出校验**：AI 返回后二次检查敏感词
- **兜底文案**：过滤后内容为空时显示默认安全文案

---

## 5. 数据获取层

### 5.1 数据源
- **主数据源**：lolhelper.cn（隐藏分查询系统）
- **备用数据源**：可扩展接入其他国内 LOL 数据站
- **降级策略**：主数据源不可用时自动切换备用源

### 5.2 提取数据字段
| 字段 | 说明 |
|---|---|
| summonerName | 召唤师名称 |
| tier | 段位（王者/宗师/大师/钻石/翡翠/铂金/黄金/白银/青铜/黑铁） |
| winRate | 总体胜率 |
| kda | K/D/A |
| totalGames | 总场次 |
| champions | 常用英雄列表 [{name, winRate, games}] |
| region | 大区 |

### 5.3 缓存策略
- 同一玩家 5 分钟内不重复请求（localStorage 缓存）
- 减少对第三方站点的请求压力

---

## 6. 项目结构

```
lol-roast-tool/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/index.ts
│   ├── pages/
│   │   ├── SearchPage.vue
│   │   └── ResultPage.vue
│   ├── components/
│   │   ├── SearchBar.vue
│   │   ├── PlayerHeader.vue
│   │   ├── StatsPanel.vue
│   │   ├── ChampionList.vue
│   │   └── RoastCard.vue
│   ├── engine/
│   │   ├── templateRoast.ts       # 模板匹配引擎
│   │   ├── templates.json         # 模板库 (50+条)
│   │   └── deepseekAI.ts          # DeepSeek 调用
│   ├── services/
│   │   └── dataFetcher.ts         # 数据获取 & CORS 代理
│   ├── utils/
│   │   ├── filter.ts              # 敏感词过滤
│   │   └── cache.ts               # localStorage 缓存
│   └── types/
│       └── index.ts               # TypeScript 类型定义
└── public/
    └── favicon.ico
```

---

## 7. 部署与运维

### 7.1 部署流程
1. 代码推送至 GitHub 仓库
2. Vercel 连接仓库，自动构建部署
3. 环境变量配置 CORS 代理地址
4. 绑定自定义域名（可选）

### 7.2 特点
- 零服务器成本
- 自动 HTTPS
- 全球 CDN 加速
- Git push → 自动部署

---

## 8. 非功能需求

### 性能
- 首屏加载 < 3s
- 查询响应 < 5s（含第三方数据获取）
- 锐评生成 < 5s（AI 超时 5s）

### 安全
- 所有锐评内容经敏感词过滤
- 不存储用户搜索记录至服务器（仅 localStorage）
- 第三方请求不泄露用户信息

### 可维护性
- 模板库使用 JSON 文件，非开发者也可补充段子
- 数据源切换只需新增 adapter
- 组件职责单一，方便替换

---

## 9. 里程碑

| 阶段 | 内容 | 预计 |
|---|---|---|
| M1 | 项目脚手架 + 搜索页面 + 静态 UI | 1-2 天 |
| M2 | 数据获取 + 解析 | 1-2 天 |
| M3 | 锐评引擎（模板 + AI） | 1-2 天 |
| M4 | 完整串联 + 测试 | 1 天 |
| M5 | 部署上线 Vercel | 0.5 天 |

---

> 下一步：编写实施计划（writing-plans）
