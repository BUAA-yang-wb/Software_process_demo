function handleSubmit(event) {
  const { target } = event;

  if (!(target instanceof HTMLFormElement)) {
    return;
  }

  if (target.id === "login-form") {
    event.preventDefault();
    handleLoginSubmit(target);
    return;
  }

  if (target.id === "register-form") {
    event.preventDefault();
    handleRegisterSubmit(target);
    return;
  }

  if (target.id === "forgot-password-form") {
    event.preventDefault();
    handleForgotPasswordSubmit(target);
    return;
  }

  if (target.id === "user-filters-form") {
    event.preventDefault();
    const formData = new FormData(target);
    appState.userFilters = {
      query: String(formData.get("query") || ""),
      role: String(formData.get("role") || "all"),
      status: String(formData.get("status") || "all"),
    };
    renderApp();
    return;
  }

  if (target.id === "question-filters-form") {
    event.preventDefault();
    const formData = new FormData(target);
    appState.questionFilters = {
      query: String(formData.get("query") || ""),
      type: String(formData.get("type") || "all"),
      difficulty: String(formData.get("difficulty") || "all"),
      status: String(formData.get("status") || "all"),
    };
    renderApp();
    return;
  }

  if (target.id === "user-form") {
    event.preventDefault();
    handleUserFormSubmit(target);
    return;
  }

  if (target.id === "exam-filters-form") {
    event.preventDefault();
    const formData = new FormData(target);
    appState.examFilters = {
      query: String(formData.get("query") || ""),
      status: String(formData.get("status") || "all"),
      teacherId: String(formData.get("teacherId") || appState.examFilters.teacherId || "all"),
    };
    renderApp();
    return;
  }

  if (target.id === "exam-form") {
    event.preventDefault();
    handleExamFormSubmit(target);
    return;
  }

  if (target.id === "exam-assignment-form") {
    event.preventDefault();
    handleExamAssignmentSubmit(target);
    return;
  }

  if (target.id === "profile-form") {
    event.preventDefault();
    handleProfileSubmit(target);
    return;
  }

  if (target.id === "question-form") {
    event.preventDefault();
    handleQuestionFormSubmit(target);
    return;
  }

  if (target.id === "question-review-form") {
    event.preventDefault();
    handleQuestionReviewSubmit(target);
    return;
  }

  if (target.id === "question-import-form") {
    event.preventDefault();
    handleQuestionImportSubmit(target);
  }
}

function handleChange(event) {
  const { target } = event;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.id === "role-switcher") {
    handleRoleSwitch(target.value);
  }
}

function handleClick(event) {
  const target = event.target instanceof HTMLElement ? event.target.closest("[data-action]") : null;

  if (!target) {
    return;
  }

  const action = target.dataset.action;

  if (action === "logout") {
    handleLogout();
    return;
  }

  if (action === "toggle-user-status") {
    handleToggleUserStatus(target.dataset.userId, target.dataset.nextStatus);
    return;
  }

  if (action === "reset-password") {
    handleResetPassword(target.dataset.userId);
    return;
  }

  if (action === "reset-filters") {
    appState.userFilters = { query: "", role: "all", status: "all" };
    renderApp();
    return;
  }

  if (action === "reset-exam-filters") {
    appState.examFilters = { query: "", status: "all", teacherId: "all" };
    renderApp();
    return;
  }

  if (action === "reset-question-filters") {
    appState.questionFilters = { query: "", type: "all", difficulty: "all", status: "all" };
    renderApp();
    return;
  }

  if (action === "publish-exam") {
    handlePublishExam(target.dataset.examId);
    return;
  }

  if (action === "delete-exam") {
    handleDeleteExam(target.dataset.examId);
    return;
  }

  if (action === "mock-enter-exam") {
    const session = getCurrentSession();
    const users = getUsers();
    const currentUser = getCurrentUserFromSession(session, users);
    const exam = getExams().find((item) => item.id === target.dataset.examId);

    if (!session || !currentUser || !exam) {
      showToast("考试信息不存在或登录状态失效。", "warning");
      return;
    }

    if (session.currentRole !== "Student") {
      showToast("当前入口仅面向学生考试流程。", "warning");
      return;
    }

    if (!exam.assignedStudentIds.includes(currentUser.id) || exam.status !== "published") {
      showToast("当前考试未分配给你或尚未发布。", "warning");
      return;
    }

    const phase = getExamPhase(exam);

    if (phase !== "ongoing") {
      showToast(`${getExamPhaseMeta(phase).label}，暂不可参加。`, "warning");
      return;
    }

    navigate(`/exams/${exam.id}/take`);
    return;
  }

  if (action === "submit-exam") {
    const session = getCurrentSession();
    const users = getUsers();
    const currentUser = getCurrentUserFromSession(session, users);
    const exam = getExams().find((item) => item.id === target.dataset.examId);

    if (!session || !currentUser || !exam || session.currentRole !== "Student") {
      showToast("提交失败，请刷新后重试。", "warning");
      return;
    }

    setFlash(`你已提交《${exam.title}》。`, "success");
    navigate(`/exams/${exam.id}`);
    return;
  }

  if (action === "submit-question-review") {
    handleSubmitQuestionReview(target.dataset.questionId);
    return;
  }

  if (action === "clone-sample-question") {
    handleCloneSampleQuestion();
    return;
  }
}

