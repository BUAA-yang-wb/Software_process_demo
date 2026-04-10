const GRADE_STORAGE_KEYS = {
  records: "sp_demo_grade_records",
  appeals: "sp_demo_grade_appeals",
};

function ensureGradeDemoData(users, exams) {
  const existingRecords = readStorage(localStorage, GRADE_STORAGE_KEYS.records, null);
  const existingAppeals = readStorage(localStorage, GRADE_STORAGE_KEYS.appeals, null);

  const seedRecords = createSeedGradeRecords(users, exams);
  const mergedRecords = mergeById(seedRecords, Array.isArray(existingRecords) ? existingRecords : []);
  writeStorage(localStorage, GRADE_STORAGE_KEYS.records, mergedRecords);

  const seedAppeals = createSeedGradeAppeals();
  const mergedAppeals = mergeById(seedAppeals, Array.isArray(existingAppeals) ? existingAppeals : []);
  writeStorage(localStorage, GRADE_STORAGE_KEYS.appeals, mergedAppeals);
}

function createSeedGradeRecords(users, exams) {
  const students = users.filter((user) => user.primaryRole === "Student" && user.status === "active");

  if (!students.length || !exams.length) {
    return [];
  }

  const questionTemplates = [
    { id: "q-obj-001", type: "single", title: "单选题：需求模型识别", maxScore: 10, standardAnswer: "B" },
    { id: "q-obj-002", type: "multiple", title: "多选题：质量属性判断", maxScore: 10, standardAnswer: "A,B,C" },
    { id: "q-obj-003", type: "judge", title: "判断题：敏捷迭代节奏", maxScore: 10, standardAnswer: "正确" },
    { id: "q-sub-001", type: "short", title: "简答题：说明用例图作用", maxScore: 30, standardAnswer: "教师评阅" },
    { id: "q-sub-002", type: "essay", title: "论述题：过程改进方案", maxScore: 40, standardAnswer: "教师评阅" },
  ];

  return exams
    .filter((exam) => exam.status === "published")
    .flatMap((exam, examIndex) =>
      students
        .filter((student) => exam.assignedStudentIds.includes(student.id))
        .map((student, studentIndex) => {
          const objectiveBase = 20 + ((examIndex + 2) * (studentIndex + 3)) % 11;
          const subjectiveBase = 42 + ((examIndex + 5) * (studentIndex + 2)) % 20;
          const objectiveScore = Math.min(30, objectiveBase);
          const subjectiveScore = Math.min(70, subjectiveBase);
          const totalScore = objectiveScore + subjectiveScore;

          const status = exam.id === "exam-004" ? "published" : exam.id === "exam-003" ? "subjective-reviewed" : "objective-reviewed";

          return {
            id: `grade-${exam.id}-${student.id}`,
            examId: exam.id,
            studentId: student.id,
            classId: student.classId || "未分班",
            objectiveScore,
            subjectiveScore,
            totalScore,
            status,
            teacherComment: status === "published" ? "整体表现稳定，注意主观题条理性。" : "待完成主观题评阅后发布。",
            classRank: studentIndex + 1,
            classSize: students.length,
            gradeRank: studentIndex + 4,
            gradeSize: students.length + 28,
            updatedAt: new Date().toISOString(),
            details: questionTemplates.map((item, index) => {
              const isObjective = ["single", "multiple", "judge"].includes(item.type);
              const ratio = Math.min(1, Math.max(0.2, (objectiveScore + subjectiveScore) / 100 - index * 0.05));

              return {
                questionId: item.id,
                questionType: item.type,
                title: item.title,
                maxScore: item.maxScore,
                score: isObjective ? Math.round(item.maxScore * ratio) : Math.round(item.maxScore * (ratio + 0.1)),
                studentAnswer: isObjective ? `演示答案-${index + 1}` : "学生主观作答内容（演示）",
                standardAnswer: item.standardAnswer,
              };
            }),
          };
        })
    );
}

function createSeedGradeAppeals() {
  return [
    {
      id: "appeal-001",
      examId: "exam-004",
      studentId: "user-student-001",
      reason: "第4题得分偏低，希望复核论述题评分标准。",
      questionIds: ["q-sub-002"],
      status: "pending",
      result: "",
      createdAt: "2026-04-09T16:20:00",
      processedAt: "",
      processedBy: "",
    },
  ];
}

