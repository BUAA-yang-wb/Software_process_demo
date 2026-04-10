const STORAGE_KEYS = {
  users: "sp_demo_users",
  auditLogs: "sp_demo_audit_logs",
  activeSessions: "sp_demo_active_sessions",
  exams: "sp_demo_exams",
  questions: "sp_demo_questions",
};

const SESSION_KEYS = {
  instanceId: "sp_demo_instance_id",
  currentSession: "sp_demo_current_session",
  flash: "sp_demo_flash_message",
};

const roleLabels = {
  Student: "学生",
  Teacher: "教师",
  Admin: "管理员",
};

const statusLabels = {
  active: "正常",
  locked: "已锁定",
  disabled: "已冻结",
};

const statusTones = {
  active: "success",
  locked: "warning",
  disabled: "danger",
};

const navMeta = {
  dashboard: { label: "首页", icon: "首" },
  users: { label: "用户管理", icon: "户" },
  exams: { label: "考试管理", icon: "考" },
  questionBank: { label: "题库管理", icon: "题" },
  profile: { label: "个人中心", icon: "我" },
};

const questionTypeMeta = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
  blank: "填空题",
  short: "简答题",
  essay: "论述题",
  coding: "编程题",
  case: "案例分析题",
  image: "图片题",
  audio: "音频题",
  video: "视频题",
  upload: "文件上传题",
};

const questionStatusMeta = {
  draft: { label: "草稿", tone: "warning" },
  pending: { label: "待审核", tone: "primary" },
  approved: { label: "已通过", tone: "success" },
  rejected: { label: "已驳回", tone: "danger" },
};

const questionShareScopeMeta = {
  personal: "个人题库",
  department: "院系题库",
  public: "公共题库",
};

const permissionMap = {
  Student: ["profile:view", "profile:update", "exam:view:own"],
  Teacher: [
    "user:view",
    "user:create",
    "user:update",
    "user:freeze",
    "exam:view",
    "exam:create",
    "exam:update",
    "exam:publish",
    "exam:delete",
    "exam:assign",
    "question:view",
    "question:create",
    "question:update",
    "question:submit",
    "question:import",
    "profile:view",
    "profile:update",
  ],
  Admin: [
    "user:view",
    "user:create",
    "user:update",
    "user:freeze",
    "role:assign",
    "exam:view",
    "exam:create",
    "exam:update",
    "exam:publish",
    "exam:delete",
    "exam:assign",
    "question:view",
    "question:create",
    "question:update",
    "question:submit",
    "question:import",
    "question:review",
    "profile:view",
    "profile:update",
  ],
};

const demoAccounts = [
  { role: "管理员账号", loginName: "admin01", password: "Demo12345" },
  { role: "教师账号", loginName: "teacher01", password: "Demo12345" },
  { role: "学生账号", loginName: "2026001", password: "Demo12345" },
  { role: "学生账号", loginName: "2026015", password: "Demo12345" },
  { role: "锁定账号", loginName: "teacher-lock", password: "Demo12345" },
];

const appState = {
  userFilters: {
    query: "",
    role: "all",
    status: "all",
  },
  examFilters: {
    query: "",
    status: "all",
    teacherId: "all",
  },
  questionFilters: {
    query: "",
    type: "all",
    difficulty: "all",
    status: "all",
  },
};

let appRoot = null;
let toastRoot = null;
let instanceId = null;

function initializeRuntimeRefs() {
  appRoot = document.getElementById("app");
  toastRoot = document.getElementById("toast-root");
  instanceId = ensureSessionValue(SESSION_KEYS.instanceId, createId("tab"));
}

function ensureSessionValue(key, fallbackValue) {
  const existing = sessionStorage.getItem(key);

  if (existing) {
    return existing;
  }

  sessionStorage.setItem(key, fallbackValue);
  return fallbackValue;
}

function seedDemoData() {
  const seedUsers = createSeedUsers();
  const existingUsers = readStorage(localStorage, STORAGE_KEYS.users, null);
  writeStorage(localStorage, STORAGE_KEYS.users, normalizeUsers(existingUsers ? mergeSeedUsers(existingUsers, seedUsers) : seedUsers));

  const seedLogs = createSeedAuditLogs();
  const existingLogs = readStorage(localStorage, STORAGE_KEYS.auditLogs, null);
  writeStorage(localStorage, STORAGE_KEYS.auditLogs, normalizeAuditLogs(existingLogs ? mergeSeedAuditLogs(existingLogs, seedLogs) : seedLogs));

  if (!localStorage.getItem(STORAGE_KEYS.activeSessions)) {
    writeStorage(localStorage, STORAGE_KEYS.activeSessions, {});
  }

  const seedExams = createSeedExams();
  const existingExams = readStorage(localStorage, STORAGE_KEYS.exams, null);
  writeStorage(localStorage, STORAGE_KEYS.exams, normalizeExams(existingExams ? mergeSeedExams(existingExams, seedExams) : seedExams));

  
  const seedQuestions = createSeedQuestions();
  const existingQuestions = readStorage(localStorage, STORAGE_KEYS.questions, null);
  writeStorage(localStorage, STORAGE_KEYS.questions, normalizeQuestions(existingQuestions ? mergeSeedQuestions(existingQuestions, seedQuestions) : seedQuestions));
}