function handleExamFormSubmit(form) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);
  const editingId = form.dataset.examId || "";

  if (!currentSession || !currentUser || !["Teacher", "Admin"].includes(currentSession.currentRole)) {
    showToast("当前角色无权维护考试任务。", "warning");
    return;
  }

  const exams = getExams();
  const editingExam = editingId ? exams.find((exam) => exam.id === editingId) ?? null : null;

  if (editingId && !editingExam) {
    showToast("目标考试不存在。", "warning");
    navigate("/exams");
    return;
  }

  if (editingExam && currentSession.currentRole === "Teacher" && editingExam.createdBy !== currentUser.id) {
    showToast("你只能编辑自己创建的考试任务。", "warning");
    navigate("/exams");
    return;
  }
  const formData = new FormData(form);
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startAt = String(formData.get("startAt") || "").trim();
  const endAt = String(formData.get("endAt") || "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") || 0);
  const allowSwitchCount = Number(formData.get("allowSwitchCount") || 0);
  const shuffleQuestions = Boolean(formData.get("shuffleQuestions"));
  const teacherIdFromForm = String(formData.get("teacherId") || "").trim();

  if (!title) {
    showToast("请填写考试标题。", "warning");
    return;
  }

  if (!startAt || !endAt) {
    showToast("请设置考试开始与结束时间。", "warning");
    return;
  }

  const startDate = new Date(startAt);
  const endDate = new Date(endAt);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    showToast("考试时间格式不正确。", "warning");
    return;
  }

  if (endDate <= startDate) {
    showToast("结束时间必须晚于开始时间。", "warning");
    return;
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    showToast("答题时长必须为正整数。", "warning");
    return;
  }

  if (!Number.isFinite(allowSwitchCount) || allowSwitchCount < 0) {
    showToast("允许切屏次数不能为负数。", "warning");
    return;
  }

  let ownerTeacherId = currentUser.id;

  if (currentSession.currentRole === "Admin") {
    ownerTeacherId = teacherIdFromForm || editingExam?.createdBy || "";
    const ownerTeacher = users.find((user) => user.id === ownerTeacherId && user.primaryRole === "Teacher" && user.status === "active");

    if (!ownerTeacher) {
      showToast("请先选择有效教师后再保存考试。", "warning");
      return;
    }
  }

  const now = new Date().toISOString();
  let savedExam;
  let nextExams;

  if (editingExam) {
    savedExam = {
      ...editingExam,
      createdBy: ownerTeacherId,
      title,
      description,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      durationMinutes,
      allowSwitchCount,
      shuffleQuestions,
      updatedAt: now,
    };

    nextExams = exams.map((exam) => (exam.id === savedExam.id ? savedExam : exam));
  } else {
    savedExam = {
      id: createId("exam"),
      title,
      description,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      durationMinutes,
      allowSwitchCount,
      shuffleQuestions,
      status: "draft",
      assignedStudentIds: [],
      createdBy: ownerTeacherId,
      createdAt: now,
      updatedAt: now,
      publishedAt: "",
    };

    nextExams = [savedExam, ...exams];
  }

  saveExams(nextExams);
  appendAuditLog({
    userId: currentUser.id,
    action: editingExam ? "update:exam" : "create:exam",
    targetId: savedExam.id,
    detail: `${currentUser.name}${editingExam ? "更新" : "创建"}了考试任务 ${savedExam.title}。`,
  });

  showToast(editingExam ? "考试任务已更新。" : "考试任务已创建。", "success");
  navigate(editingExam ? `/exams/${savedExam.id}` : "/exams");
}

