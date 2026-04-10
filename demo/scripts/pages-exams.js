function renderExamsPage(ctx) {
  if (ctx.role === "Admin") {
    return renderAdminExamsPage(ctx);
  }

  if (ctx.role === "Teacher") {
    return renderTeacherExamsPage(ctx, ctx.currentUser);
  }

  return renderStudentExamsPage(ctx);
}

function renderAdminExamsPage(ctx) {
  const teachers = getTeacherOptions(ctx.users);
  const selectedTeacher = resolveSelectedTeacher(teachers);

  return {
    kicker: "管理员视图",
    title: "考试管理（教师代管）",
    description: "选择一位教师，进入该教师的考试管理工作区并执行等效操作。",
    actions: `
      <button class="btn btn--secondary" type="button" data-action="reset-exam-filters">重置筛选</button>
    `,
    content: `
      <section class="card">
        <form id="exam-filters-form" class="filter-bar filter-bar--exam-admin">
          <div class="filter-control">
            <label class="field-label" for="exam-filter-teacherId">目标教师</label>
            <select id="exam-filter-teacherId" name="teacherId">
              ${renderSelectOptions(
                [{ value: "all", label: "请选择教师" }].concat(
                  teachers.map((teacher) => ({ value: teacher.id, label: `${teacher.name} · ${teacher.loginName}` }))
                ),
                appState.examFilters.teacherId || "all"
              )}
            </select>
          </div>
          <div class="filter-control">
            <label class="field-label" for="exam-filter-query">关键词</label>
            <input id="exam-filter-query" name="query" placeholder="考试名称 / 描述" value="${escapeHtml(appState.examFilters.query)}" />
          </div>
          <div class="filter-control">
            <label class="field-label" for="exam-filter-status">状态</label>
            <select id="exam-filter-status" name="status">
              ${renderSelectOptions(
                [
                  { value: "all", label: "全部状态" },
                  { value: "draft", label: "未发布" },
                  { value: "published", label: "已发布" },
                ],
                appState.examFilters.status
              )}
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn--primary" type="submit">进入教师考试管理</button>
          </div>
        </form>
      </section>
      ${
        selectedTeacher
          ? renderTeacherExamsWorkspace(ctx, selectedTeacher, true)
          : `
            <section class="card" style="margin-top:14px">
              ${renderEmptyState("请先选择教师", "选择教师后可查看并维护该教师名下的考试任务。")}
            </section>
          `
      }
    `,
  };
}

function renderTeacherExamsPage(ctx, actingTeacher) {
  return {
    kicker: "教师视图",
    title: "考试管理",
    description: "查看本人考试任务，发布/删除任务，并维护考试分配名单。",
    actions: `
      <a class="btn btn--primary" href="#/exams/new">新建考试</a>
      <button class="btn btn--secondary" type="button" data-action="reset-exam-filters">重置筛选</button>
    `,
    content: renderTeacherExamsWorkspace(ctx, actingTeacher, false),
  };
}

function renderTeacherExamsWorkspace(ctx, actingTeacher, asAdmin) {
  const teacherExams = filterTeacherExams(getExamsByTeacher(actingTeacher.id, ctx.exams), appState.examFilters);
  const activeStudents = getManagedStudentsForTeacher(actingTeacher.id, ctx.users).filter((user) => user.status === "active");
  const createAction = asAdmin
    ? `<a class="btn btn--primary" href="#/exams/new">为该教师新建考试</a>`
    : "";

  return `
      ${
        asAdmin
          ? `<section class="card" style="margin-top:14px"><div class="badge-row"><span class="badge" data-tone="primary">当前代管教师：${escapeHtml(
              actingTeacher.name
            )}</span></div></section>`
          : ""
      }
      <section class="card">
        <form id="exam-filters-form" class="filter-bar filter-bar--exam${asAdmin ? " filter-bar--exam-admin-inner" : ""}">
          ${
            asAdmin
              ? `<input type="hidden" name="teacherId" value="${actingTeacher.id}" />`
              : ""
          }
          <div class="filter-control">
            <label class="field-label" for="exam-filter-query">关键词</label>
            <input id="exam-filter-query" name="query" placeholder="考试名称 / 描述" value="${escapeHtml(appState.examFilters.query)}" />
          </div>
          <div class="filter-control">
            <label class="field-label" for="exam-filter-status">状态</label>
            <select id="exam-filter-status" name="status">
              ${renderSelectOptions(
                [
                  { value: "all", label: "全部状态" },
                  { value: "draft", label: "未发布" },
                  { value: "published", label: "已发布" },
                ],
                appState.examFilters.status
              )}
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn--primary" type="submit">应用筛选</button>
            ${createAction}
          </div>
        </form>
      </section>
      <section class="table-card">
        <div class="table-toolbar">
          <div class="badge-row">
            <span class="badge" data-tone="primary">考试任务 ${teacherExams.length} 项</span>
            <span class="badge" data-tone="success">可分配学生 ${activeStudents.length} 人</span>
          </div>
        </div>
        ${teacherExams.length ? renderTeacherExamsTable(teacherExams) : renderEmptyState("暂无考试任务", "可新建考试并在详情中分配学生，再执行发布。")}
      </section>
    `;
}

