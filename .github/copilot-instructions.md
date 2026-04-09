# Project Guidelines

## Goal
本仓库用于《软件过程与质量》课程作业 Demo。默认目标不是一次性写代码，而是组织一个可运行的多角色 Agent 开发团队，完成“需求 -> 设计 -> 实现 -> 验证 -> 交付”的全过程，并确保过程可审计、结果可复现。

## Agent Team Workflow
所有任务默认按以下阶段推进，除非用户明确要求跳过：
1. 需求澄清：先对齐需求边界、角色范围、输入输出与验收标准。
2. 方案设计：给出模块边界、数据流、路由/状态影响与风险点。
3. 实现落地：按最小改动原则修改代码，保持现有结构。
4. 质量验证：至少执行可行的运行验证；若无法自动化测试，明确手工验证步骤和结果。
5. 交付总结：说明改动文件、行为变化、已验证项、未覆盖风险。

建议的角色化分工（可由同一 Agent 分阶段扮演）：
- Product/Analyst Agent：拆解需求、维护验收标准。
- Architect Agent：约束边界与扩展点，避免跨模块耦合。
- Dev Agent：实施代码改动，遵循项目约定。
- QA Agent：制定并执行验证清单，记录缺口。
- Reviewer Agent：聚焦风险、回归影响与文档一致性。

## Architecture Boundaries
前端为纯静态原型，入口与模块边界如下：
- 入口：demo/index.html、demo/app.js
- 核心状态与权限：demo/scripts/core.js
- 布局层：demo/scripts/layout.js
- 页面层：demo/scripts/pages-*.js
- 事件层：demo/scripts/handlers.js
- 路由分发：demo/scripts/main.js
- 组件层：demo/scripts/components.js

实现时保持以下边界：
- pages 文件负责页面渲染，不直接重写全局核心规则。
- components 文件优先放可复用渲染逻辑。
- 与角色权限相关的规则集中在 core.js。
- 新页面接入时同步更新 main.js 路由分发与 layout.js 菜单。

## Build and Test
本项目当前无构建流程、无自动化测试框架：
- 运行：直接打开 demo/index.html
- 可选本地服务：在 demo 目录使用 python -m http.server 8000
- 测试方式：浏览器手工验证

每次改动后至少完成：
1. 关键路径可用性验证（登录、路由跳转、角色菜单）。
2. 受影响页面的主流程验证（增删改查或表单提交）。
3. 控制台无新增报错。

## Project Conventions
- 保持单角色模型与既有权限收口逻辑（学生/教师/管理员）。
- 保持现有存储键前缀与状态管理模式，不随意重命名已有键。
- 渲染函数保持纯函数风格（返回 HTML 字符串）。
- 事件交互优先沿用 data-action 等数据属性模式。
- 样式遵循 demo/styles.css + demo/styles/*.css 的模块化分层，不把大量样式回填到聚合入口。
- 文案默认与现有界面语言一致（中文）。

## Quality Gates
涉及功能改动时，回复中必须包含：
1. 需求覆盖：本次改动对应了哪些需求点。
2. 影响分析：涉及的角色、页面、状态与路由。
3. 验证证据：已执行的检查项与结果。
4. 风险与后续：尚未覆盖的场景、建议补充测试。

## Source of Truth (Link, Don’t Embed)
需求与设计细节以现有文档为准，优先引用，不重复抄写：
- demo/TEAM_GUIDE.md
- demo/README.md
- docs/课程大作业Demo整体规划.md
- docs/1.2用户管理Demo设计文档.md
- Requirements/1.1_需求概述.md
- Requirements/1.1_非功能性需求.md
- Requirements/1.2_用户管理_需求分析.md
- Requirements/1.3_在线考试平台需求规格说明书-题库管理.md
- Requirements/1.4_考试管理.md
- Requirements/1.5_评估与成绩分析功能需求.md

## Delivery Expectations
默认交付应同时包含：
- 代码改动（最小必要变更）
- 验证结果（手工或命令）
- 文档同步（如行为或边界变化）
- 可复用的下一步建议（如新增模块的接入点与测试清单）