function handleQuestionFormSubmit(form) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);

  if (!currentSession || !currentUser) {
    setFlash("登录状态已失效，请重新登录。", "warning");
    navigate("/login");
    return;
  }

  if (!hasPermission({ permissions: getPermissionsForRole(currentSession.currentRole) }, "question:create")) {
    showToast("当前角色无权维护试题。", "warning");
    return;
  }

  const editingId = form.dataset.questionId || "";
  const questions = getQuestions();
  const editingTarget = editingId ? questions.find((item) => item.id === editingId) ?? null : null;

  if (editingId && !editingTarget) {
    showToast("目标试题不存在。", "danger");
    navigate("/question-bank");
    return;
  }

  if (editingTarget && !canManageQuestionByScope(currentSession.currentRole, currentUser, editingTarget)) {
    showToast("当前角色不能编辑该试题。", "warning");
    navigate("/question-bank");
    return;
  }

  const formData = new FormData(form);
  const type = String(formData.get("type") || "single").trim();
  const stem = String(formData.get("stem") || "").trim();
  const answer = String(formData.get("answer") || "").trim();
  const analysis = String(formData.get("analysis") || "").trim();
  const optionsText = String(formData.get("optionsText") || "").trim();
  const options = optionsText
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  const score = Number(formData.get("score"));
  const difficulty = Number(formData.get("difficulty"));
  const knowledgePoint = String(formData.get("knowledgePoint") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const chapter = String(formData.get("chapter") || "").trim();
  const tags = String(formData.get("tagsText") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const estimatedMinutes = Number(formData.get("estimatedMinutes"));
  const mediaName = String(formData.get("mediaName") || "").trim();
  const language = String(formData.get("language") || "").trim();
  const sharedScope = String(formData.get("sharedScope") || "personal").trim();

  if (!stem) {
    showToast("题干内容不能为空。", "warning");
    return;
  }

  if (!answer) {
    showToast("参考答案不能为空。", "warning");
    return;
  }

  if (!Number.isFinite(score) || score < 0) {
    showToast("分值必须大于等于 0。", "warning");
    return;
  }

  if (!Number.isFinite(difficulty) || difficulty < 1 || difficulty > 5) {
    showToast("难度级别必须在 1-5 之间。", "warning");
    return;
  }

  const now = new Date().toISOString();
  let savedQuestion;

  if (editingTarget) {
    savedQuestion = {
      ...editingTarget,
      type,
      stem,
      answer,
      analysis,
      options,
      score,
      difficulty,
      knowledgePoint,
      subject,
      chapter,
      tags,
      estimatedMinutes: Number.isFinite(estimatedMinutes) ? Math.max(1, estimatedMinutes) : editingTarget.estimatedMinutes,
      mediaName,
      language,
      sharedScope,
      updatedAt: now,
      version: (editingTarget.version || 1) + 1,
    };
  } else {
    savedQuestion = {
      id: createId("question"),
      type,
      stem,
      answer,
      analysis,
      options,
      score,
      difficulty,
      knowledgePoint,
      subject,
      chapter,
      tags,
      estimatedMinutes: Number.isFinite(estimatedMinutes) ? Math.max(1, estimatedMinutes) : 3,
      mediaName,
      language,
      sharedScope,
      status: "draft",
      version: 1,
      usageCount: 0,
      correctRate: 0,
      createdBy: currentSession.userId,
      reviewerId: "",
      reviewComment: "",
      createdAt: now,
      updatedAt: now,
      reviewedAt: "",
    };
  }

  const nextQuestions = editingTarget
    ? questions.map((item) => (item.id === editingTarget.id ? savedQuestion : item))
    : [savedQuestion, ...questions];

  saveQuestions(nextQuestions);
  appendAuditLog({
    userId: currentSession.userId,
    action: editingTarget ? "update:question" : "create:question",
    targetId: savedQuestion.id,
    detail: `${currentUser.name}${editingTarget ? "更新" : "创建"}了试题：${savedQuestion.stem.slice(0, 20)}${savedQuestion.stem.length > 20 ? "..." : ""}`,
  });

  showToast(editingTarget ? "试题已更新。" : "试题草稿已创建。", "success");
  navigate(`/question-bank/${savedQuestion.id}`);
}

function handleExamAssignmentSubmit(form) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);
  const examId = form.dataset.examId || "";

  if (!currentSession || !currentUser || !["Teacher", "Admin"].includes(currentSession.currentRole)) {
    showToast("当前角色无权维护考试分配。", "warning");
    return;
  }

  const exams = getExams();
  const exam = exams.find((item) => item.id === examId);

  if (!exam) {
    showToast("考试任务不存在。", "warning");
    navigate("/exams");
    return;
  }

  if (currentSession.currentRole === "Teacher" && exam.createdBy !== currentUser.id) {
    showToast("只能维护自己创建的考试任务。", "warning");
    navigate("/exams");
    return;
  }

  const formData = new FormData(form);
  const selectedIds = Array.from(new Set(formData.getAll("studentIds").map((value) => String(value))));
  const validStudentIds = getManagedStudentsForTeacher(exam.createdBy, users)
    .filter((student) => student.status === "active")
    .map((student) => student.id);
  const nextAssigned = selectedIds.filter((id) => validStudentIds.includes(id));

  const nextExams = exams.map((item) =>
    item.id === exam.id
      ? {
          ...item,
          assignedStudentIds: nextAssigned,
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveExams(nextExams);
  appendAuditLog({
    userId: currentUser.id,
    action: "assign:exam",
    targetId: exam.id,
    detail: `${currentUser.name}更新了考试任务 ${exam.title} 的分配名单，共 ${nextAssigned.length} 人。`,
  });

  showToast("考试分配已保存。", "success");
  renderApp();
}

function handlePublishExam(examId) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);

  if (!currentSession || !currentUser || !["Teacher", "Admin"].includes(currentSession.currentRole)) {
    showToast("当前角色无权发布考试。", "warning");
    return;
  }

  const exams = getExams();
  const target = exams.find((exam) => exam.id === examId);

  if (!target) {
    showToast("考试任务不存在。", "warning");
    return;
  }

  if (currentSession.currentRole === "Teacher" && target.createdBy !== currentUser.id) {
    showToast("只能发布自己创建的考试任务。", "warning");
    return;
  }

  if (target.status === "published") {
    showToast("该考试已经发布。", "info");
    return;
  }

  if (!target.assignedStudentIds.length) {
    showToast("请先分配学生后再发布考试。", "warning");
    return;
  }

  if (!target.startAt || !target.endAt || new Date(target.endAt) <= new Date(target.startAt)) {
    showToast("考试时间窗无效，无法发布。", "warning");
    return;
  }

  const now = new Date().toISOString();
  const nextExams = exams.map((exam) =>
    exam.id === target.id
      ? {
          ...exam,
          status: "published",
          publishedAt: now,
          updatedAt: now,
        }
      : exam
  );

  saveExams(nextExams);
  appendAuditLog({
    userId: currentUser.id,
    action: "publish:exam",
    targetId: target.id,
    detail: `${currentUser.name}发布了考试任务 ${target.title}。`,
  });

  showToast("考试已发布。", "success");
  renderApp();
}