function createSeedExams() {
  return [
    {
      id: "exam-001",
      title: "软件过程阶段测验",
      description: "覆盖需求分析与用例建模，闭卷 60 分钟。",
      startAt: "2026-05-15T09:00:00",
      endAt: "2026-05-15T11:00:00",
      durationMinutes: 60,
      allowSwitchCount: 3,
      shuffleQuestions: true,
      status: "published",
      assignedStudentIds: ["user-student-001", "user-student-002"],
      createdBy: "user-teacher-001",
      createdAt: "2026-04-05T10:00:00",
      updatedAt: "2026-04-08T16:30:00",
      publishedAt: "2026-04-08T16:30:00",
    },
    {
      id: "exam-002",
      title: "面向对象设计随堂测试",
      description: "重点考察类关系与设计原则。",
      startAt: "2026-04-10T09:00:00",
      endAt: "2026-04-10T18:00:00",
      durationMinutes: 45,
      allowSwitchCount: 2,
      shuffleQuestions: false,
      status: "published",
      assignedStudentIds: ["user-student-001", "user-student-002"],
      createdBy: "user-teacher-001",
      createdAt: "2026-04-09T09:00:00",
      updatedAt: "2026-04-10T09:30:00",
      publishedAt: "2026-04-10T09:30:00",
    },
    {
      id: "exam-003",
      title: "数据库系统期中测验",
      description: "已结束样例，用于演示结束后不可参加。",
      startAt: "2026-04-06T09:00:00",
      endAt: "2026-04-06T11:00:00",
      durationMinutes: 60,
      allowSwitchCount: 2,
      shuffleQuestions: false,
      status: "published",
      assignedStudentIds: ["user-student-001", "user-student-002"],
      createdBy: "user-teacher-001",
      createdAt: "2026-04-04T10:00:00",
      updatedAt: "2026-04-06T11:10:00",
      publishedAt: "2026-04-05T15:00:00",
    },
    {
      id: "exam-004",
      title: "软件工程年度实践考试",
      description: "全年进行中样例，用于演示可进入考试界面。",
      startAt: "2026-01-01T00:00:00",
      endAt: "2026-12-31T23:59:00",
      durationMinutes: 90,
      allowSwitchCount: 5,
      shuffleQuestions: true,
      status: "published",
      assignedStudentIds: ["user-student-001", "user-student-002"],
      createdBy: "user-teacher-001",
      createdAt: "2026-01-02T09:00:00",
      updatedAt: "2026-04-10T10:00:00",
      publishedAt: "2026-01-03T08:30:00",
    },
  ];
}

