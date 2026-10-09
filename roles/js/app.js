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
      col_role: "岗位",
      col_location: "地点",
      col_type: "类型",
      col_comp: "薪酬",
      search_ph: "搜索岗位、公司、技能…",
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
      col_role: "Role",
      col_location: "Location",
      col_type: "Type",
      col_comp: "Comp",
      search_ph: "Search roles, companies, skills…",
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


  function logoUrl(job) {
    const logo = job && job.logo;
    if (!logo) return "";
    if (/^https?:\/\//i.test(logo)) return logo;
    return "../" + String(logo).replace(/^\.\//, "");
  }

  function markHtml(job, className) {
    const url = logoUrl(job);
    const cls = className + (url ? " has-logo" : " " + toneFor(job.id));
    if (url) {
      return `<div class="${cls}"><img class="logo-img" src="${escapeHtml(url)}" alt="${escapeHtml(job.company || "")}" loading="lazy" /></div>`;
    }
    return `<div class="${cls}">${escapeHtml(initials(job.company))}</div>`;
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
    const q = (state.query || "").trim().toLowerCase();
    return state.jobs.filter((j) => {
      if (state.company !== "all" && j.company !== state.company) return false;
      if (state.loc !== "all" && locBucket(j) !== state.loc) return false;
      if (!q) return true;
      const hay = [
        j.titleZh, j.titleEn, j.company, j.location, j.locationZh,
        j.typeZh, j.typeEn, j.descZh, j.descEn, j.salary,
        ...(j.tags || []),
        ...(j.requirementsZh || []),
        ...(j.requirementsEn || []),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  function trendCardHtml(j, i) {
    const title = pick(j, "titleZh", "titleEn");
    const loc = pick(j, "locationZh", "location") || j.location || "";
    const figure = j.salary || loc || t("salary_na");
    return `<a class="trend-card" href="${detailHref(j.id)}">
          ${markHtml(j, "trend-art")}
          <div class="trend-meta">
            <div class="trend-rank">#${i + 1}</div>
            <div class="trend-title">${escapeHtml(title)}</div>
            <div class="trend-sub">${escapeHtml(j.company || "")} · ${escapeHtml(loc)}</div>
            <div class="trend-figure">${escapeHtml(figure)}</div>
          </div>
        </a>`;
  }

  function renderTrending() {
    const track = document.getElementById("trending-track");
    if (!track) return;
    let list = state.jobs.filter((j) => j.trending);
    if (list.length < 4) {
      const rest = state.jobs.filter((j) => !j.trending);
      list = list.concat(rest).slice(0, Math.max(6, list.length));
    }
    // Duplicate for seamless auto-marquee (second half is aria-hidden clone)
    const first = list.map((j, i) => trendCardHtml(j, i)).join("");
    const clone = list
      .map((j, i) => trendCardHtml(j, i).replace("<a ", '<a tabindex="-1" aria-hidden="true" '))
      .join("");
    track.innerHTML = first + clone;
    track.classList.add("is-marquee");
    // ~3.5s per card for half-track loop
    const seconds = Math.max(18, list.length * 3.5);
    track.style.setProperty("--marquee-duration", seconds + "s");
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
            ${markHtml(j, "avatar")}
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
    const rows = jobs
      .map((j) => {
        const title = pick(j, "titleZh", "titleEn");
        const loc = pick(j, "locationZh", "location") || j.location || "";
        const type = pick(j, "typeZh", "typeEn");
        const figure = j.salary || t("salary_na");
        const href = detailHref(j.id);
        return `<tr data-href="${href}">
          <td>${markHtml(j, "avatar")}</td>
          <td>
            <a class="row-link job-identity" href="${href}">
              <div class="job-name">${escapeHtml(title)}<span class="job-ticker">${escapeHtml(ticker(j.company))}</span></div>
              <div class="job-company-line">${escapeHtml(j.company || "")}</div>
            </a>
          </td>
          <td title="${escapeHtml(loc)}">${escapeHtml(loc)}</td>
          <td title="${escapeHtml(type)}">${escapeHtml(type)}</td>
          <td title="${escapeHtml(figure)}">${escapeHtml(figure)}</td>
        </tr>`;
      })
      .join("");
    el.innerHTML = `<table class="jobs-table">
      <colgroup>
        <col class="c-avatar" />
        <col class="c-role" />
        <col class="c-loc" />
        <col class="c-type" />
        <col class="c-comp" />
      </colgroup>
      <thead>
        <tr>
          <th aria-hidden="true"></th>
          <th>${escapeHtml(t("col_role"))}</th>
          <th>${escapeHtml(t("col_location"))}</th>
          <th>${escapeHtml(t("col_type"))}</th>
          <th>${escapeHtml(t("col_comp"))}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
    el.querySelectorAll("tbody tr[data-href]").forEach((tr) => {
      tr.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        window.location.href = tr.getAttribute("data-href");
      });
    });
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
    const wrap = track && track.parentElement;
    const prev = document.getElementById("carousel-prev");
    const next = document.getElementById("carousel-next");
    if (!track) return;

    // Manual nudge: briefly pause CSS marquee and shift by one card width via scrollLeft fallback
    const nudge = (dir) => {
      track.classList.add("is-paused");
      const card = track.querySelector(".trend-card");
      const step = (card ? card.getBoundingClientRect().width : 260) + 16;
      const current = getComputedStyle(track).transform;
      // pause animation and use temporary scroll container behavior
      track.style.animation = "none";
      track.style.transform = "none";
      track.style.overflowX = "auto";
      track.scrollBy({ left: dir * step, behavior: "smooth" });
      clearTimeout(track._resumeTimer);
      track._resumeTimer = setTimeout(() => {
        track.style.overflowX = "";
        track.style.animation = "";
        track.style.transform = "";
        track.classList.remove("is-paused");
        // restart seamless loop from duplicated content
        renderTrending();
      }, 2800);
    };
    if (prev) prev.addEventListener("click", () => nudge(-1));
    if (next) next.addEventListener("click", () => nudge(1));

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) track.classList.add("is-paused");
      else track.classList.remove("is-paused");
    });
  }

  function wireBoardControls() {

    const search = document.getElementById("roles-search");
    if (search) {
      search.value = state.query || "";
      search.addEventListener("input", () => {
        state.query = search.value;
        renderBoard();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== search && !(document.activeElement && ["INPUT","TEXTAREA"].includes(document.activeElement.tagName))) {
        e.preventDefault();
        if (search) search.focus();
      }
    });
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
    logoUrl,
    markHtml,
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