function handleSubmitQuestionReview(questionId) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);

  if (!currentSession || !currentUser || !questionId) {
    return;
  }

  const questions = getQuestions();
  const target = questions.find((item) => item.id === questionId);

  if (!target) {
    showToast("目标试题不存在。", "danger");
    return;
  }

  if (!canManageQuestionByScope(currentSession.currentRole, currentUser, target)) {
    showToast("当前角色不能提交该试题审核。", "warning");
    return;
  }

  if (!(target.status === "draft" || target.status === "rejected")) {
    showToast("仅草稿或已驳回试题可提交审核。", "warning");
    return;
  }

  const now = new Date().toISOString();
  const nextQuestions = questions.map((item) =>
    item.id === questionId
      ? {
        ...item,
        status: "pending",
        updatedAt: now,
        reviewComment: "",
        reviewerId: "",
        reviewedAt: "",
      }
      : item
  );

  saveQuestions(nextQuestions);
  appendAuditLog({
    userId: currentSession.userId,
    action: "submit:question",
    targetId: questionId,
    detail: `${currentUser.name} 提交了试题审核。`,
  });
  showToast("试题已提交审核。", "success");
  renderApp();
}

function handleQuestionReviewSubmit(form) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);

  if (!currentSession || !currentUser) {
    return;
  }

  if (!hasPermission({ permissions: getPermissionsForRole(currentSession.currentRole) }, "question:review")) {
    showToast("当前角色没有审核权限。", "warning");
    return;
  }

  const questionId = form.dataset.questionId || "";
  const formData = new FormData(form);
  const result = String(formData.get("result") || "").trim();
  const comment = String(formData.get("comment") || "").trim();

  if (result !== "approved" && result !== "rejected") {
    showToast("审核结果必须为通过或驳回。", "warning");
    return;
  }

  const questions = getQuestions();
  const questionTarget = questions.find((item) => item.id === questionId);

  if (!questionTarget) {
    showToast("目标试题不存在。", "danger");
    return;
  }

  if (questionTarget.status !== "pending") {
    showToast("仅待审核试题可执行审核操作。", "warning");
    return;
  }

  const now = new Date().toISOString();
  const nextQuestions = questions.map((item) =>
    item.id === questionId
      ? {
          ...item,
          status: result,
          updatedAt: now,
          reviewerId: currentSession.userId,
          reviewedAt: now,
          reviewComment: comment,
          version: (item.version || 1) + 1,
        }
      : item
  );

  saveQuestions(nextQuestions);
  appendAuditLog({
    userId: currentSession.userId,
    action: "review:question",
    targetId: questionId,
    detail: `${currentUser.name}${result === "approved" ? "通过" : "驳回"}了试题审核。`,
  });

  showToast(`审核已提交：${result === "approved" ? "通过" : "驳回"}。`, "success");
  renderApp();
}

function handleDeleteExam(examId) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);

  if (!currentSession || !currentUser || !["Teacher", "Admin"].includes(currentSession.currentRole)) {
    showToast("当前角色无权删除考试。", "warning");
    return;
  }

  const exams = getExams();
  const target = exams.find((exam) => exam.id === examId);

  if (!target) {
    showToast("考试任务不存在。", "warning");
    return;
  }

  if (currentSession.currentRole === "Teacher" && target.createdBy !== currentUser.id) {
    showToast("只能删除自己创建的考试任务。", "warning");
    return;
  }

  const nextExams = exams.filter((exam) => exam.id !== examId);
  saveExams(nextExams);
  appendAuditLog({
    userId: currentUser.id,
    action: "delete:exam",
    targetId: examId,
    detail: `${currentUser.name}删除了考试任务 ${target.title}。`,
  });

  showToast("考试任务已删除。", "success");

  if (getHashPath() === `/exams/${examId}` || getHashPath() === `/exams/${examId}/edit`) {
    navigate("/exams");
    return;
  }

  renderApp();
}