function renderTeacherExamsTable(exams) {
  return `
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>考试任务</th>
            <th>状态</th>
            <th>答题时长</th>
            <th>时间窗</th>
            <th>已分配学生</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${exams
            .map((exam) => {
              const statusTone = exam.status === "published" ? "success" : "warning";
              const assignedCount = exam.assignedStudentIds.length;
              const canPublish = exam.status === "draft";

              return `
                <tr>
                  <td>
                    <div class="table-user__meta">
                      <div class="table-user__name">${escapeHtml(exam.title)}</div>
                      <div class="table-user__sub">${escapeHtml(exam.description || "暂无描述")}</div>
                    </div>
                  </td>
                  <td><span class="badge" data-tone="${statusTone}">${exam.status === "published" ? "已发布" : "未发布"}</span></td>
                  <td>${exam.durationMinutes} 分钟</td>
                  <td>${formatExamWindow(exam.startAt, exam.endAt)}</td>
                  <td>${assignedCount} 人</td>
                  <td>
                    <div class="table-actions">
                      <a class="btn btn--secondary" href="#/exams/${exam.id}">详情</a>
                      <a class="btn btn--soft" href="#/exams/${exam.id}/edit">编辑</a>
                      ${
                        canPublish
                          ? `<button class="btn btn--success-soft" type="button" data-action="publish-exam" data-exam-id="${exam.id}">发布</button>`
                          : `<span class="badge" data-tone="success">已发布</span>`
                      }
                      <button class="btn btn--danger-soft" type="button" data-action="delete-exam" data-exam-id="${exam.id}">删除</button>
                    </div>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderStudentExamsPage(ctx) {
  const availableExams = getExamsForStudent(ctx.currentUser.id, ctx.exams).map((exam) => {
    const phase = getExamPhase(exam);
    return {
      ...exam,
      phase,
      phaseMeta: getExamPhaseMeta(phase),
    };
  });

  return {
    kicker: "学生视图",
    title: "我的考试",
    description: "查看已分配给自己的考试任务，并进入考试详情。",
    actions: `
      <a class="btn btn--secondary" href="#/dashboard">返回首页</a>
    `,
    content: `
      <section class="stats-grid">
        ${renderStatCard("已分配考试", availableExams.length, "仅显示已发布且分配给本人的考试")}
        ${renderStatCard("最近更新时间", availableExams[0] ? formatDateTime(availableExams[0].updatedAt) : "暂无", "以教师发布和分配维护为准")}
      </section>
      <section class="section-grid exams-grid-single">
        <div class="card">
          <h3>考试列表</h3>
          <p>显示考试时期：未开始、考试中、已结束。仅“考试中”可参加。</p>
          <div class="exam-card-list">
            ${
              availableExams.length
                ? availableExams
                    .map(
                      (exam) => `
                        <article class="exam-card-item">
                          <div class="exam-card-item__head">
                            <h4>${escapeHtml(exam.title)}</h4>
                            <span class="badge" data-tone="${exam.phaseMeta.tone}">${exam.phaseMeta.label}</span>
                          </div>
                          <div class="muted">${escapeHtml(exam.description || "暂无描述")}</div>
                          <div class="exam-card-item__meta">
                            <span>时长：${exam.durationMinutes} 分钟</span>
                            <span>时间窗：${formatExamWindow(exam.startAt, exam.endAt)}</span>
                          </div>
                          <div class="form-actions">
                            <a class="btn btn--secondary" href="#/exams/${exam.id}">查看详情</a>
                            <button class="btn btn--primary" type="button" data-action="mock-enter-exam" data-exam-id="${exam.id}">参加考试</button>
                          </div>
                        </article>
                      `
                    )
                    .join("")
                : renderEmptyState("暂无可参加考试", "等待教师发布并将考试任务分配给你。")
            }
          </div>
        </div>
      </section>
    `,
  };
}

function renderExamFormPage(ctx, exam) {
  const editing = Boolean(exam);
  const resolvedExam =
    exam ||
    ({
      id: "",
      title: "",
      description: "",
      startAt: "",
      endAt: "",
      durationMinutes: 60,
      allowSwitchCount: 3,
      shuffleQuestions: false,
      status: "draft",
      assignedStudentIds: [],
      createdBy: "",
    });

  const teacherOptions = getTeacherOptions(ctx.users);
  const defaultTeacherId =
    ctx.role === "Teacher"
      ? ctx.currentUser.id
      : appState.examFilters.teacherId && appState.examFilters.teacherId !== "all"
      ? appState.examFilters.teacherId
      : teacherOptions[0]?.id || "";
  const selectedTeacherId = resolvedExam.createdBy || defaultTeacherId;

  return {
    kicker: editing ? "编辑考试" : "新建考试",
    title: editing ? `编辑 ${escapeHtml(resolvedExam.title)}` : "新建考试任务",
    description: "配置考试基本信息与时间窗，保存后可在详情页维护分配名单并发布。",
    actions: `
      <a class="btn btn--secondary" href="${editing ? `#/exams/${resolvedExam.id}` : "#/exams"}">取消</a>
    `,
    content: `
      <section class="card">
        <form id="exam-form" data-exam-id="${editing ? resolvedExam.id : ""}" class="form-grid">
          <div class="form-row">
            <label for="exam-title">考试标题</label>
            <input id="exam-title" name="title" value="${escapeHtml(resolvedExam.title)}" placeholder="例如：软件过程期中考试" />
          </div>
          ${
            ctx.role === "Admin"
              ? `
                <div class="form-row">
                  <label for="exam-teacherId">归属教师</label>
                  <select id="exam-teacherId" name="teacherId">
                    ${renderSelectOptions(
                      [{ value: "", label: "请选择教师" }].concat(
                        teacherOptions.map((teacher) => ({ value: teacher.id, label: `${teacher.name} · ${teacher.loginName}` }))
                      ),
                      selectedTeacherId
                    )}
                  </select>
                </div>
              `
              : ""
          }
          <div class="form-row">
            <label for="exam-description">考试说明</label>
            <textarea id="exam-description" name="description" placeholder="请输入考试说明、注意事项或范围">${escapeHtml(
              resolvedExam.description
            )}</textarea>
          </div>
          <div class="form-row--double">
            <div class="form-row">
              <label for="exam-startAt">开始时间</label>
              <input id="exam-startAt" name="startAt" type="datetime-local" value="${toDateTimeLocalValue(resolvedExam.startAt)}" />
            </div>
            <div class="form-row">
              <label for="exam-endAt">结束时间</label>
              <input id="exam-endAt" name="endAt" type="datetime-local" value="${toDateTimeLocalValue(resolvedExam.endAt)}" />
            </div>
          </div>
          <div class="form-row--double">
            <div class="form-row">
              <label for="exam-duration">答题时长（分钟）</label>
              <input id="exam-duration" name="durationMinutes" type="number" min="10" step="5" value="${resolvedExam.durationMinutes}" />
            </div>
            <div class="form-row">
              <label for="exam-switch-count">允许切屏次数</label>
              <input id="exam-switch-count" name="allowSwitchCount" type="number" min="0" step="1" value="${resolvedExam.allowSwitchCount ?? 3}" />
            </div>
          </div>
          <div class="form-row">
            <label class="role-option">
              <input class="role-option__input" type="checkbox" name="shuffleQuestions" value="1" ${resolvedExam.shuffleQuestions ? "checked" : ""} />
              <span class="role-option__content">
                <span class="role-option__title-row">
                  <strong>随机乱序题目</strong>
                  <span class="role-option__indicator" aria-hidden="true"></span>
                </span>
                <small>开启后学生进入考试时按随机顺序展示题目。</small>
              </span>
            </label>
          </div>
          <div class="form-actions">
            <button class="btn btn--primary" type="submit">${editing ? "保存考试" : "创建考试"}</button>
            <a class="btn btn--secondary" href="${editing ? `#/exams/${resolvedExam.id}` : "#/exams"}">取消</a>
          </div>
        </form>
      </section>
    `,
  };
}

function renderExamDetailPage(ctx, exam) {
  if (!exam) {
    return renderNotFoundPage(ctx, "没有找到对应考试任务。", "当前请求的考试不存在或已被删除。");
  }

  const teacher = ctx.users.find((user) => user.id === exam.createdBy) ?? null;
  const assignedStudents = getAssignedStudents(exam, ctx.users);

  if (ctx.role === "Teacher" || ctx.role === "Admin") {
    const ownerTeacher = ctx.users.find((user) => user.id === exam.createdBy && user.primaryRole === "Teacher") ?? null;
    const candidates = ownerTeacher ? getManagedStudentsForTeacher(ownerTeacher.id, ctx.users).filter((user) => user.status === "active") : [];

    return {
      kicker: ctx.role === "Admin" ? "考试详情（代管）" : "考试详情",
      title: escapeHtml(exam.title),
      description: "查看考试配置、分配名单，并执行分配与取消分配。",
      actions: `
        <a class="btn btn--soft" href="#/exams/${exam.id}/edit">编辑考试</a>
        <a class="btn btn--secondary" href="#/exams">返回列表</a>
      `,
      content: `
        <section class="detail-grid exams-detail-grid">
          <div class="card">
            <div class="detail-list">
              ${renderInfoItem("状态", `<span class="badge" data-tone="${exam.status === "published" ? "success" : "warning"}">${exam.status === "published" ? "已发布" : "未发布"}</span>`)}
              ${renderInfoItem("答题时长", `${exam.durationMinutes} 分钟`)}
              ${renderInfoItem("开始时间", formatDateTime(exam.startAt))}
              ${renderInfoItem("结束时间", formatDateTime(exam.endAt))}
              ${renderInfoItem("允许切屏次数", `${exam.allowSwitchCount ?? 0} 次`)}
              ${renderInfoItem("随机乱序", exam.shuffleQuestions ? "开启" : "关闭")}
              ${renderInfoItem("已分配学生", `${assignedStudents.length} 人`)}
              ${renderInfoItem("归属教师", escapeHtml(ownerTeacher ? ownerTeacher.name : "未记录"))}
              ${renderInfoItem("更新时间", formatDateTime(exam.updatedAt))}
            </div>
            <div class="panel-note" style="margin-top:12px">${escapeHtml(exam.description || "暂无考试说明")}</div>
          </div>
          <div class="card">
            <h3>分配学生</h3>
            <p>可为当前考试分配或取消学生，发布前请确认分配名单。</p>
            <form id="exam-assignment-form" data-exam-id="${exam.id}" class="form-grid" style="margin-top:12px">
              <div class="exam-assignment-list">
                ${
                  candidates.length
                    ? candidates
                        .map(
                          (student) => `
                            <label class="exam-assignment-item">
                              <input type="checkbox" name="studentIds" value="${student.id}" ${exam.assignedStudentIds.includes(student.id) ? "checked" : ""} />
                              <span>
                                <strong>${escapeHtml(student.name)}</strong>
                                <small>${escapeHtml(student.loginName)} · ${escapeHtml(student.classId || "未设置班级")}</small>
                              </span>
                            </label>
                          `
                        )
                        .join("")
                    : `<div class="muted">当前暂无可分配的有效学生。</div>`
                }
              </div>
              <div class="form-actions">
                <button class="btn btn--primary" type="submit">保存分配</button>
              </div>
            </form>
          </div>
        </section>
      `,
    };
  }

  return {
    kicker: "考试详情",
    title: escapeHtml(exam.title),
    description: "查看考试任务基础信息并进入考试流程。",
    actions: `
      <a class="btn btn--secondary" href="#/exams">返回我的考试</a>
    `,
    content: `
      <section class="section-grid exams-grid-single">
        <div class="card">
          <div class="detail-list">
            ${renderInfoItem("考试时期", `<span class="badge" data-tone="${getExamPhaseMeta(getExamPhase(exam)).tone}">${getExamPhaseMeta(getExamPhase(exam)).label}</span>`)}
            ${renderInfoItem("发布教师", escapeHtml(teacher ? teacher.name : "未记录"))}
            ${renderInfoItem("状态", `<span class="badge" data-tone="success">已发布</span>`)}
            ${renderInfoItem("答题时长", `${exam.durationMinutes} 分钟`)}
            ${renderInfoItem("开始时间", formatDateTime(exam.startAt))}
            ${renderInfoItem("结束时间", formatDateTime(exam.endAt))}
            ${renderInfoItem("考试说明", escapeHtml(exam.description || "暂无说明"))}
          </div>
          <div class="panel-note" style="margin-top:12px">本 Demo 版本展示考试入口和任务分配，不包含真实答题流程。</div>
          <div class="form-actions" style="margin-top:12px">
            <button class="btn btn--primary" type="button" data-action="mock-enter-exam" data-exam-id="${exam.id}">参加考试</button>
          </div>
        </div>
      </section>
    `,
  };
}

function renderExamTakingPage(ctx, exam) {
  const teacher = ctx.users.find((user) => user.id === exam.createdBy) ?? null;

  return {
    kicker: "考试进行中",
    title: `正在作答：${escapeHtml(exam.title)}`,
    description: "当前为演示版考试界面，展示进入考试后的基本作答结构。",
    actions: `
      <a class="btn btn--secondary" href="#/exams/${exam.id}">返回考试详情</a>
    `,
    content: `
      <section class="section-grid exams-grid-single">
        <div class="card">
          <div class="badge-row">
            <span class="badge" data-tone="success">考试中</span>
            <span class="badge" data-tone="primary">时长 ${exam.durationMinutes} 分钟</span>
            <span class="badge" data-tone="primary">发布教师 ${escapeHtml(teacher ? teacher.name : "未记录")}</span>
          </div>
          <div class="panel-note" style="margin-top:12px">时间窗：${formatExamWindow(exam.startAt, exam.endAt)}</div>

          <div class="form-grid" style="margin-top:14px">
            <div class="card" style="border-radius:12px; box-shadow:none">
              <h3>第 1 题（单选）</h3>
              <p>在软件过程模型中，哪种模型最强调“快速迭代与持续反馈”？</p>
              <div class="form-row" style="margin-top:10px">
                <label><input type="radio" name="mock-q1" /> 瀑布模型</label>
                <label><input type="radio" name="mock-q1" /> 螺旋模型</label>
                <label><input type="radio" name="mock-q1" /> 敏捷开发</label>
                <label><input type="radio" name="mock-q1" /> V 模型</label>
              </div>
            </div>

            <div class="card" style="border-radius:12px; box-shadow:none">
              <h3>第 2 题（简答）</h3>
              <p>请简述需求变更对项目计划管理的影响，并给出两点控制建议。</p>
              <div class="form-row" style="margin-top:10px">
                <textarea placeholder="此处为演示输入框，不会真实保存答案。"></textarea>
              </div>
            </div>
          </div>

          <div class="form-actions" style="margin-top:14px">
            <button class="btn btn--primary" type="button" data-action="submit-exam" data-exam-id="${exam.id}">提交考试</button>
          </div>
        </div>
      </section>
    `,
  };
}

function getExamsByTeacher(teacherId, exams) {
  return exams
    .filter((exam) => exam.createdBy === teacherId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function getExamsForStudent(studentId, exams) {
  return exams
    .filter((exam) => exam.status === "published" && exam.assignedStudentIds.includes(studentId))
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
}

function getAssignedStudents(exam, users) {
  return users.filter((user) => user.primaryRole === "Student" && exam.assignedStudentIds.includes(user.id));
}

function filterTeacherExams(exams, filters) {
  return exams
    .filter((exam) => {
      const query = String(filters.query || "").trim().toLowerCase();

      if (!query) {
        return true;
      }

      return [exam.title, exam.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .filter((exam) => (filters.status === "all" ? true : exam.status === filters.status));
}

function resolveSelectedTeacher(teachers) {
  if (!Array.isArray(teachers) || !teachers.length) {
    return null;
  }

  const targetTeacherId = appState.examFilters.teacherId;

  if (!targetTeacherId || targetTeacherId === "all") {
    return null;
  }

  return teachers.find((teacher) => teacher.id === targetTeacherId) ?? null;
}

function formatExamWindow(startAt, endAt) {
  const start = formatDateTime(startAt);
  const end = formatDateTime(endAt);
  return `${start} - ${end}`;
}

function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (num) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hour}:${minute}`;
}