function createSeedUsers() {
  return [
    {
      id: "user-admin-001",
      loginName: "admin01",
      password: "Demo12345",
      name: "沈卓",
      roles: ["Admin"],
      primaryRole: "Admin",
      email: "shenzhuo@examcloud.edu.cn",
      phone: "13800008880",
      classId: "",
      department: "平台运营中心",
      advisorId: "",
      status: "active",
      lastLoginAt: "2026-04-09T08:30:00",
      createdAt: "2026-02-10T09:00:00",
      updatedAt: "2026-04-09T08:30:00",
    },
    {
      id: "user-teacher-001",
      loginName: "teacher01",
      password: "Demo12345",
      name: "林慧",
      roles: ["Teacher"],
      primaryRole: "Teacher",
      email: "linhui@examcloud.edu.cn",
      phone: "13900003218",
      classId: "",
      department: "软件工程教研室",
      advisorId: "",
      status: "active",
      lastLoginAt: "2026-04-08T17:20:00",
      createdAt: "2026-02-26T14:00:00",
      updatedAt: "2026-04-08T17:20:00",
    },
    {
      id: "user-student-001",
      loginName: "2026001",
      password: "Demo12345",
      name: "李晴",
      roles: ["Student"],
      primaryRole: "Student",
      email: "liqing@examcloud.edu.cn",
      phone: "13800001231",
      classId: "软件2301",
      department: "计算机学院",
      advisorId: "user-teacher-001",
      status: "active",
      lastLoginAt: "2026-04-08T09:40:00",
      createdAt: "2026-03-12T10:00:00",
      updatedAt: "2026-04-07T21:30:00",
    },
    {
      id: "user-student-002",
      loginName: "2026015",
      password: "Demo12345",
      name: "许然",
      roles: ["Student"],
      primaryRole: "Student",
      email: "xuran@examcloud.edu.cn",
      phone: "13800005617",
      classId: "电子信息专硕2401",
      department: "信息工程学院",
      advisorId: "user-teacher-001",
      status: "active",
      lastLoginAt: "2026-04-07T14:15:00",
      createdAt: "2026-03-18T09:30:00",
      updatedAt: "2026-04-07T14:15:00",
    },
    {
      id: "user-student-disabled",
      loginName: "2026999",
      password: "Demo12345",
      name: "唐雨",
      roles: ["Student"],
      primaryRole: "Student",
      email: "tangyu@examcloud.edu.cn",
      phone: "13500004711",
      classId: "软件2202",
      department: "计算机学院",
      advisorId: "user-teacher-001",
      status: "disabled",
      lastLoginAt: "2026-03-18T11:20:00",
      createdAt: "2026-02-21T08:30:00",
      updatedAt: "2026-04-03T16:00:00",
    },

    {
      id: "user-teacher-locked",
      loginName: "teacher-lock",
      password: "Demo12345",
      name: "周岳",
      roles: ["Teacher"],
      primaryRole: "Teacher",
      email: "zhouyue@examcloud.edu.cn",
      phone: "13600007881",
      classId: "",
      department: "考试管理中心",
      advisorId: "",
      status: "locked",
      lastLoginAt: "2026-03-30T15:00:00",
      createdAt: "2026-03-01T15:00:00",
      updatedAt: "2026-04-01T08:40:00",
    },
  ];
}

function createSeedAuditLogs() {
  return [
    {
      id: "log-001",
      userId: "user-admin-001",
      action: "create:user",
      targetId: "user-teacher-001",
      timestamp: "2026-02-26T14:00:00",
      detail: "管理员创建了教师账号 teacher01。",
    },
    {
      id: "log-002",
      userId: "user-teacher-001",
      action: "create:user",
      targetId: "user-student-001",
      timestamp: "2026-03-12T10:00:00",
      detail: "教师创建了学生账号 2026001。",
    },
    {
      id: "log-003",
      userId: "user-teacher-001",
      action: "create:user",
      targetId: "user-student-002",
      timestamp: "2026-03-18T09:30:00",
      detail: "教师创建了学生账号 2026015。",
    },
    {
      id: "log-004",
      userId: "user-teacher-001",
      action: "reset:password",
      targetId: "user-student-001",
      timestamp: "2026-04-02T09:00:00",
      detail: "教师重置了学生账号的密码。",
    },
    {
      id: "log-005",
      userId: "user-teacher-001",
      action: "freeze:user",
      targetId: "user-student-disabled",
      timestamp: "2026-04-03T16:00:00",
      detail: "教师将账号状态调整为已冻结。",
    },

  ];
}

function createSeedQuestions() {
  return [
    {
      id: "question-001",
      type: "single",
      stem: "在软件需求分析中，通常用于描述用户与系统交互行为的模型是？",
      options: ["A. 类图", "B. 用例图", "C. 部署图", "D. 组件图"],
      answer: "B",
      analysis: "用例图用于表达外部参与者与系统功能之间的关系。",
      score: 5,
      difficulty: 2,
      knowledgePoint: "需求建模",
      subject: "软件工程",
      chapter: "需求分析",
      tags: ["基础", "用例"],
      estimatedMinutes: 2,
      status: "approved",
      version: 2,
      mediaName: "",
      language: "",
      sharedScope: "public",
      usageCount: 126,
      correctRate: 0.81,
      createdBy: "user-teacher-001",
      reviewerId: "user-admin-001",
      reviewComment: "题目表述清晰，可用于基础测验。",
      createdAt: "2026-03-20T10:00:00",
      updatedAt: "2026-04-06T16:20:00",
      reviewedAt: "2026-04-06T16:20:00",
    },
    {
      id: "question-002",
      type: "multiple",
      stem: "下列哪些属于常见的软件质量属性？",
      options: ["A. 可维护性", "B. 可用性", "C. 可扩展性", "D. 可传输性"],
      answer: "A,B,C",
      analysis: "课程重点通常覆盖可维护性、可用性和可扩展性。",
      score: 8,
      difficulty: 3,
      knowledgePoint: "软件质量",
      subject: "软件过程与质量",
      chapter: "质量属性",
      tags: ["多选", "质量"],
      estimatedMinutes: 3,
      status: "pending",
      version: 1,
      mediaName: "",
      language: "",
      sharedScope: "department",
      usageCount: 32,
      correctRate: 0.55,
      createdBy: "user-teacher-001",
      reviewerId: "",
      reviewComment: "",
      createdAt: "2026-04-08T09:00:00",
      updatedAt: "2026-04-08T09:00:00",
      reviewedAt: "",
    },
    {
      id: "question-003",
      type: "coding",
      stem: "请使用 Java 实现一个函数，判断字符串是否为回文串。",
      options: [],
      answer: "可使用双指针从两端向中间比较字符。",
      analysis: "重点考察字符串处理与边界条件。",
      score: 20,
      difficulty: 4,
      knowledgePoint: "字符串算法",
      subject: "程序设计",
      chapter: "算法基础",
      tags: ["编程题", "算法"],
      estimatedMinutes: 12,
      status: "draft",
      version: 1,
      mediaName: "",
      language: "Java",
      sharedScope: "personal",
      usageCount: 0,
      correctRate: 0,
      createdBy: "user-teacher-001",
      reviewerId: "",
      reviewComment: "",
      createdAt: "2026-04-09T08:00:00",
      updatedAt: "2026-04-09T08:00:00",
      reviewedAt: "",
    },
  ];
}

