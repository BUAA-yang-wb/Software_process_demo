function renderQuestionBankPage(ctx) {
    const canCreate = hasPermission(ctx, "question:create");
    const filteredQuestions = filterQuestions(ctx.visibleQuestions, appState.questionFilters);

    return {
        kicker: ctx.role === "Admin" ? "管理员视图" : "教师视图",
        title: "题库管理",
        description: "支持题型维护、单题录入、批量导入、检索筛选与审核流转。",
        actions: `
      ${canCreate ? '<a class="btn btn--primary" href="#/question-bank/new">创建试题</a>' : ""}
      ${canCreate ? '<button class="btn btn--secondary" type="button" data-action="clone-sample-question">克隆示例题</button>' : ""}
    `,
        content: `
      <section class="card">
        <form id="question-filters-form" class="filter-bar">
          <div class="filter-control">
            <label class="field-label" for="question-filter-query">关键词搜索</label>
            <input id="question-filter-query" name="query" placeholder="题干 / 知识点 / 标签" value="${escapeHtml(appState.questionFilters.query)}" />
          </div>
          <div class="filter-control">
            <label class="field-label" for="question-filter-type">题型</label>
            <select id="question-filter-type" name="type">
              ${renderSelectOptions(getQuestionTypeFilterOptions(), appState.questionFilters.type)}
            </select>
          </div>
          <div class="filter-control">
            <label class="field-label" for="question-filter-difficulty">难度</label>
            <select id="question-filter-difficulty" name="difficulty">
              ${renderSelectOptions(getDifficultyFilterOptions(), appState.questionFilters.difficulty)}
            </select>
          </div>
          <div class="filter-control">
            <label class="field-label" for="question-filter-status">状态</label>
            <select id="question-filter-status" name="status">
              ${renderSelectOptions(getQuestionStatusFilterOptions(), appState.questionFilters.status)}
            </select>
          </div>
          <div class="form-actions">
            <button class="btn btn--primary" type="submit">应用筛选</button>
            <button class="btn btn--secondary" type="button" data-action="reset-question-filters">重置</button>
          </div>
        </form>
      </section>
      ${canCreate ? renderQuestionImportCard() : ""}
      <section class="table-card">
        <div class="table-toolbar">
          <div class="badge-row">
            <span class="badge" data-tone="primary">结果 ${filteredQuestions.length} 条</span>
            <span class="badge" data-tone="success">范围：${ctx.role === "Admin" ? "全平台题库" : "我的题目 + 可见共享"}</span>
          </div>
        </div>
        ${filteredQuestions.length ? renderQuestionTable(filteredQuestions, ctx) : renderEmptyState("没有找到符合条件的试题", "请调整筛选条件，或创建新试题。")}
      </section>
    `,
    };
}

function renderQuestionImportCard() {
    return `
    <section class="card" style="margin-top: 14px">
      <h3>批量导入（演示）</h3>
      <p>支持 Excel / Word / TXT 导入，这里以演示方式模拟导入结果。</p>
      <form id="question-import-form" class="form-grid" style="margin-top: 10px">
        <div class="form-row--double">
          <div class="form-row">
            <label for="import-format">文件格式</label>
            <select id="import-format" name="format">
              ${renderSelectOptions([
        { value: "Excel", label: "Excel" },
        { value: "Word", label: "Word" },
        { value: "TXT", label: "TXT" },
    ], "Excel")}
            </select>
          </div>
          <div class="form-row">
            <label for="import-count">模拟导入条数</label>
            <input id="import-count" name="count" type="number" min="1" max="20" value="3" />
          </div>
        </div>
        <div class="form-row">
          <label for="import-file-name">文件名</label>
          <input id="import-file-name" name="fileName" placeholder="例如：软件工程期中题库.xlsx" />
          <div class="hint-text">演示环境不上传真实文件，提交后会生成草稿题并显示导入结果。</div>
        </div>
        <div class="form-actions">
          <button class="btn btn--primary" type="submit">开始导入</button>
        </div>
      </form>
    </section>
  `;
}