function mergeById(seed, existing) {
  const byId = new Map(existing.map((item) => [item.id, item]));
  const merged = seed.map((item) => ({ ...item, ...(byId.get(item.id) || {}) }));
  const custom = existing.filter((item) => !seed.some((seedItem) => seedItem.id === item.id));
  return [...merged, ...custom];
}

function getGradeRecords() {
  return readStorage(localStorage, GRADE_STORAGE_KEYS.records, []);
}

function saveGradeRecords(records) {
  writeStorage(localStorage, GRADE_STORAGE_KEYS.records, records);
}

function getGradeAppeals() {
  return readStorage(localStorage, GRADE_STORAGE_KEYS.appeals, []);
}

function saveGradeAppeals(appeals) {
  writeStorage(localStorage, GRADE_STORAGE_KEYS.appeals, appeals);
}

function renderGradesPage(ctx) {
  ensureGradeDemoData(ctx.users, ctx.exams);

  if (!appState.gradeFilters) {
    appState.gradeFilters = {
      examId: "all",
      classId: "all",
      analysisMode: "stats",
      compareType: "class",
      studentExamId: "all",
    };
  }

  return ctx.role === "Student" ? renderStudentGradesPage(ctx) : renderTeacherGradesPage(ctx);
}

function renderTeacherGradesPage(ctx) {
  const records = getGradeRecords();
  const appeals = getGradeAppeals();
  const teacherExams = ctx.exams.filter((exam) => ctx.role === "Admin" || exam.createdBy === ctx.currentUser.id);
  const selectedExamId = appState.gradeFilters.examId === "all" ? teacherExams[0]?.id || "all" : appState.gradeFilters.examId;
  const selectedExam = teacherExams.find((exam) => exam.id === selectedExamId) || teacherExams[0] || null;
  const selectedClass = appState.gradeFilters.classId || "all";

  const scopedRecords = records
    .filter((record) => !selectedExam || record.examId === selectedExam.id)
    .filter((record) => (selectedClass === "all" ? true : record.classId === selectedClass));

  const classes = [...new Set(scopedRecords.map((record) => record.classId))].filter(Boolean);
  const stats = buildTeacherStats(scopedRecords);

  return {
    kicker: ctx.role === "Admin" ? "管理员视图" : "教师视图",
    title: "评卷与成绩分析",
    description: "覆盖自动批阅、人工评阅、成绩分析、导出与复核申诉处理，形成闭环流程。",
    actions: `
      <button class="btn btn--secondary" type="button" data-action="run-objective-grading" data-exam-id="${selectedExam ? selectedExam.id : ""}">开始客观题批阅</button>
      <button class="btn btn--primary" type="button" data-action="publish-grade" data-exam-id="${selectedExam ? selectedExam.id : ""}">发布当前考试成绩</button>
    `,
    content: `
      ${renderFlowHintBlock()}
      <section class="card">
        <h3>筛选范围</h3>
        <form id="grade-filters-form" class="filter-bar grade-filter-bar">
          <div class="filter-control">
            <label class="field-label" for="grade-filter-exam">考试</label>
            <select id="grade-filter-exam" name="examId">
              ${renderSelectOptions(
                [{ value: "all", label: "全部考试" }].concat(
                  teacherExams.map((exam) => ({ value: exam.id, label: exam.title }))
                ),
                selectedExamId
              )}
            </select>
          </div>
          <div class="filter-control">
            <label class="field-label" for="grade-filter-class">班级</label>
            <select id="grade-filter-class" name="classId">
              ${renderSelectOptions(
                [{ value: "all", label: "全部班级" }].concat(classes.map((classId) => ({ value: classId, label: classId }))),
                selectedClass
              )}
            </select>
          </div>
          <div class="filter-control">
            <label class="field-label" for="grade-filter-analysis">分析类型</label>
            <select id="grade-filter-analysis" name="analysisMode">
              ${renderSelectOptions(
                [
                  { value: "stats", label: "统计分析" },
                  { value: "compare", label: "对比分析" },
                ],
                appState.gradeFilters.analysisMode
              )}
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn--primary" type="submit">应用筛选</button>
          </div>
        </form>
      </section>

      <section class="stats-grid grades-stats-grid">
        ${renderStatCard("参与人数", stats.count, "按筛选条件统计")}
        ${renderStatCard("平均分", stats.avg, "含客观+主观总分")}
        ${renderStatCard("及格率", `${stats.passRate}%`, "默认及格线 60")}
        ${renderStatCard("优秀率", `${stats.excellentRate}%`, "默认优秀线 90")}
      </section>

      <section class="section-grid grades-section-grid">
        <div class="card">
          <h3>评卷核心模块</h3>
          <p>支持客观题自动批阅和主观题人工评阅，教师可按考试逐步推进。</p>
          ${renderReviewProgress(scopedRecords)}
          <form id="subjective-review-form" class="form-grid grade-form" data-exam-id="${selectedExam ? selectedExam.id : ""}">
            <div class="form-row--double">
              <div class="form-row">
                <label for="subjective-student-id">学生</label>
                <select id="subjective-student-id" name="studentId">
                  ${renderSelectOptions(
                    scopedRecords.map((record) => ({
                      value: record.studentId,
                      label: `${getUserNameById(record.studentId, ctx.users)} · ${record.classId}`,
                    })),
                    scopedRecords[0]?.studentId || ""
                  )}
                </select>
              </div>
              <div class="form-row">
                <label for="subjective-score">主观题分数（0-70）</label>
                <input id="subjective-score" name="subjectiveScore" type="number" min="0" max="70" step="1" value="56" />
              </div>
            </div>
            <div class="form-row">
              <label for="subjective-comment">评语</label>
              <textarea id="subjective-comment" name="comment" placeholder="请输入评语（可选）">论述有思路，建议补充关键步骤细节。</textarea>
            </div>
            <div class="form-actions">
              <button class="btn btn--primary" type="submit">保存主观题评阅</button>
            </div>
          </form>
        </div>

        <div class="card">
          <h3>教学分析模块</h3>
          <p>支持统计分析、对比分析、试题难度与区分度查看。</p>
          ${appState.gradeFilters.analysisMode === "compare" ? renderComparePanel(scopedRecords) : renderStatsPanel(scopedRecords)}
          <div class="divider"></div>
          <h4>试题难度与区分度</h4>
          ${renderQuestionQualityTable(scopedRecords)}
        </div>
      </section>

      <section class="section-grid grades-section-grid">
        <div class="card">
          <h3>数据输出模块</h3>
          <p>支持教师端成绩报告导出（Excel/PDF）。</p>
          <form id="teacher-export-form" class="form-grid grade-form" data-exam-id="${selectedExam ? selectedExam.id : ""}">
            <div class="form-row--double">
              <div class="form-row">
                <label for="export-format">导出格式</label>
                <select id="export-format" name="format">
                  ${renderSelectOptions(
                    [
                      { value: "excel", label: "Excel (.xlsx)" },
                      { value: "pdf", label: "PDF (.pdf)" },
                    ],
                    "excel"
                  )}
                </select>
              </div>
              <div class="form-row">
                <label for="export-scope">导出范围</label>
                <select id="export-scope" name="scope">
                  ${renderSelectOptions(
                    [
                      { value: "exam", label: "当前考试" },
                      { value: "class", label: "当前班级" },
                    ],
                    "exam"
                  )}
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn--primary" type="submit">生成教师端报告</button>
            </div>
          </form>
        </div>

        <div class="card">
          <h3>成绩复核模块</h3>
          <p>学生申诉后进入待处理池，处理后可触发回流评阅。</p>
          ${renderAppealsTable(appeals, ctx.users)}
        </div>
      </section>
    `,
  };
}