function mergeSeedUsers(existingUsers, seedUsers) {
  const usedExistingIds = new Set();

  const mergedSeedUsers = seedUsers.map((seedUser) => {
    const existingUser = existingUsers.find((user) => user.id === seedUser.id || user.loginName === seedUser.loginName);

    if (!existingUser) {
      return seedUser;
    }

    usedExistingIds.add(existingUser.id);

    return {
      ...seedUser,
      ...existingUser,
      advisorId: existingUser.advisorId ?? seedUser.advisorId ?? "",
    };
  });

  const customUsers = existingUsers.filter((user) => !usedExistingIds.has(user.id));
  return [...mergedSeedUsers, ...customUsers];
}

function mergeSeedAuditLogs(existingLogs, seedLogs) {
  const byId = new Map(existingLogs.map((log) => [log.id, log]));
  const mergedSeedLogs = seedLogs.map((seedLog) => byId.get(seedLog.id) ?? seedLog);
  const customLogs = existingLogs.filter((log) => !seedLogs.some((seedLog) => seedLog.id === log.id));
  return [...mergedSeedLogs, ...customLogs].slice(0, 120);
}

function mergeSeedExams(existingExams, seedExams) {
  const usedExistingIds = new Set();

  const mergedSeedExams = seedExams.map((seedExam) => {
    const existingExam = existingExams.find((exam) => exam.id === seedExam.id);

    if (!existingExam) {
      return seedExam;
    }

    usedExistingIds.add(existingExam.id);

    return {
      ...seedExam,
      ...existingExam,
      assignedStudentIds: Array.isArray(existingExam.assignedStudentIds)
        ? existingExam.assignedStudentIds
        : seedExam.assignedStudentIds,
    };
  });

  const customExams = existingExams.filter((exam) => !usedExistingIds.has(exam.id));
  return [...mergedSeedExams, ...customExams];
}

function mergeSeedQuestions(existingQuestions, seedQuestions) {
  const byId = new Map(existingQuestions.map((question) => [question.id, question]));
  const mergedSeedQuestions = seedQuestions.map((seedQuestion) => ({
    ...seedQuestion,
    ...(byId.get(seedQuestion.id) ?? {}),
  }));
  const customQuestions = existingQuestions.filter((question) => !seedQuestions.some((seedQuestion) => seedQuestion.id === question.id));
  return [...mergedSeedQuestions, ...customQuestions].slice(0, 300);
}

function normalizeUsers(users) {
  return users.map((user) => {
    const fallbackRole = user.primaryRole || user.roles?.[0] || "Student";
    const role = roleLabels[fallbackRole] ? fallbackRole : "Student";

    return {
      ...user,
      roles: [role],
      primaryRole: role,
      advisorId: role === "Student" ? user.advisorId ?? "" : "",
    };
  });
}

function normalizeAuditLogs(logs) {
  return logs.filter((log) => log.action !== "switch:role");
}