function handleQuestionImportSubmit(form) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);

  if (!currentSession || !currentUser) {
    return;
  }

  if (!hasPermission({ permissions: getPermissionsForRole(currentSession.currentRole) }, "question:import")) {
    showToast("当前角色没有批量导入权限。", "warning");
    return;
  }

  const formData = new FormData(form);
  const format = String(formData.get("format") || "").trim();
  const fileName = String(formData.get("fileName") || "").trim();
  const count = Number(formData.get("count"));

  if (!["Excel", "Word", "TXT"].includes(format)) {
    showToast("文件格式不支持。", "warning");
    return;
  }

  if (!fileName) {
    showToast("请上传有效的文件。", "warning");
    return;
  }

  if (!Number.isFinite(count) || count < 1 || count > 20) {
    showToast("模拟导入条数需在 1 到 20 之间。", "warning");
    return;
  }

  const now = new Date().toISOString();
  const imported = Array.from({ length: count }).map((_, index) => ({
    id: createId("question"),
    type: "single",
    stem: `导入试题 ${index + 1}（来源：${fileName}）`,
    options: ["A. 选项一", "B. 选项二", "C. 选项三", "D. 选项四"],
    answer: "A",
    analysis: "导入示例题，建议后续补充解析。",
    score: 10,
    difficulty: 3,
    knowledgePoint: "待补充",
    subject: "待归类",
    chapter: "待归类",
    tags: ["导入"],
    estimatedMinutes: 3,
    status: "draft",
    version: 1,
    usageCount: 0,
    correctRate: 0,
    createdBy: currentSession.userId,
    reviewerId: "",
    reviewComment: "",
    createdAt: now,
    updatedAt: now,
    reviewedAt: "",
    mediaName: "",
    language: "",
    sharedScope: "personal",
  }));

  const nextQuestions = [...imported, ...getQuestions()];
  saveQuestions(nextQuestions);
  appendAuditLog({
    userId: currentSession.userId,
    action: "import:question",
    targetId: fileName,
    detail: `${currentUser.name} 通过 ${format} 模板批量导入 ${count} 道试题。`,
  });

  showToast(`导入完成：成功 ${count} 条，失败 0 条。`, "success");
  renderApp();
}

function handleCloneSampleQuestion() {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);

  if (!currentSession || !currentUser) {
    return;
  }

  const source = getQuestions()[0];

  if (!source) {
    showToast("当前没有可克隆的示例题。", "warning");
    return;
  }

  const now = new Date().toISOString();
  const cloned = {
    ...source,
    id: createId("question"),
    stem: `${source.stem}（克隆）`,
    status: "draft",
    version: 1,
    usageCount: 0,
    correctRate: 0,
    createdBy: currentSession.userId,
    reviewerId: "",
    reviewComment: "",
    createdAt: now,
    updatedAt: now,
    reviewedAt: "",
  };

  saveQuestions([cloned, ...getQuestions()]);
  appendAuditLog({
    userId: currentSession.userId,
    action: "clone:question",
    targetId: cloned.id,
    detail: `${currentUser.name} 克隆了一道示例试题。`,
  });
  showToast("已克隆一条示例试题草稿。", "success");
  navigate(`/question-bank/${cloned.id}`);
}

function handleLoginSubmit(form) {
  const formData = new FormData(form);
  const loginName = String(formData.get("loginName") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!loginName || !password) {
    showToast("请输入账号和密码。", "warning");
    return;
  }

  const users = getUsers();
  const user = users.find((item) => item.loginName === loginName || item.email === loginName);

  if (!user) {
    showToast("账号不存在，请检查输入信息。", "danger");
    return;
  }

  if (user.status === "locked") {
    showToast("该账号当前已锁定，请联系管理人员处理。", "warning");
    return;
  }

  if (user.status === "disabled") {
    showToast("该账号当前不可用，请联系管理人员处理。", "warning");
    return;
  }

  if (user.password !== password) {
    showToast("密码错误，请重新输入。", "danger");
    return;
  }

  const sessionId = createId("sess");
  const currentRole = user.primaryRole || user.roles[0];
  const loginAt = new Date().toISOString();
  const session = {
    sessionId,
    userId: user.id,
    loginAt,
    expiresAt: "",
    deviceLabel: instanceId,
    currentRole,
    status: "active",
  };

  const activeSessions = getActiveSessions();
  activeSessions[user.id] = {
    sessionId,
    loginAt,
    currentRole,
    instanceId,
  };
  saveActiveSessions(activeSessions);
  setCurrentSession(session);
  appState.userFilters = { query: "", role: "all", status: "all" };
  appState.examFilters = { query: "", status: "all", teacherId: "all" };
  appState.questionFilters = { query: "", type: "all", difficulty: "all", status: "all" };

  const updatedUsers = users.map((item) =>
    item.id === user.id
      ? {
        ...item,
        lastLoginAt: loginAt,
        updatedAt: loginAt,
      }
      : item
  );

  saveUsers(updatedUsers);
  appendAuditLog({
    userId: user.id,
    action: "login",
    targetId: user.id,
    detail: `${user.name} 登录系统。`,
  });

  showToast(`欢迎回来，${user.name}。`, "success");
  navigate("/dashboard");
}