function renderStudentGradesPage(ctx) {
  const records = getGradeRecords().filter((record) => record.studentId === ctx.currentUser.id);
  const appeals = getGradeAppeals().filter((appeal) => appeal.studentId === ctx.currentUser.id);
  const selectedExamId = appState.gradeFilters.studentExamId === "all" ? records[0]?.examId || "all" : appState.gradeFilters.studentExamId;
  const selectedRecord = records.find((record) => record.examId === selectedExamId) || records[0] || null;

  return {
    kicker: "学生视图",
    title: "我的成绩与分析",
    description: "查看成绩明细、个人分析，下载成绩单并提交复核申请。",
    actions: `
      <button class="btn btn--secondary" type="button" data-action="student-export-report" data-exam-id="${selectedRecord ? selectedRecord.examId : ""}">下载成绩单</button>
    `,
    content: `
      ${renderFlowHintBlock()}
      <section class="card">
        <h3>学生成绩查询</h3>
        <form id="student-grade-filters-form" class="filter-bar grade-filter-bar grade-filter-bar--student">
          <div class="filter-control">
            <label class="field-label" for="student-grade-exam">考试</label>
            <select id="student-grade-exam" name="studentExamId">
              ${renderSelectOptions(
                [{ value: "all", label: "全部考试" }].concat(
                  records.map((record) => {
                    const exam = ctx.exams.find((item) => item.id === record.examId);
                    return { value: record.examId, label: exam ? exam.title : record.examId };
                  })
                ),
                selectedExamId
              )}
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn--primary" type="submit">查看</button>
          </div>
        </form>
        ${selectedRecord ? renderStudentScoreCard(selectedRecord, ctx.exams) : renderEmptyState("暂无成绩记录", "当前暂无已发布成绩。")}
      </section>

      <section class="section-grid grades-section-grid">
        <div class="card">
          <h3>学生端成绩分析</h3>
          ${selectedRecord ? renderStudentAnalysis(selectedRecord) : renderEmptyState("暂无成绩分析", "请先选择有效考试。")}
        </div>
        <div class="card">
          <h3>试题难度与区分度</h3>
          ${selectedRecord ? renderQuestionQualityTable([selectedRecord]) : renderEmptyState("暂无试题分析", "无有效作答数据。")}
        </div>
      </section>

      <section class="section-grid grades-section-grid">
        <div class="card">
          <h3>学生端成绩单导出</h3>
          <p>默认导出 PDF，也可选择简化 Excel。</p>
          <form id="student-export-form" class="form-grid grade-form" data-exam-id="${selectedRecord ? selectedRecord.examId : ""}">
            <div class="form-row">
              <label for="student-export-format">导出格式</label>
              <select id="student-export-format" name="format">
                ${renderSelectOptions(
                  [
                    { value: "pdf", label: "PDF（默认）" },
                    { value: "excel", label: "简化 Excel" },
                  ],
                  "pdf"
                )}
              </select>
            </div>
            <div class="form-actions">
              <button class="btn btn--primary" type="submit">生成成绩单</button>
            </div>
          </form>
        </div>

        <div class="card">
          <h3>成绩复核申诉</h3>
          <form id="grade-appeal-form" class="form-grid grade-form" data-exam-id="${selectedRecord ? selectedRecord.examId : ""}">
            <div class="form-row">
              <label for="appeal-question-ids">申诉题目（可多题，逗号分隔）</label>
              <input id="appeal-question-ids" name="questionIds" placeholder="例如：q-sub-001,q-sub-002" />
            </div>
            <div class="form-row">
              <label for="appeal-reason">申诉理由（至少10字）</label>
              <textarea id="appeal-reason" name="reason" placeholder="请说明具体异议点"></textarea>
            </div>
            <div class="form-actions">
              <button class="btn btn--primary" type="submit">提交复核申请</button>
            </div>
          </form>
          ${renderStudentAppealList(appeals, ctx.exams)}
        </div>
      </section>
    `,
  };
}

