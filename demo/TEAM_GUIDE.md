# TEAM GUIDE

这份文件供组内演示和二次开发使用，不会出现在页面界面中。

## 预置账号

- 管理员账号：`admin01 / Demo12345`
- 教师账号：`teacher01 / Demo12345`
- 学生账号：`2026001 / Demo12345`
- 学生账号：`2026015 / Demo12345`
- 锁定账号：`teacher-lock / Demo12345`

## 当前 Demo 角色范围

- 管理员：可查看并维护全平台用户，支持单角色分配。
- 管理员：可选择教师并进入该教师考试管理视图，执行教师等效考试操作。
- 教师：只查看本人及所属学生，不显示管理员与其他教师。
- 学生：查看个人资料与已分配考试，仅在“考试中”可参加考试。

## 隐藏辅助能力

浏览器控制台可使用以下方法：

```js
window.ExamPortalTools.listAccounts()
window.ExamPortalTools.listExams()
window.ExamPortalTools.resetData()
window.ExamPortalTools.simulateRemoteLogin()
```

说明：

- `listAccounts()`：查看预置账号
- `listExams()`：查看考试任务与分配数据
- `resetData()`：将本地数据恢复到初始状态
- `simulateRemoteLogin()`：模拟当前账号在其他位置登录，用于演示互斥会话

## 考试样例（学生端演示）

- `exam-001`：未开始（显示“未开始”，点击“参加考试”后提示不可参加）
- `exam-002`：考试中（显示“考试中”，点击“参加考试”可进入）
- `exam-003`：已结束（显示“已结束”，点击“参加考试”后提示不可参加）
- `exam-004`：考试中（全年时间窗 `2026-01-01` 到 `2026-12-31`，用于稳定演示进入考试界面）

说明：学生端按钮始终显示为“参加考试”，可参加性在点击后校验并提示。

## 代码扩展建议

### 1. 新增页面

- 在 `scripts/` 中新增对应页面脚本文件
- 在 `scripts/main.js` 的 `renderProtectedRoute` 中接入路由分发
- 在 `scripts/layout.js` 中按角色补菜单项

### 2. 新增通用组件

- 优先放入 `scripts/components.js`
- 保持组件只做渲染，不直接改写数据

### 3. 新增样式

- 先判断属于 `auth`、`layout`、`components` 还是 `pages`
- 尽量不要把所有样式重新堆回 `styles.css`

### 4. 与其他模块协作

当前 Demo 中新增 / 编辑用户采用单角色分配，后续模块接入时按单一角色边界扩展即可。

建议其他同学按以下方式继续接入：

- 题库管理：新增 `scripts/pages-question-bank.js`
- 考试管理：已接入 `scripts/pages-exams.js`
- 成绩分析：新增 `scripts/pages-grades.js`
- 对应页面统一复用当前顶栏、侧边栏、角色上下文与状态存储逻辑