function normalizeExams(exams) {
  return exams.map((exam) => ({
    id: exam.id,
    title: String(exam.title || "").trim(),
    description: String(exam.description || "").trim(),
    startAt: exam.startAt || "",
    endAt: exam.endAt || "",
    durationMinutes: Number(exam.durationMinutes) > 0 ? Number(exam.durationMinutes) : 60,
    allowSwitchCount: Number.isFinite(Number(exam.allowSwitchCount)) ? Number(exam.allowSwitchCount) : 3,
    shuffleQuestions: Boolean(exam.shuffleQuestions),
    status: exam.status === "published" ? "published" : "draft",
    assignedStudentIds: Array.isArray(exam.assignedStudentIds) ? [...new Set(exam.assignedStudentIds)] : [],
    createdBy: exam.createdBy || "",
    createdAt: exam.createdAt || new Date().toISOString(),
    updatedAt: exam.updatedAt || exam.createdAt || new Date().toISOString(),
    publishedAt: exam.publishedAt || "",
  }));
}

function normalizeQuestions(questions) {
  return questions.map((question) => {
    const type = questionTypeMeta[question.type] ? question.type : "single";
    const status = questionStatusMeta[question.status] ? question.status : "draft";
    const sharedScope = questionShareScopeMeta[question.sharedScope] ? question.sharedScope : "personal";

    return {
      ...question,
      type,
      status,
      sharedScope,
      options: Array.isArray(question.options) ? question.options : [],
      tags: Array.isArray(question.tags) ? question.tags : [],
      score: Number.isFinite(Number(question.score)) ? Math.max(0, Number(question.score)) : 10,
      difficulty: Number.isFinite(Number(question.difficulty)) ? Math.min(5, Math.max(1, Number(question.difficulty))) : 3,
      estimatedMinutes: Number.isFinite(Number(question.estimatedMinutes)) ? Math.max(1, Number(question.estimatedMinutes)) : 3,
      version: Number.isFinite(Number(question.version)) ? Math.max(1, Number(question.version)) : 1,
      usageCount: Number.isFinite(Number(question.usageCount)) ? Math.max(0, Number(question.usageCount)) : 0,
      correctRate: Number.isFinite(Number(question.correctRate)) ? Math.max(0, Math.min(1, Number(question.correctRate))) : 0,
      reviewComment: question.reviewComment || "",
      reviewerId: question.reviewerId || "",
      reviewedAt: question.reviewedAt || "",
      mediaName: question.mediaName || "",
      language: question.language || "",
    };
  });
}

function readStorage(storage, key, fallbackValue) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : cloneData(fallbackValue);
  } catch (error) {
    return cloneData(fallbackValue);
  }
}