function buildTeacherStats(records) {
  if (!records.length) {
    return {
      count: 0,
      avg: "0.00",
      passRate: "0.00",
      excellentRate: "0.00",
    };
  }

  const total = records.reduce((sum, item) => sum + item.totalScore, 0);
  const passCount = records.filter((item) => item.totalScore >= 60).length;
  const excellentCount = records.filter((item) => item.totalScore >= 90).length;

  return {
    count: records.length,
    avg: (total / records.length).toFixed(2),
    passRate: ((passCount / records.length) * 100).toFixed(2),
    excellentRate: ((excellentCount / records.length) * 100).toFixed(2),
  };
}

function renderFlowHintBlock() {
  return `
    <section class="card grades-flow-card">
      <h3>评卷与成绩分析流程</h3>
      <div class="grades-flow-grid">
        <span class="badge" data-tone="primary">评卷核心</span>
        <span class="grades-flow-arrow">→</span>
        <span class="badge" data-tone="warning">成绩查询</span>
        <span class="grades-flow-arrow">→</span>
        <span class="badge" data-tone="success">教学分析</span>
        <span class="grades-flow-arrow">→</span>
        <span class="badge" data-tone="primary">数据输出</span>
        <span class="grades-flow-arrow">→</span>
        <span class="badge" data-tone="danger">复核申诉</span>
      </div>
      <p class="muted">当复核通过且成绩调整时，系统会回流至评卷模块重新更新评分结果。</p>
    </section>
  `;
}

