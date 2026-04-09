function renderPublicRoute(route, flash) {
  if (route.name === "login") {
    return renderLoginPage(flash);
  }

  if (route.name === "register") {
    return renderRegisterPage(flash);
  }

  return renderForgotPasswordPage(flash);
}

function renderProtectedRoute(route, ctx) {
  switch (route.name) {
    case "dashboard":
      return renderDashboardPage(ctx);
    case "users":
      return renderUsersPage(ctx);
    case "user-create":
      return renderUserFormPage(ctx, null);
    case "user-edit": {
      const targetUser = ctx.users.find((user) => user.id === route.params.userId) ?? null;

      if (!targetUser) {
        return renderNotFoundPage(ctx, "没有找到要编辑的用户。", "当前请求的用户不存在或已被移除。");
      }

      if (!canManageUserByScope(ctx.role, ctx.currentUser, targetUser)) {
        return renderForbiddenPage(ctx, "当前角色不能编辑该用户。", "你只能维护当前权限范围内的用户。", "#/users");
      }

      return renderUserFormPage(ctx, targetUser);
    }
    case "user-detail": {
      const detailUser = ctx.users.find((user) => user.id === route.params.userId) ?? null;

      if (!detailUser) {
        return renderNotFoundPage(ctx, "没有找到对应的用户详情。", "当前请求的用户不存在或已被移除。");
      }

      if (!canViewUserByScope(ctx.role, ctx.currentUser, detailUser)) {
        return renderForbiddenPage(ctx, "当前角色不能查看该用户。", "你只能查看当前权限范围内的用户。", "#/users");
      }

      return renderUserDetailPage(ctx, detailUser);
    }
    case "profile":
      return renderProfilePage(ctx);
    case "exams":
      return renderExamsPage(ctx);
    case "exam-create":
      return renderExamFormPage(ctx, null);
    case "exam-taking": {
      const targetExam = ctx.exams.find((exam) => exam.id === route.params.examId) ?? null;

      if (!targetExam) {
        return renderNotFoundPage(ctx, "没有找到对应考试任务。", "当前请求的考试不存在或已被移除。");
      }

      const canTake =
        ctx.role === "Student" &&
        targetExam.status === "published" &&
        targetExam.assignedStudentIds.includes(ctx.currentUser.id) &&
        getExamPhase(targetExam) === "ongoing";

      if (!canTake) {
        return renderForbiddenPage(ctx, "当前考试不可进入。", "仅考试中的已分配考试可进入。", "#/exams");
      }

      return renderExamTakingPage(ctx, targetExam);
    }
    case "exam-edit": {
      const targetExam = ctx.exams.find((exam) => exam.id === route.params.examId) ?? null;

      if (!targetExam) {
        return renderNotFoundPage(ctx, "没有找到要编辑的考试任务。", "当前请求的考试不存在或已被移除。");
      }

      if (ctx.role === "Teacher" && targetExam.createdBy !== ctx.currentUser.id) {
        return renderForbiddenPage(ctx, "当前角色不能编辑该考试任务。", "你只能维护自己创建的考试任务。", "#/exams");
      }

      return renderExamFormPage(ctx, targetExam);
    }
    case "exam-detail": {
      const targetExam = ctx.exams.find((exam) => exam.id === route.params.examId) ?? null;

      if (!targetExam) {
        return renderNotFoundPage(ctx, "没有找到对应考试任务。", "当前请求的考试不存在或已被移除。");
      }

      if (ctx.role === "Teacher" && targetExam.createdBy !== ctx.currentUser.id) {
        return renderForbiddenPage(ctx, "当前角色不能查看该考试任务。", "教师只能查看自己创建的考试任务。", "#/exams");
      }

      if (ctx.role === "Student") {
        const canView = targetExam.status === "published" && targetExam.assignedStudentIds.includes(ctx.currentUser.id);

        if (!canView) {
          return renderForbiddenPage(ctx, "当前考试任务不可访问。", "你只能查看已分配给自己的已发布考试。", "#/exams");
        }
      }

      return renderExamDetailPage(ctx, targetExam);
    }
    case "forbidden":
      return renderForbiddenPage(ctx, "当前角色没有访问目标资源的权限。");
    default:
      return renderNotFoundPage(ctx);
  }
}

function renderApp() {
  const path = getHashPath();
  const route = resolveRoute(path);
  const flash = consumeFlash();
  const session = validateSessionState();

  if (route.name === "root") {
    navigate(session ? "/dashboard" : "/login");
    return;
  }

  if (route.public && session) {
    navigate("/dashboard");
    return;
  }

  if (route.requiresAuth && !session) {
    setFlash("请先登录后再访问该页面。", "info");
    navigate("/login");
    return;
  }

  const users = getUsers();
  const currentUser = getCurrentUserFromSession(session, users);

  if (route.allowedRoles && !route.allowedRoles.includes(session.currentRole)) {
    const ctx = createRenderContext({
      route: { name: "forbidden" },
      session,
      currentUser,
      users,
      flash,
    });
    const page = renderForbiddenPage(ctx, "当前角色没有访问此页面的权限。");
    appRoot.innerHTML = renderAppShell(page, ctx);
    return;
  }

  if (route.public) {
    appRoot.innerHTML = renderPublicRoute(route, flash);
    return;
  }

  const ctx = createRenderContext({
    route,
    session,
    currentUser,
    users,
    flash,
  });

  const page = renderProtectedRoute(route, ctx);
  appRoot.innerHTML = renderAppShell(page, ctx);
}

function initializeApp() {
  initializeRuntimeRefs();
  seedDemoData();

  window.addEventListener("hashchange", renderApp);
  window.addEventListener("storage", handleStorageSync);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);

  window.ExamPortalTools = {
    resetData: resetLocalData,
    simulateRemoteLogin,
    listAccounts: () => cloneData(demoAccounts),
    listExams: () => cloneData(getExams()),
  };

  if (!location.hash) {
    location.hash = getCurrentSession() ? "#/dashboard" : "#/login";
  } else {
    renderApp();
  }
}