function renderQuestionTable(questions, ctx) {
    return `
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>题目</th>
            <th>题型</th>
            <th>难度 / 分值</th>
            <th>知识点</th>
            <th>状态</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${questions
            .map((question) => {
                const canEdit = canManageQuestionByScope(ctx.role, ctx.currentUser, question) && hasPermission(ctx, "question:update");
                const canSubmit = canEdit && hasPermission(ctx, "question:submit") && (question.status === "draft" || question.status === "rejected");
                const canReview = hasPermission(ctx, "question:review") && question.status === "pending";

                return `
                <tr>
                  <td>
                    <div class="table-user__meta">
                      <div class="table-user__name">${escapeHtml(question.stem.slice(0, 44))}${question.stem.length > 44 ? "..." : ""}</div>
                      <div class="table-user__sub">${escapeHtml(question.subject || "未设置科目")} · ${escapeHtml(question.chapter || "未设置章节")}</div>
                    </div>
                  </td>
                  <td>${escapeHtml(getQuestionTypeLabel(question.type))}</td>
                  <td>Lv.${question.difficulty} / ${question.score}分</td>
                  <td>${escapeHtml(question.knowledgePoint || "未设置")}</td>
                  <td>${renderQuestionStatusBadge(question.status)}</td>
                  <td>${formatDateTime(question.updatedAt)}</td>
                  <td>
                    <div class="table-actions">
                      <a class="btn btn--secondary" href="#/question-bank/${question.id}">详情</a>
                      ${canEdit ? `<a class="btn btn--soft" href="#/question-bank/${question.id}/edit">编辑</a>` : ""}
                      ${canSubmit ? `<button class="btn btn--warning-soft" type="button" data-action="submit-question-review" data-question-id="${question.id}">提交审核</button>` : ""}
                      ${canReview ? `<a class="btn btn--success-soft" href="#/question-bank/${question.id}">去审核</a>` : ""}
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

function renderQuestionFormPage(ctx, question) {
    const editing = Boolean(question);
    const canCreate = hasPermission(ctx, "question:create");
    const canEdit = editing && hasPermission(ctx, "question:update") && canManageQuestionByScope(ctx.role, ctx.currentUser, question);

    if ((!editing && !canCreate) || (editing && !canEdit)) {
        return renderForbiddenPage(ctx, "当前角色没有维护该试题的权限。", "请返回题库列表查看可访问内容。", "#/question-bank");
    }

    const resolved =
        question ||
        {
            type: "single",
            stem: "",
            optionsText: "A.\nB.\nC.\nD.",
            answer: "",
            analysis: "",
            score: 10,
            difficulty: 3,
            knowledgePoint: "",
            subject: "",
            chapter: "",
            tagsText: "",
            estimatedMinutes: 3,
            sharedScope: "personal",
            mediaName: "",
            language: "",
        };

    return {
        kicker: editing ? "试题编辑" : "单题录入",
        title: editing ? "编辑试题" : "创建试题",
        description: "支持基础题型、进阶题型与多媒体题型，保存后默认为草稿。",
        actions: `<a class="btn btn--secondary" href="${editing ? `#/question-bank/${question.id}` : "#/question-bank"}">取消</a>`,
        content: `
      <section class="card">
        <form id="question-form" data-question-id="${editing ? question.id : ""}" class="form-grid">
          <div class="form-row--double">
            <div class="form-row">
              <label for="question-type">题型</label>
              <select id="question-type" name="type">
                ${renderSelectOptions(getQuestionTypeOptions(), resolved.type)}
              </select>
            </div>
            <div class="form-row">
              <label for="question-shared-scope">共享范围</label>
              <select id="question-shared-scope" name="sharedScope">
                ${renderSelectOptions(getQuestionShareScopeOptions(), resolved.sharedScope)}
              </select>
            </div>
          </div>
          <div class="form-row">
            <label for="question-stem">题干</label>
            <textarea id="question-stem" name="stem" placeholder="请输入题干内容，支持文字、公式描述。">${escapeHtml(resolved.stem)}</textarea>
          </div>
          <div class="form-row">
            <label for="question-options">选项（客观题）</label>
            <textarea id="question-options" name="optionsText" placeholder="每行一个选项，例如：A. 选项内容">${escapeHtml(resolved.optionsText || "")}</textarea>
            <div class="hint-text">单选/多选/判断题建议填写选项，其他题型可留空。</div>
          </div>
          <div class="form-row--double">
            <div class="form-row">
              <label for="question-answer">参考答案</label>
              <textarea id="question-answer" name="answer" placeholder="请输入参考答案。">${escapeHtml(resolved.answer)}</textarea>
            </div>
            <div class="form-row">
              <label for="question-analysis">解析说明</label>
              <textarea id="question-analysis" name="analysis" placeholder="请输入解析说明。">${escapeHtml(resolved.analysis)}</textarea>
            </div>
          </div>
          <div class="form-row--double">
            <div class="form-row">
              <label for="question-score">分值</label>
              <input id="question-score" name="score" type="number" min="0" step="1" value="${resolved.score}" />
            </div>
            <div class="form-row">
              <label for="question-difficulty">难度级别（1-5）</label>
              <input id="question-difficulty" name="difficulty" type="number" min="1" max="5" step="1" value="${resolved.difficulty}" />
            </div>
          </div>
          <div class="form-row--double">
            <div class="form-row">
              <label for="question-subject">科目</label>
              <input id="question-subject" name="subject" value="${escapeHtml(resolved.subject || "")}" placeholder="例如：软件工程" />
            </div>
            <div class="form-row">
              <label for="question-chapter">章节</label>
              <input id="question-chapter" name="chapter" value="${escapeHtml(resolved.chapter || "")}" placeholder="例如：需求分析" />
            </div>
          </div>
          <div class="form-row--double">
            <div class="form-row">
              <label for="question-knowledge">知识点</label>
              <input id="question-knowledge" name="knowledgePoint" value="${escapeHtml(resolved.knowledgePoint || "")}" placeholder="例如：用例建模" />
            </div>
            <div class="form-row">
              <label for="question-tags">标签（逗号分隔）</label>
              <input id="question-tags" name="tagsText" value="${escapeHtml(resolved.tagsText || "")}" placeholder="例如：必考,基础" />
            </div>
          </div>
          <div class="form-row--double">
            <div class="form-row">
              <label for="question-time">预计答题时间（分钟）</label>
              <input id="question-time" name="estimatedMinutes" type="number" min="1" max="180" value="${resolved.estimatedMinutes}" />
            </div>
            <div class="form-row">
              <label for="question-language">编程语言（编程题可选）</label>
              <input id="question-language" name="language" value="${escapeHtml(resolved.language || "")}" placeholder="例如：Java / Python" />
            </div>
          </div>
          <div class="form-row">
            <label for="question-media-name">媒体文件名（多媒体题型可选）</label>
            <input id="question-media-name" name="mediaName" value="${escapeHtml(resolved.mediaName || "")}" placeholder="例如：流程图.png / 听力材料.mp3" />
          </div>
          <div class="form-actions">
            <button class="btn btn--primary" type="submit">${editing ? "保存修改" : "保存草稿"}</button>
            <a class="btn btn--secondary" href="${editing ? `#/question-bank/${question.id}` : "#/question-bank"}">取消</a>
          </div>
        </form>
      </section>
    `,
    };
}

function renderQuestionDetailPage(ctx, question) {
    if (!question) {
        return renderNotFoundPage(ctx, "没有找到对应试题。", "当前请求的试题不存在或已被移除。");
    }

    if (!canViewQuestionByScope(ctx.role, ctx.currentUser, question)) {
        return renderForbiddenPage(ctx, "当前角色不能查看该试题。", "请返回题库列表。", "#/question-bank");
    }

    const canEdit = hasPermission(ctx, "question:update") && canManageQuestionByScope(ctx.role, ctx.currentUser, question);
    const canSubmit = hasPermission(ctx, "question:submit") && canManageQuestionByScope(ctx.role, ctx.currentUser, question) && (question.status === "draft" || question.status === "rejected");
    const canReview = hasPermission(ctx, "question:review") && question.status === "pending";

    return {
        kicker: "试题详情",
        title: `${getQuestionTypeLabel(question.type)} · ${escapeHtml(question.subject || "未设置科目")}`,
        description: "查看题目内容、属性、状态与审核信息。",
        actions: `
      ${canEdit ? `<a class="btn btn--soft" href="#/question-bank/${question.id}/edit">编辑试题</a>` : ""}
      ${canSubmit ? `<button class="btn btn--warning-soft" type="button" data-action="submit-question-review" data-question-id="${question.id}">提交审核</button>` : ""}
      <a class="btn btn--secondary" href="#/question-bank">返回列表</a>
    `,
        content: `
      <section class="detail-grid">
        <div class="card">
          <h3>题干与答案</h3>
          <div class="detail-list" style="margin-top: 10px">
            ${renderInfoItem("题型", escapeHtml(getQuestionTypeLabel(question.type)))}
            ${renderInfoItem("难度", `Lv.${question.difficulty}`)}
            ${renderInfoItem("分值", `${question.score} 分`)}
            ${renderInfoItem("知识点", escapeHtml(question.knowledgePoint || "未设置"))}
            ${renderInfoItem("状态", renderQuestionStatusBadge(question.status))}
            ${renderInfoItem("版本", `v${question.version || 1}`)}
            ${renderInfoItem("共享范围", escapeHtml(getQuestionShareScopeLabel(question.sharedScope)))}
            ${renderInfoItem("更新时间", formatDateTime(question.updatedAt))}
          </div>
          <div class="panel-note">${escapeHtml(question.stem)}</div>
          ${question.options?.length ? `<div class="panel-note">选项：${escapeHtml(question.options.join(" | "))}</div>` : ""}
          <div class="panel-note">参考答案：${escapeHtml(question.answer)}</div>
          ${question.analysis ? `<div class="panel-note">解析：${escapeHtml(question.analysis)}</div>` : ""}
        </div>
        <div class="card">
          <h3>审核与质量</h3>
          <p>状态流转：草稿 -> 待审核 -> 已通过/已驳回。</p>
          <div class="detail-list" style="margin-top: 10px">
            ${renderInfoItem("创建人", escapeHtml(getUserNameById(question.createdBy, ctx.users)))}
            ${renderInfoItem("创建时间", formatDateTime(question.createdAt))}
            ${renderInfoItem("最近审核人", escapeHtml(getUserNameById(question.reviewerId, ctx.users) || "未审核"))}
            ${renderInfoItem("审核时间", formatDateTime(question.reviewedAt))}
          </div>
          ${question.reviewComment ? `<div class="panel-note">审核意见：${escapeHtml(question.reviewComment)}</div>` : ""}
          ${canReview ? renderQuestionReviewForm(question.id) : ""}
        </div>
      </section>
    `,
    };
}

function renderQuestionReviewForm(questionId) {
    return `
    <form id="question-review-form" data-question-id="${questionId}" class="form-grid" style="margin-top: 12px">
      <div class="form-row">
        <label for="review-result">审核结果</label>
        <select id="review-result" name="result">
          ${renderSelectOptions([
        { value: "approved", label: "通过" },
        { value: "rejected", label: "驳回" },
    ], "approved")}
        </select>
      </div>
      <div class="form-row">
        <label for="review-comment">审核意见</label>
        <textarea id="review-comment" name="comment" placeholder="请输入审核意见（可选）。"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn--primary" type="submit">提交审核结果</button>
      </div>
    </form>
  `;
}

function renderQuestionStatusBadge(status) {
    return `<span class="badge" data-tone="${getQuestionStatusTone(status)}">${getQuestionStatusLabel(status)}</span>`;
}
