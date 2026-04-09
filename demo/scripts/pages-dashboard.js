function renderDashboardPage(ctx) {
  if (ctx.role === "Student") {
    return renderStudentDashboard(ctx);
  }

  if (ctx.role === "Admin") {
    return renderAdminDashboard(ctx);
  }

  return renderTeacherDashboard(ctx);
}

function renderAdminDashboard(ctx) {
  const stats = getStats(ctx.visibleUsers);

  return {
    kicker: "管理员视图",
    title: `你好，${escapeHtml(ctx.currentUser.name)}`,
    description: "管理全平台账号、角色分配与状态策略。",
    actions: `
      <a class="btn btn--primary" href="#/users/new">新增用户</a>
      <a class="btn btn--secondary" href="#/users">用户管理</a>
    `,
    content: `
      <section class="hero-card">
        <div>
          <span class="eyebrow">系统管理</span>
          <h2>全平台用户总览</h2>
          <p>
            统一查看全平台教师、学生与管理员账号，集中完成角色配置与状态维护。
          </p>
          <div class="panel-note">
            管理员可查看全部账号，并负责角色分配、异常处理与全局维护。
          </div>
        </div>
        <div class="hero-side">
          <div class="hero-pill-grid">
            <div class="hero-pill">
              <div class="hero-pill__label">当前角色</div>
              <div class="hero-pill__value">${roleLabels[ctx.role]}</div>
            </div>
            <div class="hero-pill">
              <div class="hero-pill__label">管理范围</div>
              <div class="hero-pill__value">全平台</div>
            </div>
            <div class="hero-pill">
              <div class="hero-pill__label">最近登录</div>
              <div class="hero-pill__value">${formatDateTime(ctx.currentUser.lastLoginAt)}</div>
            </div>
            <div class="hero-pill">
              <div class="hero-pill__label">账号状态</div>
              <div class="hero-pill__value">${statusLabels[ctx.currentUser.status]}</div>
            </div>
          </div>
        </div>
      </section>
      <section class="stats-grid">
        ${renderStatCard("用户总数", stats.total, "覆盖全平台账号")}
        ${renderStatCard("学生账号", stats.students, "支持考试与成绩查看")}
        ${renderStatCard("教师账号", stats.teachers, "支持教学与考试组织")}
        ${renderStatCard("管理员账号", stats.admins, "负责全局配置与维护")}
      </section>
      <section class="section-grid">
        <div class="card">
          <h3>管理员能力</h3>
          <p>用于区分教师端的业务维护与管理员端的全局治理。</p>
          <div class="quick-grid">
            ${renderQuickCard("户", "全量用户", "查看教师、学生与管理员全部账号。")}
            ${renderQuickCard("角", "角色分配", "配置账号角色与管理范围。")}
            ${renderQuickCard("安", "状态维护", "处理锁定、冻结与密码重置。")}
            ${renderQuickCard("审", "操作留痕", "保留关键操作记录，便于后续追溯。")}
          </div>
        </div>
        <div class="card">
          <h3>管理提醒</h3>
          <p>聚焦全平台账号安全与角色边界。</p>
          ${renderSafetyNotices(stats.lockedOrDisabled)}
        </div>
      </section>
    `,
  };
}