function writeStorage(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function getUsers() {
  return readStorage(localStorage, STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  writeStorage(localStorage, STORAGE_KEYS.users, users);
}

function getAuditLogs() {
  return readStorage(localStorage, STORAGE_KEYS.auditLogs, []);
}

function saveAuditLogs(logs) {
  writeStorage(localStorage, STORAGE_KEYS.auditLogs, logs);
}

function getQuestions() {
  return readStorage(localStorage, STORAGE_KEYS.questions, []);
}

function saveQuestions(questions) {
  writeStorage(localStorage, STORAGE_KEYS.questions, normalizeQuestions(questions));
}

function getActiveSessions() {
  return readStorage(localStorage, STORAGE_KEYS.activeSessions, {});
}

function getExams() {
  return readStorage(localStorage, STORAGE_KEYS.exams, []);
}

function saveExams(exams) {
  writeStorage(localStorage, STORAGE_KEYS.exams, normalizeExams(exams));
}

function saveActiveSessions(activeSessions) {
  writeStorage(localStorage, STORAGE_KEYS.activeSessions, activeSessions);
}

function getCurrentSession() {
  return readStorage(sessionStorage, SESSION_KEYS.currentSession, null);
}

function setCurrentSession(session) {
  writeStorage(sessionStorage, SESSION_KEYS.currentSession, session);
}

function clearCurrentSession(options = { removeRegistry: true }) {
  const session = getCurrentSession();

  if (session && options.removeRegistry !== false) {
    const activeSessions = getActiveSessions();
    const activeSession = activeSessions[session.userId];

    if (activeSession && activeSession.sessionId === session.sessionId) {
      delete activeSessions[session.userId];
      saveActiveSessions(activeSessions);
    }
  }

  sessionStorage.removeItem(SESSION_KEYS.currentSession);
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-5)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getInitials(name) {
  const safe = String(name ?? "").trim();
  return safe ? safe.slice(0, 1) : "D";
}

function formatDateTime(value) {
  if (!value) {
    return "未记录";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未记录";
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getExamPhase(exam, now = new Date()) {
  if (!exam || exam.status !== "published") {
    return "not-started";
  }

  const start = new Date(exam.startAt);
  const end = new Date(exam.endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "not-started";
  }

  if (now < start) {
    return "not-started";
  }

  if (now > end) {
    return "ended";
  }

  return "ongoing";
}

function getExamPhaseMeta(phase) {
  if (phase === "ongoing") {
    return { label: "考试中", tone: "success" };
  }

  if (phase === "ended") {
    return { label: "已结束", tone: "danger" };
  }

  return { label: "未开始", tone: "warning" };
}

function passwordIsValid(password) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

function appendAuditLog({ userId, action, targetId, detail }) {
  const logs = getAuditLogs();
  logs.unshift({
    id: createId("log"),
    userId,
    action,
    targetId,
    timestamp: new Date().toISOString(),
    detail,
  });
  saveAuditLogs(logs.slice(0, 120));
}

function getHashPath() {
  const raw = location.hash.replace(/^#/, "");
  return raw ? raw : "/";
}

function navigate(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  location.hash = normalized;
}

function setFlash(message, tone = "info") {
  writeStorage(sessionStorage, SESSION_KEYS.flash, { message, tone });
}

function consumeFlash() {
  const flash = readStorage(sessionStorage, SESSION_KEYS.flash, null);
  sessionStorage.removeItem(SESSION_KEYS.flash);
  return flash;
}

function resolveRoute(path) {
  if (path === "/" || path === "") {
    return { name: "root" };
  }

  if (path === "/login") {
    return { name: "login", public: true };
  }

  if (path === "/register") {
    return { name: "register", public: true };
  }

  if (path === "/forgot-password") {
    return { name: "forgot-password", public: true };
  }

  if (path === "/dashboard") {
    return { name: "dashboard", requiresAuth: true };
  }

  if (path === "/users") {
    return {
      name: "users",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin"],
    };
  }

  if (path === "/users/new") {
    return {
      name: "user-create",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin"],
    };
  }

  if (path === "/exams") {
    return {
      name: "exams",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin", "Student"],
    };
  }

  if (path === "/exams/new") {
    return {
      name: "exam-create",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin"],
    };
  }
  if (path === "/question-bank") {
    return {
      name: "question-bank",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin"],
    };
  }

  const examTakeMatch = path.match(/^\/exams\/([^/]+)\/take$/);

  if (examTakeMatch) {
    return {
      name: "exam-taking",
      requiresAuth: true,
      allowedRoles: ["Student"],
      params: { examId: examTakeMatch[1] },
    };
  }

  const examEditMatch = path.match(/^\/exams\/([^/]+)\/edit$/);

  if (examEditMatch) {
    return {
      name: "exam-edit",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin"],
      params: { examId: examEditMatch[1] },
    };
  }

  const examDetailMatch = path.match(/^\/exams\/([^/]+)$/);

  if (examDetailMatch) {
    return {
      name: "exam-detail",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin", "Student"],
      params: { examId: examDetailMatch[1] },
    };
  }

  if (path === "/question-bank/new") {
    return {
      name: "question-create",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin"],
    };
  }

  const questionEditMatch = path.match(/^\/question-bank\/([^/]+)\/edit$/);

  if (questionEditMatch) {
    return {
      name: "question-edit",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin"],
      params: { questionId: questionEditMatch[1] },
    };
  }

  const questionDetailMatch = path.match(/^\/question-bank\/([^/]+)$/);

  if (questionDetailMatch) {
    return {
      name: "question-detail",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin"],
      params: { questionId: questionDetailMatch[1] },
    };
  }

  const userEditMatch = path.match(/^\/users\/([^/]+)\/edit$/);

  if (userEditMatch) {
    return {
      name: "user-edit",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin"],
      params: { userId: userEditMatch[1] },
    };
  }

  const userDetailMatch = path.match(/^\/users\/([^/]+)$/);

  if (userDetailMatch) {
    return {
      name: "user-detail",
      requiresAuth: true,
      allowedRoles: ["Teacher", "Admin"],
      params: { userId: userDetailMatch[1] },
    };
  }

  if (path === "/profile") {
    return {
      name: "profile",
      requiresAuth: true,
    };
  }

  if (path === "/403") {
    return {
      name: "forbidden",
      requiresAuth: true,
    };
  }

  return { name: "not-found", requiresAuth: true };
}

function getCurrentUserFromSession(session, users) {
  if (!session) {
    return null;
  }

  return users.find((user) => user.id === session.userId) ?? null;
}

function validateSessionState() {
  const session = getCurrentSession();

  if (!session) {
    return null;
  }

  const users = getUsers();
  const user = users.find((item) => item.id === session.userId);

  if (!user) {
    setFlash("当前账号已不存在，请重新登录。", "warning");
    clearCurrentSession({ removeRegistry: false });
    return null;
  }

  if (user.status !== "active") {
    setFlash("当前账号状态已变化，请联系系统管理员。", "warning");
    clearCurrentSession({ removeRegistry: false });
    return null;
  }

  if (!user.roles.includes(session.currentRole)) {
    session.currentRole = user.primaryRole || user.roles[0];
    setCurrentSession(session);
  }

  const activeSessions = getActiveSessions();
  const activeSession = activeSessions[user.id];

  if (!activeSession || activeSession.sessionId !== session.sessionId) {
    setFlash("账号已在其他位置登录，请重新认证。", "warning");
    clearCurrentSession({ removeRegistry: false });
    return null;
  }

  return session;
}

function showToast(message, tone = "success") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.dataset.tone = tone;
  toast.textContent = message;
  toastRoot.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function getStats(users) {
  const active = users.filter((user) => user.status === "active").length;
  const students = users.filter((user) => user.roles.includes("Student") && user.primaryRole === "Student").length;
  const teachers = users.filter((user) => user.roles.includes("Teacher") && user.primaryRole === "Teacher").length;
  const admins = users.filter((user) => user.roles.includes("Admin") && user.primaryRole === "Admin").length;
  const multiRole = users.filter((user) => user.roles.length > 1).length;
  const lockedOrDisabled = users.filter((user) => user.status !== "active").length;

  return {
    total: users.length,
    active,
    students,
    teachers,
    admins,
    multiRole,
    lockedOrDisabled,
  };
}

function getPermissionsForRole(role) {
  return permissionMap[role] ?? [];
}

function hasPermission(context, permission) {
  return context.permissions.includes(permission);
}

function isTeacherManagedStudent(user, teacherId) {
  return Boolean(user && user.primaryRole === "Student" && user.advisorId === teacherId);
}

function getManagedStudentsForTeacher(teacherId, users) {
  return users.filter((user) => isTeacherManagedStudent(user, teacherId));
}

function getVisibleUsersForRole(role, currentUser, users) {
  if (!currentUser) {
    return [];
  }

  if (role === "Admin") {
    return [...users].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  if (role === "Teacher") {
    return [
      currentUser,
      ...getManagedStudentsForTeacher(currentUser.id, users).filter((user) => user.id !== currentUser.id),
    ].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  return [currentUser];
}

function getVisibleQuestionsForRole(role, currentUser, questions) {
  if (!currentUser) {
    return [];
  }

  if (role === "Admin") {
    return [...questions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  if (role === "Teacher") {
    return questions
      .filter(
        (question) =>
          question.createdBy === currentUser.id || question.sharedScope === "public" || question.sharedScope === "department"
      )
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  return [];
}

function getManageableUsersForRole(role, currentUser, users) {
  if (!currentUser) {
    return [];
  }

  if (role === "Admin") {
    return users;
  }

  if (role === "Teacher") {
    return getManagedStudentsForTeacher(currentUser.id, users);
  }

  return [];
}

function canViewUserByScope(role, currentUser, targetUser) {
  if (!currentUser || !targetUser) {
    return false;
  }

  if (role === "Admin") {
    return true;
  }

  if (role === "Teacher") {
    return targetUser.id === currentUser.id || isTeacherManagedStudent(targetUser, currentUser.id);
  }

  return targetUser.id === currentUser.id;
}

function canManageUserByScope(role, currentUser, targetUser) {
  if (!currentUser || !targetUser) {
    return false;
  }

  if (role === "Admin") {
    return true;
  }

  if (role === "Teacher") {
    return isTeacherManagedStudent(targetUser, currentUser.id);
  }

  return false;
}

function canViewQuestionByScope(role, currentUser, question) {
  if (!currentUser || !question) {
    return false;
  }

  if (role === "Admin") {
    return true;
  }

  if (role === "Teacher") {
    return question.createdBy === currentUser.id || question.sharedScope === "public" || question.sharedScope === "department";
  }

  return false;
}

function canManageQuestionByScope(role, currentUser, question) {
  if (!currentUser || !question) {
    return false;
  }

  if (role === "Admin") {
    return true;
  }

  if (role === "Teacher") {
    return question.createdBy === currentUser.id;
  }

  return false;
}

function getUserScopeLabel(role) {
  if (role === "Admin") {
    return "全平台账号";
  }

  if (role === "Teacher") {
    return "本人及所属学生";
  }

  return "仅本人";
}

function getRoleEntrySummary(role) {
  if (role === "Admin") {
    return "负责全平台账号、角色与状态管理";
  }

  if (role === "Teacher") {
    return "负责本人及所属学生账号维护";
  }

  return "查看个人资料与当前账号状态";
}

function getAssignableRoles(currentRole) {
  if (currentRole === "Admin") {
    return ["Student", "Teacher", "Admin"];
  }

  if (currentRole === "Teacher") {
    return ["Student"];
  }

  return [];
}

function getTeacherOptions(users) {
  return users
    .filter((user) => user.roles.includes("Teacher") && user.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

function getAdvisorName(advisorId, users) {
  if (!advisorId) {
    return "未分配";
  }

  return users.find((user) => user.id === advisorId)?.name ?? "未分配";
}

function filterUsers(users, filters) {
  return [...users]
    .filter((user) => {
      const query = filters.query.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return [user.name, user.loginName, user.email, user.classId, user.department]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .filter((user) => (filters.role === "all" ? true : user.roles.includes(filters.role)))
    .filter((user) => (filters.status === "all" ? true : user.status === filters.status))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function filterQuestions(questions, filters) {
  return [...questions]
    .filter((question) => {
      const query = String(filters.query || "").trim().toLowerCase();

      if (!query) {
        return true;
      }

      return [question.stem, question.knowledgePoint, question.subject, question.chapter, ...(question.tags || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .filter((question) => (filters.type === "all" ? true : question.type === filters.type))
    .filter((question) => (filters.status === "all" ? true : question.status === filters.status))
    .filter((question) => (filters.difficulty === "all" ? true : String(question.difficulty) === String(filters.difficulty)))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function getActionLabel(action) {
  const labels = {
    "create:user": "创建用户",
    "update:user": "更新用户资料",
    "freeze:user": "冻结账号",
    "unfreeze:user": "恢复账号",
    "reset:password": "重置密码",
    login: "登录系统",
    logout: "退出登录",
    register: "学生注册",
    "switch:role": "切换角色",
    "update:profile": "更新个人资料",
    "create:exam": "创建考试任务",
    "update:exam": "更新考试任务",
    "publish:exam": "发布考试任务",
    "delete:exam": "删除考试任务",
    "assign:exam": "维护考试分配",
    "create:question": "创建试题",
    "update:question": "更新试题",
    "submit:question": "提交试题审核",
    "review:question": "审核试题",
    "import:question": "批量导入试题",
    "clone:question": "克隆试题",
  };

  return labels[action] ?? action;
}

function getQuestionTypeOptions() {
  return Object.entries(questionTypeMeta).map(([value, label]) => ({ value, label }));
}

function getQuestionTypeFilterOptions() {
  return [{ value: "all", label: "全部题型" }, ...getQuestionTypeOptions()];
}

function getDifficultyFilterOptions() {
  return [
    { value: "all", label: "全部难度" },
    { value: "1", label: "Lv.1" },
    { value: "2", label: "Lv.2" },
    { value: "3", label: "Lv.3" },
    { value: "4", label: "Lv.4" },
    { value: "5", label: "Lv.5" },
  ];
}

function getQuestionStatusFilterOptions() {
  return [{ value: "all", label: "全部状态" }].concat(
    Object.entries(questionStatusMeta).map(([value, meta]) => ({ value, label: meta.label }))
  );
}

function getQuestionStatusLabel(status) {
  return questionStatusMeta[status]?.label ?? status;
}

function getQuestionStatusTone(status) {
  return questionStatusMeta[status]?.tone ?? "primary";
}

function getQuestionTypeLabel(type) {
  return questionTypeMeta[type] ?? type;
}

function getQuestionShareScopeOptions() {
  return Object.entries(questionShareScopeMeta).map(([value, label]) => ({ value, label }));
}

function getQuestionShareScopeLabel(scope) {
  return questionShareScopeMeta[scope] ?? scope;
}

function getUserNameById(userId, users) {
  if (!userId) {
    return "";
  }

  return users.find((user) => user.id === userId)?.name ?? "";
}

function createRenderContext({ route, session, currentUser, users, flash }) {
  const visibleUsers = getVisibleUsersForRole(session.currentRole, currentUser, users);
  const manageableUsers = getManageableUsersForRole(session.currentRole, currentUser, users);
  const questions = getQuestions();
  const visibleQuestions = getVisibleQuestionsForRole(session.currentRole, currentUser, questions);

  return {
    route,
    session,
    currentUser,
    users,
    exams: getExams(),
    questions,
    visibleUsers,
    visibleQuestions,
    manageableUsers,
    auditLogs: getAuditLogs(),
    role: session.currentRole,
    permissions: getPermissionsForRole(session.currentRole),
    flash,
    scopeLabel: getUserScopeLabel(session.currentRole),
    roleEntrySummary: getRoleEntrySummary(session.currentRole),
  };
}


