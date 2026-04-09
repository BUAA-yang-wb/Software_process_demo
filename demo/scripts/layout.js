function renderAuthLayout({
  title,
  description,
  kicker,
  formContent,
  flash,
  footerContent,
  linkbar,
}) {
  const stats = getStats(getUsers());

  return `
    <div class="auth-shell">
      <section class="auth-side">
        <div class="auth-brand">
          <div class="brand-mark">
            <span class="brand-mark__icon">智</span>
            <span>智考云</span>
          </div>
          <div class="auth-copy-block">
            <h1 class="auth-title">让考试更简单</h1>
            <p class="auth-subtitle">
              面向课程与教学场景的考试系统入口，覆盖学生、教师与管理员三类角色。
            </p>
          </div>
          <div class="auth-detail-panel">
            <div class="auth-section-label">功能多样</div>
            <ul class="auth-feature-list">
              <li><span class="auth-feature-dot"></span> 智能易用，让工作更轻松</li>
              <li><span class="auth-feature-dot"></span> 安全稳定，让工作更放心</li>
              <li><span class="auth-feature-dot"></span> 直观报表，让工作更有效</li>
            </ul>
          </div>
          <div class="auth-stat-block">
            <div class="auth-section-label">账号概览</div>
            <div class="auth-stat-grid">
              <div class="auth-stat-card">
                <div class="auth-stat-label">平台账号总数</div>
                <div class="auth-stat-value">${stats.total}</div>
              </div>
              <div class="auth-stat-card">
                <div class="auth-stat-label">学生账号</div>
                <div class="auth-stat-value">${stats.students}</div>
              </div>
              <div class="auth-stat-card">
                <div class="auth-stat-label">教师 / 管理员</div>
                <div class="auth-stat-value">${stats.teachers} / ${stats.admins}</div>
              </div>
              <div class="auth-stat-card">
                <div class="auth-stat-label">异常账号状态</div>
                <div class="auth-stat-value">${stats.lockedOrDisabled}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="auth-side-footer">登录入口 · 用户中心 · 角色工作区</div>
      </section>
      <section class="auth-main">
        <div class="auth-main__inner">
          <div class="auth-linkbar">${linkbar}</div>
          <div class="auth-card">
            <span class="eyebrow">${kicker}</span>
            <h2>${title}</h2>
            ${description ? `<p>${description}</p>` : ""}
            ${renderInlineBanner(flash)}
            ${formContent}
            ${footerContent}
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderAppShell(page, ctx) {
  return `
    <div class="app-shell">
      <aside class="sidebar">
        ${renderSidebar(ctx)}
      </aside>
      <div class="app-main">
        <header class="topbar">
          <div class="topbar-left">
            <div>
              <div class="topbar-title">智考云</div>
              <div class="topbar-subtitle">当前视图：${roleLabels[ctx.role]} · ${ctx.scopeLabel}</div>
            </div>
          </div>
          <div class="topbar-right">
            ${renderRoleSwitcher(ctx)}
            <div class="user-chip">
              <div class="avatar">${escapeHtml(getInitials(ctx.currentUser.name))}</div>
              <div class="user-chip__meta">
                <div class="user-chip__name">${escapeHtml(ctx.currentUser.name)}</div>
                <div class="user-chip__role">${ctx.currentUser.loginName} · ${roleLabels[ctx.role]}</div>
              </div>
            </div>
            <button class="btn btn--secondary" type="button" data-action="logout">退出登录</button>
          </div>
        </header>
        <main class="page-wrap">
          ${renderInlineBanner(ctx.flash)}
          <section class="page-header">
            <div>
              <div class="kicker">${page.kicker}</div>
              <h1>${page.title}</h1>
              <p>${page.description}</p>
            </div>
            <div class="page-header__actions">${page.actions ?? ""}</div>
          </section>
          ${page.content}
        </main>
      </div>
    </div>
  `;
}

function renderSidebar(ctx) {
  const menu = getMenuItems(ctx.role);
  const metaTitle = ctx.role === "Admin" ? "管理员视图" : ctx.role === "Teacher" ? "教师视图" : "学生视图";

  return `
    <a class="sidebar-brand sidebar-brand--home" href="#/dashboard" aria-label="返回首页">
      <div class="brand-mark__icon">智</div>
      <div>
        <strong>智考云</strong>
        <span>考试管理系统</span>
      </div>
    </a>
    <nav class="sidebar-nav">
      ${menu
        .map((item) => {
          const active = isNavItemActive(ctx.route, item.key);
          return `
            <a class="nav-link ${active ? "is-active" : ""}" href="#${item.href}">
              <span class="nav-icon">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `;
        })
        .join("")}
    </nav>
    <div class="sidebar-meta">
      <h4>${metaTitle}</h4>
      <p>${ctx.roleEntrySummary}</p>
    </div>
  `;
}

function renderRoleSwitcher(ctx) {
  if (!ctx.currentUser.roles || ctx.currentUser.roles.length <= 1) {
    return "";
  }

  return `
    <select id="role-switcher" class="role-switcher" aria-label="切换角色">
      ${ctx.currentUser.roles
        .map((role) => `<option value="${role}" ${role === ctx.role ? "selected" : ""}>${roleLabels[role]}视图</option>`)
        .join("")}
    </select>
  `;
}

function getMenuItems(role) {
  if (role === "Student") {
    return [
      { key: "dashboard", href: "/dashboard", label: navMeta.dashboard.label, icon: navMeta.dashboard.icon },
      { key: "profile", href: "/profile", label: navMeta.profile.label, icon: navMeta.profile.icon },
    ];
  }

  return [
    { key: "dashboard", href: "/dashboard", label: navMeta.dashboard.label, icon: navMeta.dashboard.icon },
    { key: "users", href: "/users", label: navMeta.users.label, icon: navMeta.users.icon },
    { key: "profile", href: "/profile", label: navMeta.profile.label, icon: navMeta.profile.icon },
  ];
}

function isNavItemActive(route, key) {
  if (key === "users") {
    return route.name === "users" || route.name === "user-detail" || route.name === "user-edit" || route.name === "user-create";
  }

  if (key === "dashboard") {
    return route.name === "dashboard";
  }

  return route.name === "profile";
}
