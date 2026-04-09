---
name: "Users UI Flow Instruction"
description: "Use when: 修改用户列表、用户详情、用户新增编辑、表单交互、列表筛选搜索与页面展示一致性。"
applyTo:
  - "demo/scripts/pages-users.js"
  - "demo/scripts/handlers.js"
  - "demo/styles/pages.css"
---
# Users UI Flow Guidelines

## Scope
本指令只约束用户管理页面渲染与交互流程，不定义角色权限策略。

## Rendering and Interaction
- 页面渲染逻辑集中在 pages-users.js，渲染函数保持返回 HTML 字符串。
- 事件处理优先沿用 handlers.js 的 data-action 模式，不新增分散式内联事件。
- 字段变更时保持列表、详情、编辑表单三处展示一致。
- 页面文案默认中文，与现有界面风格保持一致。

## Data Flow Rules
- 涉及筛选、搜索、状态变更时，确保 UI 状态与数据状态同步更新。
- 用户状态修改后需回流更新列表与详情展示，避免只更新单一视图。
- 不引入与用户管理无关的全局状态改写。

## Style Rules
- 页面样式优先维护在 pages.css 的用户管理相关区域。
- 不将大量样式回填到 styles.css 聚合入口。

## Verification Checklist
- 用户列表搜索与筛选行为正确。
- 详情、编辑、新增、冻结/恢复、重置密码流程可达。
- 表单提交与错误提示可见且可理解。
- 控制台无新增报错。

## Reference Docs
- demo/TEAM_GUIDE.md
- demo/README.md
- docs/1.2用户管理Demo设计文档.md
- Requirements/1.2_用户管理_需求分析.md