function renderTeacherDashboard(ctx) {
  const roster = getManagedStudentsForTeacher(ctx.currentUser.id, ctx.users);
  const activeStudents = roster.filter((user) => user.status === "active").length;
  const flaggedStudents = roster.filter((user) => user.status !== "active").length;
  const coveredClasses = new Set(roster.map((user) => user.classId).filter(Boolean)).size;

  return {
    kicker: "教师视图",
    title: `你好，${escapeHtml(ctx.currentUser.name)}`,
    description: "查看本人及所属学生账号，完成学生名单维护。",
    actions: `
      <a class="btn btn--primary" href="#/users/new">新增学生</a>
      <a class="btn btn--soft" href="#/exams/new">新建考试</a>
      <a class="btn btn--secondary" href="#/users">学生名单</a>
    `,
    content: `
      <section class="hero-card">
        <div>
          <span class="eyebrow">教师工作区</span>
          <h2>我的学生与账号状态</h2>
          <p>
            教师端仅展示本人和所属学生信息，避免越权查看管理员或其他教师账号。
          </p>
          <div class="panel-note">
            学生可来自不同班级或培养层次，归属范围以教师负责关系为准。
          </div>
        </div>
        <div class="hero-side">
          <div class="hero-pill-grid">
            <div class="hero-pill">
              <div class="hero-pill__label">当前角色</div>
              <div class="hero-pill__value">${roleLabels[ctx.role]}</div>
            </div>
            <div class="hero-pill">
              <div class="hero-pill__label">所属学生</div>
              <div class="hero-pill__value">${roster.length}</div>
            </div>
            <div class="hero-pill">
              <div class="hero-pill__label">覆盖班级</div>
              <div class="hero-pill__value">${coveredClasses}</div>
            </div>
            <div class="hero-pill">
              <div class="hero-pill__label">最近登录</div>
              <div class="hero-pill__value">${formatDateTime(ctx.currentUser.lastLoginAt)}</div>
            </div>
          </div>
        </div>
      </section>
      <section class="stats-grid">
        ${renderStatCard("我的学生", roster.length, "当前教师名下学生总数")}
        ${renderStatCard("正常账号", activeStudents, "可正常登录和使用")}
        ${renderStatCard("异常状态", flaggedStudents, "建议优先跟进处理")}
        ${renderStatCard("当前视图", 1, "教师仅查看本人及所属学生")}
      </section>
      <section class="section-grid">
        <div class="card">
          <h3>常用入口</h3>
          <p>围绕教学场景中的学生账号维护展开。</p>
          <div class="quick-grid">
            ${renderQuickCard("新", "新增学生", "为本人负责的学生建立账号。")}
            ${renderQuickCard("查", "名单检索", "按姓名、登录名、班级快速定位学生。")}
            ${renderQuickCard("资", "资料维护", "更新学生基础资料与联系方式。")}
            ${renderQuickCard("安", "状态处理", "执行冻结、恢复与密码重置。")}
          </div>
        </div>
        <div class="card">
          <h3>范围说明</h3>
          <div class="support-list">
            <div class="support-item">
              <span class="icon-badge">我</span>
              <div>
                <strong>本人信息</strong>
                <div class="muted">教师可查看自己的账号信息，用于核对当前身份。</div>
              </div>
            </div>
            <div class="support-item">
              <span class="icon-badge">生</span>
              <div>
                <strong>所属学生</strong>
                <div class="muted">仅展示归属当前教师的学生账号，不展示管理员信息。</div>
              </div>
            </div>
            <div class="support-item">
              <span class="icon-badge">限</span>
              <div>
                <strong>角色边界</strong>
                <div class="muted">教师不负责管理员角色配置；角色分配由管理员统一处理。</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `,
  };
}

function renderStudentDashboard(ctx) {
  return {
    kicker: "工作台",
    title: `欢迎回来，${escapeHtml(ctx.currentUser.name)}`,
    description: "查看个人资料、账号状态与常用入口。",
    actions: `
      <a class="btn btn--soft" href="#/exams">我的考试</a>
      <a class="btn btn--primary" href="#/profile">个人资料</a>
    `,
    content: `
      <section class="hero-card">
        <div>
          <span class="eyebrow">工作台</span>
          <h2>个人中心概览</h2>
          <p>
            在这里查看个人资料、账号状态、最近登录与常用服务入口。
          </p>
          <div class="panel-note">
            页面内容会根据当前账号角色自动匹配对应工作区。
          </div>
        </div>
        <div class="hero-side">
          <div class="hero-pill-grid">
            <div class="hero-pill">
              <div class="hero-pill__label">当前角色</div>
              <div class="hero-pill__value">${roleLabels[ctx.role]}</div>
            </div>
            <div class="hero-pill">
              <div class="hero-pill__label">账号状态</div>
              <div class="hero-pill__value">${statusLabels[ctx.currentUser.status]}</div>
            </div>
            <div class="hero-pill">
              <div class="hero-pill__label">所属班级</div>
              <div class="hero-pill__value">${escapeHtml(ctx.currentUser.classId || "未设置")}</div>
            </div>
            <div class="hero-pill">
              <div class="hero-pill__label">最近登录</div>
              <div class="hero-pill__value">${formatDateTime(ctx.currentUser.lastLoginAt)}</div>
            </div>
          </div>
        </div>
      </section>
      <section class="section-grid">
        <div class="card">
          <h3>常用服务</h3>
          <div class="quick-grid">
            ${renderQuickCard("资", "个人资料", "维护姓名、邮箱、班级与联系方式。")}
            ${renderQuickCard("考", "我的考试", "查看已分配考试并进入考试详情。")}
            ${renderQuickCard("安", "账号安全", "查看登录状态与密码重置提示。")}
            ${renderQuickCard("服", "服务入口", "从工作台进入常用功能。")}
            ${renderQuickCard("息", "资料核对", "快速确认账号状态、班级与联系方式。")}
          </div>
        </div>
        <div class="card">
          <h3>账号提醒</h3>
          <div class="support-list">
            <div class="support-item">
              <span class="icon-badge">资</span>
              <div>
                <strong>完善个人资料</strong>
                <div class="muted">建议及时核对邮箱、手机号与班级信息。</div>
              </div>
            </div>
            <div class="support-item">
              <span class="icon-badge">安</span>
              <div>
                <strong>关注登录安全</strong>
                <div class="muted">若检测到异地登录，需要重新认证。</div>
              </div>
            </div>
            <div class="support-item">
              <span class="icon-badge">视</span>
              <div>
                <strong>角色视图</strong>
                <div class="muted">不同账号登录后会自动进入对应的功能视图。</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `,
  };
}

