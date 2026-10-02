# AIGC 互动运营中枢

一个面向活动运营、区域运营和设备运维的 AIGC 互动大屏运营后台原型。

## 在线演示

- 演示地址：`https://xingchency.github.io/aigc-ops-command-center/`
- 源码地址：`https://github.com/xingchenCY/aigc-ops-command-center`

> 页面当前使用固定的演示数据，不连接真实 AI 服务、设备或用户数据。发布到 GitHub Pages 后，评审者可直接打开链接查看完整交互。

## 主要能力

- 参与人数、生成成功率、扫码转化率、分享转化率、平均生成时长、设备在线率
- 日期范围、快捷日期、点位多选和仅看异常点位
- 活动趋势（日/小时切换）、互动漏斗、审核三态环图、点位排行和设备健康状态
- 顶部全局异常提醒，生成失败、响应超时、审核异常、转化下降和设备离线识别
- 设备状态由上报状态与最近心跳共同判定，异常影响仅统计故障后的任务
- 设备行展示当前范围内生成量、成功率和平均生成时长
- 点位详情抽屉，集中查看该点位的指标、设备指标和相关异常，可显式切换为该点位分析
- 异常详情抽屉，提供原因、影响范围、失败请求分布、驳回原因统计和运营动作
- 异常中心支持导出 CSV
- 空数据、无环比基线和设备快照采用不同展示口径
- 指标口径面板，解释计算公式和数据来源

## 评审打开方式

方式 1：本地打开源码。

环境要求：Node.js 24+、pnpm 11+

```bash
pnpm install
pnpm dev
```

方式 2：构建静态产物并本地预览。

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
pnpm preview
```

方式 3：直接打开在线演示。

```text
https://xingchency.github.io/aigc-ops-command-center/
```

## 技术栈

Vue 3、Vite、TypeScript、Ant Design Vue、Apache ECharts、Vue ECharts、Pinia、Lucide、Vitest、Playwright。

## 文档

- [产品方案](./docs/PRODUCT.md)
- [指标口径](./docs/METRICS.md)
- [AI 工具使用说明](./docs/AI_TOOL_USAGE.md)
- [验证记录](./docs/VERIFICATION.md)

## GitHub Pages

`.github/workflows/deploy.yml` 会在 `main` 分支推送后执行类型检查、单元测试、桌面/移动端浏览器测试、生产构建，并从真实的项目子路径加载产物做白屏检查，最后发布 `dist`。部署到项目页时，工作流会自动设置 Vite 的 `base` 路径。

## 已知限制

- 当前是固定演示快照，不包含真实账号权限、告警推送和后端闭环工单。
- 设备在线率是当前快照指标，不参与日期环比。
- 当前首屏 JS 约 278KB gzip；功能原型可接受，生产化时应通过组件级异步加载继续优化。
- 移动端保留完整运营模块，纵向页面较长，真实产品可进一步增加分区导航。
- 在线地址需要在目标 GitHub 账号创建公开仓库后替换上方占位符。

## 设计取舍

这是一个静态可复现的后台原型：通过结构化模拟数据展示完整业务链路，把评审重点放在指标定义、异常识别和运营动作上，而不是把演示风险放在外部模型 API、跨域或密钥配置上。
