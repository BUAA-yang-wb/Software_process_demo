---
name: "Users Permission Instruction"
description: "Use when: 修改用户管理角色权限、可见范围、菜单入口控制、路由鉴权与越权拦截逻辑。"
applyTo:
  - "demo/scripts/core.js"
  - "demo/scripts/layout.js"
  - "demo/scripts/main.js"
---
# Users Permission Guidelines

## Scope
本指令只约束用户管理中的权限与范围控制，不负责页面视觉和交互细节。

## Permission Boundaries
- 单角色模型保持不变：学生、教师、管理员。
- 权限收口优先集中在 core.js，不在页面层复制多份权限规则。
- 菜单可见性由 layout.js 控制，页面文件不硬编码角色菜单。
- 路由鉴权与无权限拦截由 main.js 统一处理，避免分散式校验。

## Role Scope Rules
- 管理员可见全平台用户并执行全局维护。
- 教师仅可见本人及所属学生，不可查看管理员或其他教师。
- 学生仅可访问个人资料范围能力。

## Change Checklist
- 修改权限规则时同步检查：菜单显示、路由可达性、操作可执行性。
- 任何新入口都必须定义角色可见范围与无权限反馈路径。
- 不重命名既有存储键前缀与状态结构。

## Verification Checklist
- 三类角色登录后菜单项与入口符合预期。
- 越权访问用户管理路由会被正确拦截。
- 教师账号数据范围收口正确。
- 控制台无新增报错。

## Reference Docs
- demo/TEAM_GUIDE.md
- demo/README.md
- docs/1.2用户管理Demo设计文档.md
- Requirements/1.2_用户管理_需求分析.md