function handleRegisterSubmit(form) {
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const loginName = String(formData.get("loginName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const classId = String(formData.get("classId") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();

  if (!name || !loginName || !email || !classId || !password || !confirmPassword) {
    showToast("请完整填写注册信息。", "warning");
    return;
  }

  if (password !== confirmPassword) {
    showToast("两次输入的密码不一致。", "warning");
    return;
  }

  if (!passwordIsValid(password)) {
    showToast("密码需至少 8 位，且同时包含字母和数字。", "warning");
    return;
  }

  const users = getUsers();

  if (users.some((user) => user.loginName === loginName)) {
    showToast("登录名已存在，请更换。", "danger");
    return;
  }

  if (users.some((user) => user.email === email)) {
    showToast("邮箱已被使用，请更换。", "danger");
    return;
  }

  const now = new Date().toISOString();
  const nextUsers = [
    {
      id: createId("user"),
      loginName,
      password,
      name,
      roles: ["Student"],
      primaryRole: "Student",
      email,
      phone,
      classId,
      department: "计算机学院",
      advisorId: "",
      status: "active",
      lastLoginAt: "",
      createdAt: now,
      updatedAt: now,
    },
    ...users,
  ];

  saveUsers(nextUsers);
  appendAuditLog({
    userId: "guest",
    action: "register",
    targetId: loginName,
    detail: `${name} 完成了账号注册。`,
  });

  setFlash("注册成功，请使用新账号登录。", "success");
  navigate("/login");
}

function handleForgotPasswordSubmit(form) {
  const formData = new FormData(form);
  const identity = String(formData.get("identity") || "").trim();

  if (!identity) {
    showToast("请输入邮箱或登录名。", "warning");
    return;
  }

  const user = getUsers().find((item) => item.loginName === identity || item.email === identity);

  if (!user) {
    showToast("未找到匹配账号，请检查输入。", "danger");
    return;
  }

  setFlash(`密码重置指引已发送至 ${user.email}。`, "success");
  navigate("/login");
}

function handleUserFormSubmit(form) {
  const editingId = form.dataset.userId || "";
  const formData = new FormData(form);
  const users = getUsers();
  const currentSession = getCurrentSession();
  const currentUser = getCurrentUserFromSession(currentSession, users);

  if (!currentSession || !currentUser) {
    setFlash("登录状态已失效，请重新登录。", "warning");
    navigate("/login");
    return;
  }

  const currentRole = currentSession.currentRole;
  const editingTarget = editingId ? users.find((user) => user.id === editingId) ?? null : null;

  if (editingId && !editingTarget) {
    showToast("目标用户不存在。", "danger");
    navigate("/users");
    return;
  }

  if (editingTarget && !canManageUserByScope(currentRole, currentUser, editingTarget)) {
    showToast("当前角色不能修改该用户。", "warning");
    navigate("/users");
    return;
  }

  let payload = {
    name: String(formData.get("name") || "").trim(),
    loginName: String(formData.get("loginName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    classId: String(formData.get("classId") || "").trim(),
    department: String(formData.get("department") || "").trim(),
    advisorId: String(formData.get("advisorId") || "").trim(),
    primaryRole: String(formData.get("role") || "").trim(),
    status: String(formData.get("status") || "active").trim(),
    password: String(formData.get("password") || "").trim(),
    roles: [],
  };

  payload.roles = payload.primaryRole ? [payload.primaryRole] : [];

  if (currentRole === "Teacher") {
    payload = {
      ...payload,
      roles: ["Student"],
      primaryRole: "Student",
      status: editingTarget?.status || "active",
      advisorId: currentUser.id,
    };
  }

  if (!payload.name || !payload.loginName || !payload.email) {
    showToast("姓名、登录名和邮箱为必填项。", "warning");
    return;
  }

  if (!payload.primaryRole) {
    showToast("请选择一个角色。", "warning");
    return;
  }

  if (payload.roles.includes("Student") && !payload.classId) {
    showToast("学生角色建议填写班级信息。", "warning");
    return;
  }

  if ((payload.roles.includes("Teacher") || payload.roles.includes("Admin")) && !payload.department) {
    showToast("教师或管理员角色建议填写部门信息。", "warning");
    return;
  }

  if (!payload.roles.includes("Student")) {
    payload.advisorId = "";
  }

  const duplicateLogin = users.find((user) => user.loginName === payload.loginName && user.id !== editingId);
  if (duplicateLogin) {
    showToast("登录名已存在，请更换。", "danger");
    return;
  }

  const duplicateEmail = users.find((user) => user.email === payload.email && user.id !== editingId);
  if (duplicateEmail) {
    showToast("邮箱已存在，请更换。", "danger");
    return;
  }

  if (!editingId && !payload.password) {
    showToast("新建用户必须设置初始密码。", "warning");
    return;
  }

  if (payload.password && !passwordIsValid(payload.password)) {
    showToast("密码需至少 8 位，且同时包含字母和数字。", "warning");
    return;
  }

  const now = new Date().toISOString();
  let nextUsers;
  let savedUser;

  if (editingId) {
    nextUsers = users.map((user) => {
      if (user.id !== editingId) {
        return user;
      }

      savedUser = {
        ...user,
        ...payload,
        password: payload.password || user.password,
        updatedAt: now,
      };

      return savedUser;
    });
  } else {
    savedUser = {
      id: createId("user"),
      ...payload,
      lastLoginAt: "",
      createdAt: now,
      updatedAt: now,
    };
    nextUsers = [savedUser, ...users];
  }

  saveUsers(nextUsers);

  appendAuditLog({
    userId: currentSession.userId,
    action: editingId ? "update:user" : "create:user",
    targetId: savedUser.id,
    detail: `${roleLabels[currentRole]}${editingId ? "更新" : "创建"}了用户 ${savedUser.name}。`,
  });

  syncCurrentUserAfterMutation(savedUser);

  showToast(editingId ? "用户资料已更新。" : "新用户已创建。", "success");
  navigate(editingId ? `/users/${savedUser.id}` : "/users");
}

function handleProfileSubmit(form) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const formData = new FormData(form);

  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    classId: String(formData.get("classId") || "").trim(),
    department: String(formData.get("department") || "").trim(),
  };

  if (!payload.name || !payload.email) {
    showToast("姓名和邮箱不能为空。", "warning");
    return;
  }

  if (users.some((user) => user.email === payload.email && user.id !== currentSession.userId)) {
    showToast("邮箱已被其他账号使用。", "danger");
    return;
  }

  let updatedUser = null;
  const now = new Date().toISOString();

  const nextUsers = users.map((user) => {
    if (user.id !== currentSession.userId) {
      return user;
    }

    updatedUser = {
      ...user,
      ...payload,
      updatedAt: now,
    };
    return updatedUser;
  });

  saveUsers(nextUsers);
  syncCurrentUserAfterMutation(updatedUser);
  appendAuditLog({
    userId: currentSession.userId,
    action: "update:profile",
    targetId: currentSession.userId,
    detail: `${updatedUser.name} 更新了个人资料。`,
  });

  showToast("个人资料已保存。", "success");
  renderApp();
}

function syncCurrentUserAfterMutation(updatedUser) {
  const currentSession = getCurrentSession();

  if (!currentSession || !updatedUser || currentSession.userId !== updatedUser.id) {
    return;
  }

  if (updatedUser.status !== "active") {
    setFlash("当前账号状态发生变化，请重新登录。", "warning");
    clearCurrentSession({ removeRegistry: true });
    navigate("/login");
    return;
  }

  if (!updatedUser.roles.includes(currentSession.currentRole)) {
    currentSession.currentRole = updatedUser.primaryRole || updatedUser.roles[0];
  }

  setCurrentSession(currentSession);

  const activeSessions = getActiveSessions();
  if (activeSessions[updatedUser.id] && activeSessions[updatedUser.id].sessionId === currentSession.sessionId) {
    activeSessions[updatedUser.id].currentRole = currentSession.currentRole;
    saveActiveSessions(activeSessions);
  }
}

function handleToggleUserStatus(userId, nextStatus) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);

  if (!currentSession || !currentUser || !userId || !nextStatus) {
    return;
  }

  const target = users.find((user) => user.id === userId);

  if (!target) {
    showToast("目标用户不存在。", "danger");
    return;
  }

  if (!canManageUserByScope(currentSession.currentRole, currentUser, target)) {
    showToast("当前角色不能修改该用户状态。", "warning");
    return;
  }

  if (target.id === currentSession.userId && nextStatus !== "active") {
    showToast("当前登录账号不能直接在列表中冻结。", "warning");
    return;
  }

  const now = new Date().toISOString();
  const nextUsers = users.map((user) =>
    user.id === userId
      ? {
        ...user,
        status: nextStatus,
        updatedAt: now,
      }
      : user
  );
  saveUsers(nextUsers);

  appendAuditLog({
    userId: currentSession.userId,
    action: nextStatus === "active" ? "unfreeze:user" : "freeze:user",
    targetId: userId,
    detail: `${currentUser.name} 将 ${target.name} 的状态改为 ${statusLabels[nextStatus]}。`,
  });

  showToast(`账号状态已更新为${statusLabels[nextStatus]}。`, "success");
  renderApp();
}