function renderReviewProgress(records) {
  const objectiveCount = records.filter((item) => ["objective-reviewed", "subjective-reviewed", "published"].includes(item.status)).length;
  const subjectiveCount = records.filter((item) => ["subjective-reviewed", "published"].includes(item.status)).length;
  const publishedCount = records.filter((item) => item.status === "published").length;

  return `
    <div class="grades-progress-grid">
      <div class="quick-card">
        <h4>客观题已批阅</h4>
        <p>${objectiveCount} / ${records.length} 份答卷</p>
      </div>
      <div class="quick-card">
        <h4>主观题已评阅</h4>
        <p>${subjectiveCount} / ${records.length} 份答卷</p>
      </div>
      <div class="quick-card">
        <h4>成绩已发布</h4>
        <p>${publishedCount} / ${records.length} 份答卷</p>
      </div>
    </div>
  `;
}

function renderStatsPanel(records) {
  if (!records.length) {
    return renderEmptyState("暂无成绩数据", "请先完成评阅流程。");
  }

  const sorted = [...records].sort((a, b) => b.totalScore - a.totalScore);
  const maxScore = sorted[0]?.totalScore || 0;

  return `
    <div class="grades-chart-list">
      ${sorted
        .slice(0, 6)
        .map((record) => {
          const ratio = maxScore ? Math.round((record.totalScore / maxScore) * 100) : 0;
          return `
            <div class="grades-chart-row">
              <div class="grades-chart-label">${escapeHtml(record.classId)} · ${record.totalScore}分</div>
              <div class="grades-chart-bar"><span style="width:${ratio}%"></span></div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderComparePanel(records) {
  if (records.length < 2) {
    return renderInlineBanner({ tone: "warning", message: "对比分析至少需要2个对象，当前样本不足。" });
  }

  const grouped = records.reduce((acc, item) => {
    const key = item.classId || "未分班";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item.totalScore);
    return acc;
  }, {});

  const dataset = Object.entries(grouped).map(([key, values]) => ({
    key,
    avg: values.reduce((sum, value) => sum + value, 0) / values.length,
  }));
  const maxAvg = Math.max(...dataset.map((item) => item.avg), 1);

  return `
    <div class="grades-chart-list">
      ${dataset
        .map((item) => {
          const ratio = Math.round((item.avg / maxAvg) * 100);
          return `
            <div class="grades-chart-row">
              <div class="grades-chart-label">${escapeHtml(item.key)} · 均分 ${item.avg.toFixed(2)}</div>
              <div class="grades-chart-bar"><span style="width:${ratio}%"></span></div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderQuestionQualityTable(records) {
  if (!records.length) {
    return renderEmptyState("暂无题目数据", "请先完成评阅。");
  }

  const questionMap = new Map();

  records.forEach((record) => {
    (record.details || []).forEach((detail) => {
      const bucket = questionMap.get(detail.questionId) || {
        questionId: detail.questionId,
        title: detail.title,
        maxScore: detail.maxScore,
        scores: [],
      };
      bucket.scores.push(detail.score);
      questionMap.set(detail.questionId, bucket);
    });
  });

  const rows = Array.from(questionMap.values()).map((item) => {
    const avgScore = item.scores.reduce((sum, value) => sum + value, 0) / item.scores.length;
    const difficulty = item.maxScore > 0 ? avgScore / item.maxScore : 0;
    const half = Math.max(1, Math.floor(item.scores.length * 0.5));
    const sorted = [...item.scores].sort((a, b) => b - a);
    const highAvg = sorted.slice(0, half).reduce((sum, value) => sum + value, 0) / half;
    const lowAvg = sorted.slice(-half).reduce((sum, value) => sum + value, 0) / half;
    const discrimination = item.maxScore > 0 ? (highAvg - lowAvg) / item.maxScore : 0;

    const level =
      discrimination >= 0.35
        ? "优秀"
        : discrimination >= 0.25
        ? "良好"
        : discrimination >= 0.15
        ? "尚可"
        : "较差";

    return {
      ...item,
      difficulty: difficulty.toFixed(2),
      discrimination: discrimination.toFixed(2),
      level,
    };
  });

  return `
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>题目</th>
            <th>难度系数</th>
            <th>区分度</th>
            <th>评价</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  <td>${escapeHtml(row.title)}</td>
                  <td>${row.difficulty}</td>
                  <td>${row.discrimination}</td>
                  <td><span class="badge" data-tone="${row.level === "较差" ? "danger" : "success"}">${row.level}</span></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAppealsTable(appeals, users) {
  if (!appeals.length) {
    return renderEmptyState("暂无复核申请", "当前没有待处理申诉。");
  }

  return `
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>申请编号</th>
            <th>学生</th>
            <th>状态</th>
            <th>申诉理由</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${appeals
            .map((appeal) => {
              const tone = appeal.status === "pending" ? "warning" : appeal.status === "resolved" ? "success" : "danger";

              return `
                <tr>
                  <td>${escapeHtml(appeal.id)}</td>
                  <td>${escapeHtml(getUserNameById(appeal.studentId, users) || "未知学生")}</td>
                  <td><span class="badge" data-tone="${tone}">${appeal.status === "pending" ? "待处理" : appeal.status === "resolved" ? "已处理" : "已驳回"}</span></td>
                  <td>${escapeHtml(appeal.reason)}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn--success-soft" type="button" data-action="process-appeal" data-appeal-id="${appeal.id}" data-result="adjust">复核并调分</button>
                      <button class="btn btn--secondary" type="button" data-action="process-appeal" data-appeal-id="${appeal.id}" data-result="keep">维持原分</button>
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

function renderStudentScoreCard(record, exams) {
  const exam = exams.find((item) => item.id === record.examId);

  return `
    <div class="grades-student-score">
      <div class="grades-student-head">
        <h4>${escapeHtml(exam ? exam.title : record.examId)}</h4>
        <span class="badge" data-tone="${record.status === "published" ? "success" : "warning"}">${record.status === "published" ? "已发布" : "待发布"}</span>
      </div>
      <div class="stats-grid grades-stats-grid">
        ${renderStatCard("总分", record.totalScore, "满分 100")}
        ${renderStatCard("客观题得分", record.objectiveScore, "系统自动批阅")}
        ${renderStatCard("主观题得分", record.subjectiveScore, "教师人工评阅")}
        ${renderStatCard("班级排名", `${record.classRank}/${record.classSize}`, "未排名时显示暂无")}
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>题目</th>
              <th>得分</th>
              <th>学生答案</th>
              <th>标准答案</th>
            </tr>
          </thead>
          <tbody>
            ${(record.details || [])
              .map(
                (detail) => `
                  <tr>
                    <td>${escapeHtml(detail.title)}</td>
                    <td>${detail.score}/${detail.maxScore}</td>
                    <td>${escapeHtml(detail.studentAnswer)}</td>
                    <td>${escapeHtml(detail.standardAnswer)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderStudentAnalysis(record) {
  const classAvg = Math.max(60, Math.round(record.totalScore * 0.92));
  const trend = [
    Math.max(45, record.totalScore - 10),
    Math.max(50, record.totalScore - 6),
    Math.max(55, record.totalScore - 2),
    record.totalScore,
  ];
  const max = Math.max(...trend, classAvg, record.totalScore, 1);

  return `
    <div class="grades-chart-list">
      <div class="grades-chart-row">
        <div class="grades-chart-label">个人总分：${record.totalScore}</div>
        <div class="grades-chart-bar"><span style="width:${Math.round((record.totalScore / max) * 100)}%"></span></div>
      </div>
      <div class="grades-chart-row">
        <div class="grades-chart-label">班级均分：${classAvg}</div>
        <div class="grades-chart-bar"><span style="width:${Math.round((classAvg / max) * 100)}%"></span></div>
      </div>
      ${trend
        .map(
          (score, index) => `
            <div class="grades-chart-row">
              <div class="grades-chart-label">历次考试 ${index + 1}：${score}</div>
              <div class="grades-chart-bar"><span style="width:${Math.round((score / max) * 100)}%"></span></div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderStudentAppealList(appeals, exams) {
  if (!appeals.length) {
    return `<div class="muted" style="margin-top:10px">暂无复核申请记录。</div>`;
  }

  return `
    <div class="log-list" style="margin-top:10px">
      ${appeals
        .map((appeal) => {
          const examTitle = exams.find((item) => item.id === appeal.examId)?.title || appeal.examId;
          const statusText = appeal.status === "pending" ? "待处理" : appeal.status === "resolved" ? "已处理" : "已驳回";
          return `
            <article class="log-item">
              <div class="log-item__title">${escapeHtml(examTitle)} · ${statusText}</div>
              <div class="log-item__meta">${escapeHtml(appeal.reason)} · 提交于 ${formatDateTime(appeal.createdAt)}</div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}
