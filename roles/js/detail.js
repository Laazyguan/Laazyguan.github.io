/* Role detail page */
(function () {
  const A = window.RolesApp;
  if (!A) return;

  const LINKEDIN = A.LINKEDIN;

  const copy = {
    zh: {
      back: "返回岗位列表",
      about: "岗位说明",
      requirements: "硬性要求",
      nice: "加分项",
      company: "关于公司",
      tags: "标签",
      apply: "投递申请",
      apply_li: "在 LinkedIn 联系猎头",
      copy_link: "复制岗位链接",
      copied: "链接已复制",
      name: "姓名",
      email: "邮箱",
      message: "留言 / 简历链接",
      message_ph: "简单介绍背景，或附上简历 / LinkedIn 链接…",
      company_board: "查看公司招聘页",
      not_found: "未找到该岗位。",
      salary_na: "面议",
      open_mailto: "用邮件发送意向",
      figure_loc: "地点",
    },
    en: {
      back: "Back to roles",
      about: "About the role",
      requirements: "Requirements",
      nice: "Nice to have",
      company: "About the company",
      tags: "Tags",
      apply: "Apply",
      apply_li: "Apply on LinkedIn",
      copy_link: "Copy role link",
      copied: "Link copied",
      name: "Name",
      email: "Email",
      message: "Message / resume link",
      message_ph: "Brief intro, or paste resume / LinkedIn URL…",
      company_board: "View on company board",
      not_found: "Role not found.",
      salary_na: "DOE",
      open_mailto: "Email interest",
      figure_loc: "Location",
    },
  };

  function c(key) {
    return copy[A.getLang()][key];
  }

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function applyChrome() {
    const lang = A.getLang();
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    A.setTheme(A.getTheme());
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === lang);
    });
    const back = document.getElementById("back-link");
    if (back) back.textContent = "← " + c("back");
  }

  function listHtml(items) {
    if (!items || !items.length) return "";
    return `<ul>${items.map((x) => `<li>${A.escapeHtml(x)}</li>`).join("")}</ul>`;
  }

  function render(job) {
    applyChrome();
    const root = document.getElementById("detail-root");
    if (!job) {
      root.innerHTML = `<div class="panel"><p>${A.escapeHtml(c("not_found"))}</p><p style="margin-top:1rem"><a class="btn" href="./">← ${A.escapeHtml(c("back"))}</a></p></div>`;
      return;
    }

    const title = A.pick(job, "titleZh", "titleEn");
    const loc = A.pick(job, "locationZh", "location") || job.location || "";
    const type = A.pick(job, "typeZh", "typeEn");
    const desc = A.pick(job, "descZh", "descEn");
    const req = A.getLang() === "zh" ? job.requirementsZh || job.requirementsEn : job.requirementsEn || job.requirementsZh;
    const nice = A.getLang() === "zh" ? job.niceZh || job.niceEn : job.niceEn || job.niceZh;
    const blurb = A.pick(job, "companyBlurbZh", "companyBlurbEn");
    const hint = A.pick(job, "applyHintZh", "applyHintEn");
    const figureMain = job.salary || loc || c("salary_na");
    const figureSub = job.salary ? loc : c("figure_loc");
    const tags = (job.tags || [])
      .map((t) => `<span class="tag">${A.escapeHtml(t)}</span>`)
      .join("");

    document.title = `${title} · ${job.company} · Xuezheng Guan`;

    root.innerHTML = `
      <a class="back-link" id="back-link" href="./">← ${A.escapeHtml(c("back"))}</a>

      <div class="detail-header">
        <div class="detail-identity">
          <div class="avatar ${A.toneFor(job.id)}">${A.escapeHtml(A.initials(job.company))}</div>
          <div>
            <h1 class="detail-title">${A.escapeHtml(title)}</h1>
            <div class="detail-company">${A.escapeHtml(job.company || "")}${job.companyUrl ? ` · <a href="${A.escapeHtml(job.companyUrl)}" target="_blank" rel="noopener">${A.escapeHtml((job.companyUrl || "").replace(/^https?:\/\//, ""))}</a>` : ""}</div>
            <div class="detail-meta-line">
              <span>${A.escapeHtml(loc)}</span>
              <span>·</span>
              <span>${A.escapeHtml(type)}</span>
            </div>
            <div class="tags" style="margin-top:0.75rem">${tags}</div>
          </div>
        </div>
        <div class="detail-figure">
          <div class="detail-figure-main">${A.escapeHtml(figureMain)}</div>
          <div class="detail-figure-sub">${A.escapeHtml(figureSub)}</div>
        </div>
      </div>

      <div class="detail-layout">
        <div class="detail-col">
          <section class="panel">
            <h3>${A.escapeHtml(c("about"))}</h3>
            <p>${A.escapeHtml(desc)}</p>
          </section>
          ${
            req && req.length
              ? `<section class="panel"><h3>${A.escapeHtml(c("requirements"))}</h3>${listHtml(req)}</section>`
              : ""
          }
          ${
            nice && nice.length
              ? `<section class="panel"><h3>${A.escapeHtml(c("nice"))}</h3>${listHtml(nice)}</section>`
              : ""
          }
          ${
            blurb
              ? `<section class="panel"><h3>${A.escapeHtml(c("company"))}</h3><p>${A.escapeHtml(blurb)}</p></section>`
              : ""
          }
        </div>

        <aside class="apply-panel panel" id="apply-panel">
          <h3>${A.escapeHtml(c("apply"))}</h3>
          <p class="hint">${A.escapeHtml(hint || "")}</p>
          <div class="field">
            <label for="apply-name">${A.escapeHtml(c("name"))}</label>
            <input id="apply-name" type="text" autocomplete="name" />
          </div>
          <div class="field">
            <label for="apply-email">${A.escapeHtml(c("email"))}</label>
            <input id="apply-email" type="email" autocomplete="email" />
          </div>
          <div class="field">
            <label for="apply-msg">${A.escapeHtml(c("message"))}</label>
            <textarea id="apply-msg" rows="4" placeholder="${A.escapeHtml(c("message_ph"))}"></textarea>
          </div>
          <div class="apply-actions">
            <a class="btn btn-green btn-block" id="btn-linkedin" href="${LINKEDIN}" target="_blank" rel="noopener">${A.escapeHtml(c("apply_li"))}</a>
            <button type="button" class="btn btn-block" id="btn-copy">${A.escapeHtml(c("copy_link"))}</button>
          </div>
          ${
            job.externalUrl
              ? `<a class="secondary-link" href="${A.escapeHtml(job.externalUrl)}" target="_blank" rel="noopener">${A.escapeHtml(c("company_board"))}</a>`
              : ""
          }
        </aside>
      </div>
    `;

    document.getElementById("btn-copy").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        A.showToast(c("copied"));
      } catch {
        A.showToast(location.href);
      }
    });

    // Enrich LinkedIn click with drafted note in clipboard when fields filled
    document.getElementById("btn-linkedin").addEventListener("click", () => {
      const name = document.getElementById("apply-name").value.trim();
      const email = document.getElementById("apply-email").value.trim();
      const msg = document.getElementById("apply-msg").value.trim();
      if (!name && !email && !msg) return;
      const draft = [
        `Role: ${title} @ ${job.company}`,
        `Link: ${location.href}`,
        name ? `Name: ${name}` : "",
        email ? `Email: ${email}` : "",
        msg ? `Message:\n${msg}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      navigator.clipboard.writeText(draft).catch(() => {});
    });
  }

  async function init() {
    applyChrome();
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        A.setLang(btn.getAttribute("data-lang-btn"));
        boot();
      });
    });
    const themeRail = document.getElementById("rail-theme");
    if (themeRail) {
      themeRail.addEventListener("click", () => {
        A.setTheme(A.getTheme() === "dark" ? "light" : "dark");
        applyChrome();
      });
    }
    await boot();
  }

  async function boot() {
    const id = qs("id");
    const root = document.getElementById("detail-root");
    try {
      const data = await A.loadJobs();
      const job = (data.jobs || []).find((j) => j.id === id);
      render(job || null);
    } catch {
      root.innerHTML = `<div class="panel"><p>${A.escapeHtml(c("not_found"))}</p></div>`;
    }
  }

  init();
})();
