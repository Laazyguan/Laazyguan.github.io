/* Roles Launchpad — shared utils + board page */
(function () {
  const LINKEDIN = "https://www.linkedin.com/in/xuezheng-guan-97a167426/";
  const JOBS_URL = "../jobs/index.json";

  const TONES = ["tone-0", "tone-1", "tone-2", "tone-3", "tone-4", "tone-5", "tone-6", "tone-7"];

  const i18n = {
    zh: {
      page_title: "在招岗位",
      contact_cta: "联系猎头",
      trending: "热门",
      all: "全部",
      list: "列表",
      grid: "卡片",
      empty: "暂无匹配岗位。",
      load_error: "岗位加载失败，请稍后刷新。",
      roles_count: (n) => `${n} 个岗位`,
      loc_us: "美国",
      loc_cn: "中国",
      loc_all: "全部地点",
      type_label: "类型",
      salary_na: "面议",
      browse_home: "首页",
      theme_light: "浅色",
      theme_dark: "深色",
    },
    en: {
      page_title: "Open Roles",
      contact_cta: "Contact recruiter",
      trending: "Trending",
      all: "All",
      list: "List",
      grid: "Grid",
      empty: "No matching roles.",
      load_error: "Couldn’t load roles. Refresh and try again.",
      roles_count: (n) => `${n} role${n === 1 ? "" : "s"}`,
      loc_us: "U.S.",
      loc_cn: "China",
      loc_all: "All locations",
      type_label: "Type",
      salary_na: "DOE",
      browse_home: "Home",
      theme_light: "Light",
      theme_dark: "Dark",
    },
  };

  function getLang() {
    return localStorage.getItem("xg-lang") === "en" ? "en" : "zh";
  }
  function setLang(lang) {
    localStorage.setItem("xg-lang", lang);
  }
  function getTheme() {
    return localStorage.getItem("xg-theme") === "dark" ? "dark" : "light";
  }
  function setTheme(theme) {
    localStorage.setItem("xg-theme", theme);
    document.documentElement.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
  }

  function t(key) {
    const pack = i18n[getLang()];
    return pack[key];
  }

  function pick(job, zhKey, enKey) {
    const lang = getLang();
    if (lang === "zh") return job[zhKey] || job[enKey] || "";
    return job[enKey] || job[zhKey] || "";
  }

  function initials(company) {
    const parts = String(company || "?").trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function ticker(company) {
    return String(company || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 6)
      .toUpperCase();
  }

  function toneFor(id) {
    let h = 0;
    const s = String(id || "");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return TONES[h % TONES.length];
  }

  function locBucket(job) {
    const loc = `${job.location || ""} ${job.locationZh || ""}`.toLowerCase();
    if (/shanghai|上海|china|中国|xuhui|徐汇/.test(loc)) return "cn";
    if (/united states|u\.s\.|fremont|california|oregon|america|美国|加州/.test(loc)) return "us";
    return "other";
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function detailHref(id) {
    return `detail.html?id=${encodeURIComponent(id)}`;
  }

  function showToast(msg) {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  async function loadJobs() {
    const res = await fetch(JOBS_URL + "?ts=" + Date.now());
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    return { updatedAt: data.updatedAt, jobs: data.jobs || [] };
  }

  /* —— Board page —— */
  let state = {
    jobs: [],
    company: "all",
    loc: "all",
    view: localStorage.getItem("xg-roles-view") || "list",
  };

  function applyChrome() {
    const lang = getLang();
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    setTheme(getTheme());

    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.textContent = t("page_title");

    const contact = document.getElementById("contact-cta");
    if (contact) {
      contact.textContent = t("contact_cta");
      contact.href = LINKEDIN;
    }

    const trendingHead = document.getElementById("trending-label");
    if (trendingHead) trendingHead.textContent = t("trending");

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === lang);
    });
    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-theme-btn") === getTheme());
    });
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === state.view);
      if (btn.getAttribute("data-view") === "list") btn.textContent = t("list");
      if (btn.getAttribute("data-view") === "grid") btn.textContent = t("grid");
    });
  }

  function buildCompanyChips(jobs) {
    const wrap = document.getElementById("company-chips");
    if (!wrap) return;
    const companies = [...new Set(jobs.map((j) => j.company).filter(Boolean))];
    wrap.innerHTML =
      `<button type="button" class="chip${state.company === "all" ? " active" : ""}" data-company="all">${escapeHtml(t("all"))}</button>` +
      companies
        .map(
          (c) =>
            `<button type="button" class="chip${state.company === c ? " active" : ""}" data-company="${escapeHtml(c)}">${escapeHtml(c)}</button>`
        )
        .join("");
    wrap.querySelectorAll("[data-company]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.company = btn.getAttribute("data-company");
        renderBoard();
      });
    });
  }

  function buildLocChips() {
    const wrap = document.getElementById("loc-chips");
    if (!wrap) return;
    const items = [
      ["all", t("loc_all")],
      ["us", t("loc_us")],
      ["cn", t("loc_cn")],
    ];
    wrap.innerHTML = items
      .map(
        ([k, label]) =>
          `<button type="button" class="chip${state.loc === k ? " active" : ""}" data-loc="${k}">${escapeHtml(label)}</button>`
      )
      .join("");
    wrap.querySelectorAll("[data-loc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.loc = btn.getAttribute("data-loc");
        renderBoard();
      });
    });
  }

  function filteredJobs() {
    return state.jobs.filter((j) => {
      if (state.company !== "all" && j.company !== state.company) return false;
      if (state.loc !== "all" && locBucket(j) !== state.loc) return false;
      return true;
    });
  }

  function renderTrending() {
    const track = document.getElementById("trending-track");
    if (!track) return;
    let list = state.jobs.filter((j) => j.trending);
    if (list.length < 4) {
      const rest = state.jobs.filter((j) => !j.trending);
      list = list.concat(rest).slice(0, Math.max(4, list.length));
    }
    track.innerHTML = list
      .map((j, i) => {
        const title = pick(j, "titleZh", "titleEn");
        const loc = pick(j, "locationZh", "location") || j.location || "";
        const figure = j.salary || loc || t("salary_na");
        const tone = toneFor(j.id);
        return `<a class="trend-card" href="${detailHref(j.id)}">
          <div class="trend-art ${tone}">${escapeHtml(initials(j.company))}</div>
          <div class="trend-meta">
            <div class="trend-rank">#${i + 1}</div>
            <div class="trend-title">${escapeHtml(title)}</div>
            <div class="trend-sub">${escapeHtml(j.company || "")} · ${escapeHtml(loc)}</div>
            <div class="trend-figure">${escapeHtml(figure)}</div>
          </div>
        </a>`;
      })
      .join("");
  }

  function renderList(jobs) {
    const el = document.getElementById("jobs-container");
    if (!el) return;
    if (!jobs.length) {
      el.className = "";
      el.innerHTML = `<div class="empty">${escapeHtml(t("empty"))}</div>`;
      return;
    }
    if (state.view === "grid") {
      el.className = "jobs-grid";
      el.innerHTML = jobs
        .map((j) => {
          const title = pick(j, "titleZh", "titleEn");
          const loc = pick(j, "locationZh", "location") || j.location || "";
          const type = pick(j, "typeZh", "typeEn");
          const figure = j.salary || loc || t("salary_na");
          return `<a class="job-card" href="${detailHref(j.id)}">
            <div class="avatar ${toneFor(j.id)}">${escapeHtml(initials(j.company))}</div>
            <div class="job-card-title">${escapeHtml(title)}</div>
            <div class="job-card-meta">${escapeHtml(j.company || "")} · ${escapeHtml(type)}</div>
            <div class="job-card-meta">${escapeHtml(loc)}</div>
            <div class="job-card-figure">${escapeHtml(figure)}</div>
          </a>`;
        })
        .join("");
      return;
    }
    el.className = "jobs-list";
    el.innerHTML = jobs
      .map((j) => {
        const title = pick(j, "titleZh", "titleEn");
        const loc = pick(j, "locationZh", "location") || j.location || "";
        const type = pick(j, "typeZh", "typeEn");
        const figure = j.salary || t("salary_na");
        return `<a class="job-row" href="${detailHref(j.id)}">
          <div class="job-row-main">
            <div class="avatar ${toneFor(j.id)}">${escapeHtml(initials(j.company))}</div>
            <div>
              <div class="job-name">${escapeHtml(title)}<span class="job-ticker">${escapeHtml(ticker(j.company))}</span></div>
              <div class="job-company-line">${escapeHtml(j.company || "")}</div>
            </div>
          </div>
          <div class="job-cell">${escapeHtml(loc)}</div>
          <div class="job-cell">${escapeHtml(type)}</div>
          <div class="job-salary">${escapeHtml(figure)}</div>
        </a>`;
      })
      .join("");
  }

  function renderBoard() {
    applyChrome();
    buildCompanyChips(state.jobs);
    buildLocChips();
    renderTrending();
    const jobs = filteredJobs();
    const count = document.getElementById("roles-count");
    if (count) {
      const fn = t("roles_count");
      count.textContent = typeof fn === "function" ? fn(jobs.length) : "";
    }
    renderList(jobs);
  }

  function wireCarousel() {
    const track = document.getElementById("trending-track");
    const prev = document.getElementById("carousel-prev");
    const next = document.getElementById("carousel-next");
    if (!track) return;
    const step = () => Math.min(280, track.clientWidth * 0.7);
    if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    if (next) next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));

    let auto = setInterval(() => {
      if (document.hidden) return;
      const max = track.scrollWidth - track.clientWidth - 4;
      if (track.scrollLeft >= max) track.scrollTo({ left: 0, behavior: "smooth" });
      else track.scrollBy({ left: step(), behavior: "smooth" });
    }, 4500);
    track.addEventListener("pointerdown", () => clearInterval(auto), { once: true });
  }

  function wireBoardControls() {
    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setLang(btn.getAttribute("data-lang-btn"));
        renderBoard();
      });
    });
    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTheme(btn.getAttribute("data-theme-btn"));
        applyChrome();
      });
    });
    document.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.view = btn.getAttribute("data-view");
        localStorage.setItem("xg-roles-view", state.view);
        renderBoard();
      });
    });
    const themeRail = document.getElementById("rail-theme");
    if (themeRail) {
      themeRail.addEventListener("click", () => {
        setTheme(getTheme() === "dark" ? "light" : "dark");
        applyChrome();
      });
    }
  }

  async function initBoard() {
    applyChrome();
    wireBoardControls();
    wireCarousel();
    const container = document.getElementById("jobs-container");
    try {
      const data = await loadJobs();
      state.jobs = data.jobs;
      renderBoard();
    } catch (e) {
      if (container) container.innerHTML = `<div class="empty">${escapeHtml(t("load_error"))}</div>`;
    }
  }

  // expose for detail.js
  window.RolesApp = {
    LINKEDIN,
    getLang,
    setLang,
    getTheme,
    setTheme,
    pick,
    initials,
    ticker,
    toneFor,
    escapeHtml,
    detailHref,
    showToast,
    loadJobs,
    i18n,
    t,
    applyThemeOnly() {
      setTheme(getTheme());
    },
  };

  if (document.body && document.body.dataset.page === "board") {
    initBoard();
  }
})();