function handleResetPassword(userId) {
  const currentSession = getCurrentSession();
  const users = getUsers();
  const currentUser = getCurrentUserFromSession(currentSession, users);

  if (!currentSession || !currentUser) {
    return;
  }

  const target = users.find((user) => user.id === userId);

  if (!target) {
    showToast("目标用户不存在。", "danger");
    return;
  }

  if (!canManageUserByScope(currentSession.currentRole, currentUser, target)) {
    showToast("当前角色不能重置该用户密码。", "warning");
    return;
  }

  const nextUsers = users.map((user) =>
    user.id === userId
      ? {
        ...user,
        password: "Demo12345",
        updatedAt: new Date().toISOString(),
      }
      : user
  );

  saveUsers(nextUsers);
  appendAuditLog({
    userId: currentSession.userId,
    action: "reset:password",
    targetId: userId,
    detail: `${currentUser.name} 重置了 ${target.name} 的密码。`,
  });

  showToast("密码已重置。", "success");
}

function handleRoleSwitch(nextRole) {
  const session = getCurrentSession();
  const user = getCurrentUserFromSession(session, getUsers());

  if (!session || !user || !user.roles.includes(nextRole)) {
    showToast("无法切换到目标角色。", "warning");
    renderApp();
    return;
  }

  session.currentRole = nextRole;
  setCurrentSession(session);

  const activeSessions = getActiveSessions();
  if (activeSessions[user.id] && activeSessions[user.id].sessionId === session.sessionId) {
    activeSessions[user.id].currentRole = nextRole;
    saveActiveSessions(activeSessions);
  }

  appendAuditLog({
    userId: user.id,
    action: "switch:role",
    targetId: user.id,
    detail: `${user.name} 切换到了 ${roleLabels[nextRole]} 视图。`,
  });

  showToast(`已切换到${roleLabels[nextRole]}视图。`, "success");

  if (nextRole === "Student" && getHashPath().startsWith("/users")) {
    navigate("/dashboard");
    return;
  }

  if (nextRole === "Student" && getHashPath().startsWith("/question-bank")) {
    navigate("/dashboard");
    return;
  }

  renderApp();
}

function handleLogout() {
  const session = getCurrentSession();

  if (!session) {
    navigate("/login");
    return;
  }

  appendAuditLog({
    userId: session.userId,
    action: "logout",
    targetId: session.userId,
    detail: "用户退出了系统。",
  });

  clearCurrentSession({ removeRegistry: true });
  appState.userFilters = { query: "", role: "all", status: "all" };
  appState.examFilters = { query: "", status: "all", teacherId: "all" };
  appState.questionFilters = { query: "", type: "all", difficulty: "all", status: "all" };
  setFlash("你已安全退出登录。", "success");
  navigate("/login");
}

function simulateRemoteLogin() {
  const session = getCurrentSession();

  if (!session) {
    return;
  }

  const activeSessions = getActiveSessions();
  activeSessions[session.userId] = {
    sessionId: createId("remote"),
    loginAt: new Date().toISOString(),
    currentRole: session.currentRole,
    instanceId: "remote-demo",
  };
  saveActiveSessions(activeSessions);
  validateReplacedSession();
}

function validateReplacedSession() {
  const session = getCurrentSession();

  if (!session) {
    return;
  }

  const activeSessions = getActiveSessions();
  const activeSession = activeSessions[session.userId];

  if (!activeSession || activeSession.sessionId !== session.sessionId) {
    setFlash("账号已在其他位置登录，请重新认证。", "warning");
    clearCurrentSession({ removeRegistry: false });
    navigate("/login");
  }
}

function handleStorageSync(event) {
  if (event.key !== STORAGE_KEYS.activeSessions && event.key !== STORAGE_KEYS.users && event.key !== STORAGE_KEYS.exams) {
    return;
  }

  const session = getCurrentSession();

  if (!session) {
    return;
  }

  if (event.key === STORAGE_KEYS.activeSessions) {
    validateReplacedSession();
    return;
  }

  if (event.key === STORAGE_KEYS.users) {
    const users = getUsers();
    const currentUser = users.find((user) => user.id === session.userId);

    if (!currentUser) {
      setFlash("当前账号已被移除，请重新登录。", "warning");
      clearCurrentSession({ removeRegistry: false });
      navigate("/login");
      return;
    }

    if (currentUser.status !== "active") {
      setFlash("当前账号状态已变化，请重新登录。", "warning");
      clearCurrentSession({ removeRegistry: false });
      navigate("/login");
      return;
    }

    if (!currentUser.roles.includes(session.currentRole)) {
      session.currentRole = currentUser.primaryRole || currentUser.roles[0];
      setCurrentSession(session);
      renderApp();
    }

    return;
  }

  if (event.key === STORAGE_KEYS.exams) {
    renderApp();
  }
}

function resetLocalData() {
  localStorage.removeItem(STORAGE_KEYS.users);
  localStorage.removeItem(STORAGE_KEYS.auditLogs);
  localStorage.removeItem(STORAGE_KEYS.activeSessions);
  localStorage.removeItem(STORAGE_KEYS.exams);
  sessionStorage.removeItem(SESSION_KEYS.currentSession);
  appState.userFilters = { query: "", role: "all", status: "all" };
  appState.examFilters = { query: "", status: "all", teacherId: "all" };
  localStorage.removeItem(STORAGE_KEYS.questions);
  sessionStorage.removeItem(SESSION_KEYS.currentSession);
  appState.userFilters = { query: "", role: "all", status: "all" };
  appState.questionFilters = { query: "", type: "all", difficulty: "all", status: "all" };
  seedDemoData();
  setFlash("系统数据已恢复到初始状态。", "success");
  navigate("/login");
}


