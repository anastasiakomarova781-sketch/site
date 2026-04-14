// Мобильное меню (без анимаций пролистывания)
document.addEventListener("DOMContentLoaded", () => {
  // Ring particles (Houdini): только после успешной загрузки worklet — иначе @supports/paint даёт пустой фон
  if ("paintWorklet" in CSS) {
    CSS.paintWorklet
      .addModule("https://unpkg.com/css-houdini-ringparticles/dist/ringparticles.js")
      .then(() => {
        /* На телефонах только CSS‑fallback: без ожидания сети и сразу видимая сетка */
        if (window.matchMedia("(max-width: 768px)").matches) return;
        document.documentElement.classList.add("houdini-ringparticles");
      })
      .catch(() => {});
  }

  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".main-nav");

  // Slow down hero background video (index)
  const heroVideo = document.querySelector(".hero-bg-video");
  if (heroVideo instanceof HTMLVideoElement) {
    const forwardRate = 0.5;
    const forwardSeconds = 3;
    const rewindRate = 1.0; // seconds of video per second of real time

    let rafId = 0;
    let lastTs = 0;

    const stopRaf = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      lastTs = 0;
    };

    const rewindToStart = () => {
      stopRaf();
      heroVideo.pause();

      const step = ts => {
        if (!lastTs) lastTs = ts;
        const dt = Math.min(0.06, (ts - lastTs) / 1000);
        lastTs = ts;

        const next = Math.max(0, heroVideo.currentTime - dt * rewindRate);
        heroVideo.currentTime = next;

        if (next <= 0.001) {
          stopRaf();
          playForwardWindow();
          return;
        }
        rafId = requestAnimationFrame(step);
      };

      rafId = requestAnimationFrame(step);
    };

    const onTimeUpdate = () => {
      // Stop right at forwardSeconds, then rewind back to start
      if (heroVideo.currentTime >= forwardSeconds - 0.02) {
        heroVideo.removeEventListener("timeupdate", onTimeUpdate);
        rewindToStart();
      }
    };

    const playForwardWindow = () => {
      stopRaf();
      heroVideo.playbackRate = forwardRate;
      if (heroVideo.currentTime > forwardSeconds) heroVideo.currentTime = 0;
      heroVideo.addEventListener("timeupdate", onTimeUpdate);
      heroVideo.play().catch(() => {});
    };

    const startLoop = () => {
      // Ensure metadata available for currentTime / duration
      heroVideo.currentTime = 0;
      playForwardWindow();
    };

    if (heroVideo.readyState >= 1) startLoop();
    else heroVideo.addEventListener("loadedmetadata", startLoop, { once: true });
  }

  // Hide header ticker on scroll (keep logo + burger)
  const updateHeaderTicker = () => {
    const shouldHide = window.scrollY > 40;
    document.body.classList.toggle("hide-header-ticker", shouldHide);
  };
  updateHeaderTicker();
  window.addEventListener("scroll", updateHeaderTicker, { passive: true });

  // Services slider (blog-slider layout)
  const servicesSliderEl = document.querySelector(".services-blog-slider");
  if (servicesSliderEl && typeof window.Swiper === "function") {
    const servicesReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    new window.Swiper(servicesSliderEl, {
      spaceBetween: 30,
      effect: "slide",
      loop: true,
      keyboard: true,
      mousewheel: false,
      autoHeight: true,
      navigation: {
        prevEl: ".services-blog-slider .swiper-button-prev",
        nextEl: ".services-blog-slider .swiper-button-next"
      },
      autoplay: servicesReduceMotion
        ? false
        : {
            delay: 5200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }
    });
  }

  // Footer sitemap (same on all pages)
  const scriptEl = document.querySelector('script[src$="script.js"]');
  const prefix = scriptEl
    ? (scriptEl.getAttribute("src") || "").replace(/script\.js(\?.*)?$/, "")
    : "";

  /** В шапке только «Консультация» + бургер: убираем прочие кнопки/ссылки и при необходимости добавляем консультацию. */
  const ensureHeaderConsultationCta = () => {
    const headerInner = document.querySelector("header.site-header .header-inner");
    if (!headerInner) return;

    const actions = headerInner.querySelector(".header-actions");
    if (actions) {
      actions.querySelectorAll("a.btn.btn-header").forEach(a => {
        const keep =
          a.classList.contains("btn-header--white") && a.getAttribute("data-popup") === "contacts";
        if (!keep) a.remove();
      });
      actions.querySelectorAll("button.btn.btn-header").forEach(b => b.remove());
    }

    if (headerInner.querySelector(".header-actions a.btn-header--white[data-popup='contacts']")) return;

    const consult = document.createElement("a");
    consult.href = "#";
    consult.className = "btn btn-header btn-header--white";
    consult.dataset.popup = "contacts";
    consult.textContent = "Консультация";

    const burger = headerInner.querySelector(".burger");

    if (actions) {
      actions.insertBefore(consult, actions.firstChild);
      return;
    }

    if (!burger) return;

    const wrap = document.createElement("div");
    wrap.className = "header-actions";
    burger.replaceWith(wrap);
    wrap.appendChild(consult);
    wrap.appendChild(burger);
  };

  ensureHeaderConsultationCta();

  const sitemapHtml = `
    <div class="footer-sitemap" aria-label="Структура сайта">
      <div class="footer-col">
        <div class="footer-col__title">Основное</div>
        <a href="${prefix}blog/main.html">Блог</a>
        <a href="${prefix}about.html">Компания</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Методы</div>
        <a href="${prefix}methods/methods-guide.html">Методы продвижения — обзор</a>
        <a href="${prefix}methods/geo.html">GEO оптимизация</a>
        <a href="${prefix}methods/aeo.html">AEO оптимизация</a>
        <a href="${prefix}methods/seo.html">SEO оптимизация</a>
        <a href="${prefix}methods/aio.html">AIO оптимизация</a>
        <a href="${prefix}methods/ai-smm.html">AI &amp; SMM</a>
        <a href="${prefix}methods/faq-methods.html">FAQ по методам</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Нейроплатформы</div>
        <a href="${prefix}neural-platforms/chatgpt.html">ChatGPT</a>
        <a href="${prefix}neural-platforms/perplexity.html">Perplexity</a>
        <a href="${prefix}neural-platforms/deepseek.html">DeepSeek</a>
        <a href="${prefix}neural-platforms/claude.html">Claude</a>
        <a href="${prefix}neural-platforms/google-gemini.html">Google Gemini</a>
        <a href="${prefix}neural-platforms/yandex-alice.html">Яндекс Алиса</a>
        <a href="${prefix}neural-platforms/platform-comparison.html">Сравнение платформ</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Инструменты</div>
        <a href="${prefix}tools/analytics.html">Аналитика и аудит</a>
        <a href="${prefix}tools/content-factory.html">Контент‑завод</a>
        <a href="${prefix}tools/it-audit.html">Аудит текущего IT‑решения</a>
        <a href="${prefix}tools/promotion-strategy.html">Стратегия продвижения</a>
        <a href="${prefix}tools/full-promotion.html">Полное продвижение</a>
        <a href="${prefix}tools/support-service.html">Поддерживающий сервис</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Стратегия</div>
        <a href="${prefix}strategy/overview.html">Общий обзор</a>
        <a href="${prefix}strategy/unified-system.html">Единая система</a>
        <a href="${prefix}strategy/ai-contextual.html">AI и контекст</a>
        <a href="${prefix}strategy/ai-visibility-analytics.html">Аналитика AI‑видимости</a>
        <a href="${prefix}strategy/brand-strategy.html">Стратегия площадок</a>
        <a href="${prefix}strategy/implementation-changes.html">Реализация изменений</a>
        <a href="${prefix}strategy/optimization-tracking.html">Оптимизация и трекинг</a>
      </div>

      <div class="footer-col">
        <div class="footer-col__title">Отрасли</div>
        <a href="${prefix}case-studies/all-industries-geo-aeo.html">Все отрасли и нейропоиск</a>
        <a href="${prefix}case-studies/marketplaces-neuro-strategy.html">Маркетплейсы</a>
        <a href="${prefix}case-studies/clinics-neuro-strategy.html">Клиники</a>
        <a href="${prefix}case-studies/service-centers-neuro-strategy.html">Сервисные центры</a>
        <a href="${prefix}case-studies/showrooms-neuro-strategy.html">Шоурумы</a>
        <a href="${prefix}case-studies/beauty-neuro-strategy.html">Салоны красоты</a>
        <a href="${prefix}case-studies/delivery-neuro-strategy.html">Доставка</a>
        <a href="${prefix}case-studies/corporations.html">Корпорации</a>
        <a href="${prefix}case-studies/ecommerce.html">E‑commerce</a>
        <a href="${prefix}case-studies/saas.html">SaaS &amp; digital</a>
        <a href="${prefix}case-studies/local-business.html">Локальный бизнес</a>
        <a href="${prefix}case-studies/ai-discovery.html">AI‑discovery лидеры</a>
      </div>
    </div>
  `;

  const footer = document.querySelector("footer.site-footer");
  if (footer) {
    footer.innerHTML = `
      <div class="container footer-inner">
        <div class="footer-main footer-main--sitemap">
          ${sitemapHtml}
        </div>

        <div class="footer-bottom">
          <p>Компания AEO © 2026</p>
          <div class="footer-meta">
            <button class="footer-meta__link" type="button" data-popup="privacy">Политика конфиденциальности</button>
            <button class="footer-meta__link" type="button" data-popup="consent">Согласие на обработку данных</button>
          </div>
        </div>
      </div>
    `;

    // Footer accordion on mobile (avoid super long sitemap)
    const enhanceFooterAccordion = () => {
      // Only enable accordion when footer collapses into one long column
      if (!window.matchMedia || !window.matchMedia("(max-width: 420px)").matches) return;
      const sitemap = footer.querySelector(".footer-sitemap");
      if (!sitemap) return;
      if (sitemap.dataset.accordionReady === "true") return;

      const cols = Array.from(sitemap.querySelectorAll(":scope > .footer-col"));
      if (!cols.length) return;

      cols.forEach((col, idx) => {
        const titleEl = col.querySelector(".footer-col__title");
        if (!titleEl) return;
        const title = String(titleEl.textContent || "").trim();
        const links = Array.from(col.querySelectorAll(":scope > a, :scope > button, :scope > [data-popup]"));

        const details = document.createElement("details");
        details.className = "footer-acc";
        if (idx === 0) details.open = true; // "Основное" раскрыто по умолчанию

        const summary = document.createElement("summary");
        summary.className = "footer-acc__summary";
        summary.textContent = title || "Раздел";

        const panel = document.createElement("div");
        panel.className = "footer-acc__panel";

        // Move existing anchors into panel
        Array.from(col.children).forEach(child => {
          if (child === titleEl) return;
          panel.appendChild(child);
        });

        details.appendChild(summary);
        details.appendChild(panel);
        col.replaceWith(details);
      });

      sitemap.dataset.accordionReady = "true";
    };

    enhanceFooterAccordion();
  }

  // Top mega menu (overlay)
  const header = document.querySelector("header.site-header");
  const topMenu = document.createElement("div");
  topMenu.className = "top-menu";
  topMenu.hidden = true;
  topMenu.innerHTML = `
    <div class="top-menu__backdrop" data-topmenu-close></div>
    <div class="top-menu__panel" role="dialog" aria-modal="true" aria-label="Меню сайта">
      <div class="top-menu__header">
        <a class="top-menu__brand" href="${prefix}index.html#hero" aria-label="На главную">
          <img src="${prefix}Img/logo-aeo.png" alt="GEO logo" />
        </a>
        <button class="top-menu__close" type="button" data-topmenu-close aria-label="Закрыть меню">×</button>
      </div>
      <div class="top-menu__content">
        ${sitemapHtml}
      </div>
    </div>
  `;

  if (header && !document.querySelector(".top-menu")) {
    header.insertAdjacentElement("afterend", topMenu);
  }

  const enhanceTopMenuAccordion = () => {
    const root = document.querySelector(".top-menu");
    if (!root) return;
    if (root.dataset.accordionReady === "true") return;

    const sitemap = root.querySelector(".footer-sitemap");
    if (!sitemap) return;

    const cols = Array.from(sitemap.querySelectorAll(":scope > .footer-col"));
    if (!cols.length) return;

    cols.forEach((col, idx) => {
      const titleEl = col.querySelector(".footer-col__title");
      if (!titleEl) return;

      const title = String(titleEl.textContent || "").trim();

      const details = document.createElement("details");
      details.className = "menu-acc";
      if (idx === 0) details.open = true;

      const summary = document.createElement("summary");
      summary.className = "menu-acc__summary";
      summary.textContent = title || "Раздел";

      const panel = document.createElement("div");
      panel.className = "menu-acc__panel";
      Array.from(col.children).forEach(child => {
        if (child === titleEl) return;
        panel.appendChild(child);
      });

      details.appendChild(summary);
      details.appendChild(panel);

      col.replaceWith(details);
    });

    root.dataset.accordionReady = "true";
  };

  enhanceTopMenuAccordion();

  // Content upgrades for AI citation (TOC, ids, update date, short answer, JSON-LD FAQ)
  const sectionHeader = document.querySelector(".section-header");
  const pageH1 =
    (sectionHeader ? sectionHeader.querySelector("h1") : null) ||
    document.querySelector("main h1") ||
    document.querySelector("h1");
  const article = document.querySelector("article.content-article");

  const formatUpdateDate = () => {
    const d = new Date();
    const months = [
      "январь",
      "февраль",
      "март",
      "апрель",
      "май",
      "июнь",
      "июль",
      "август",
      "сентябрь",
      "октябрь",
      "ноябрь",
      "декабрь"
    ];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const slugify = str =>
    String(str || "")
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/[^a-z0-9а-я\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "section";

  const ensureUpdateDate = () => {
    if (!pageH1) return;
    const existing =
      (sectionHeader && sectionHeader.querySelector(".update-date")) ||
      pageH1.parentElement?.querySelector?.(".update-date");
    if (existing) return;
    const p = document.createElement("p");
    p.className = "update-date";
    p.textContent = `Обновлено: ${formatUpdateDate()}`;
    pageH1.insertAdjacentElement("afterend", p);
  };

  /** Модульная сетка статей: заголовок на всю ширину, контент + боковая колонка (теги + описание). */
  const initArticlePageLayout = () => {
    document.querySelectorAll("main .section > .container").forEach(container => {
      if (container.dataset.articleLayout === "1") return;
      const article = container.querySelector(":scope > article.content-article");
      const header = container.querySelector(":scope > .section-header");
      if (!article || !header || !header.querySelector("h1")) return;

      const rail = document.createElement("aside");
      rail.className = "article-page-layout__rail";
      rail.setAttribute("aria-label", "Теги и описание");

      const kwRaw = document.querySelector('meta[name="keywords"]')?.getAttribute("content") || "";
      const tagParts = kwRaw
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 10);
      if (tagParts.length) {
        const wrap = document.createElement("div");
        wrap.className = "article-page-layout__tags";
        tagParts.forEach(text => {
          const span = document.createElement("span");
          span.className = "article-tag";
          span.textContent = text;
          wrap.appendChild(span);
        });
        rail.appendChild(wrap);
      }

      const sub = header.querySelector(".section-subtitle");
      if (sub) {
        rail.appendChild(sub);
      } else {
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
        const t = metaDesc.trim();
        if (t) {
          const p = document.createElement("p");
          p.className = "article-page-layout__lede";
          p.textContent = t;
          rail.appendChild(p);
        }
      }

      if (!rail.firstChild) return;

      const intro = document.createElement("div");
      intro.className = "article-page-layout__intro section-header";
      while (header.firstChild) intro.appendChild(header.firstChild);
      header.replaceWith(intro);
      container.appendChild(rail);
      container.classList.add("article-page-layout");
      container.dataset.articleLayout = "1";
    });
  };

  /** Голубая плашка + рейл в одной правой колонке (без «пустых» строк сетки). */
  const injectArticleConsultBanner = () => {
    document.querySelectorAll(".container.article-page-layout").forEach(container => {
      const rail = container.querySelector(".article-page-layout__rail");
      if (!rail) return;

      const looseBanner = container.querySelector(":scope > .article-consult-banner");
      if (looseBanner && rail.parentElement === container) {
        const sb = document.createElement("div");
        sb.className = "article-page-layout__sidebar";
        container.insertBefore(sb, looseBanner);
        sb.appendChild(looseBanner);
        sb.appendChild(rail);
        return;
      }

      if (container.querySelector(".article-consult-banner")) return;

      const sidebar = document.createElement("div");
      sidebar.className = "article-page-layout__sidebar";

      const banner = document.createElement("div");
      banner.className = "article-consult-banner";
      banner.setAttribute("role", "region");
      banner.setAttribute(
        "aria-label",
        "Консультация с экспертом. Разберите ваш вопрос с опытным специалистом по продвижению."
      );

      const copy = document.createElement("div");
      copy.className = "article-consult-banner__copy";

      const title = document.createElement("p");
      title.className = "article-consult-banner__title";
      title.textContent = "Консультация с экспертом";

      const hint = document.createElement("span");
      hint.className = "article-consult-banner__hint";
      hint.textContent = "Разберите ваш вопрос с опытным специалистом по продвижению.";

      copy.appendChild(title);
      copy.appendChild(hint);

      const cta = document.createElement("button");
      cta.type = "button";
      cta.className = "article-consult-banner__cta";
      cta.setAttribute("data-popup", "contacts");
      cta.setAttribute("aria-label", "Записаться на консультацию с экспертом");
      cta.innerHTML =
        `<svg class="visibility-cta__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"></path>` +
        `</svg><span class="article-consult-banner__cta-text">Забронировать</span>`;

      banner.appendChild(copy);
      banner.appendChild(cta);

      container.insertBefore(sidebar, rail);
      sidebar.appendChild(banner);
      sidebar.appendChild(rail);
    });
  };

  const ensureLeadAndShortAnswer = () => {
    if (!sectionHeader || !pageH1) return;
    // Avoid duplicating the same AI lead if page already has it (e.g. custom hero on index)
    if (document.querySelector(".lead-ai")) {
      // Still allow short-answer for articles below
    } else {
    const existingLead = sectionHeader.querySelector(".lead-ai");
    if (!existingLead) {
      const lead = document.createElement("p");
      lead.className = "lead-ai";
      lead.innerHTML =
        `<strong>AI‑контент 2026:</strong> GEO (Generative Engine Optimization) и AEO (Answer Engine Optimization) — ` +
        `как попасть в ответы DeepSeek, ChatGPT, Perplexity и других нейроплатформ.`;
      const after = sectionHeader.querySelector(".update-date") || pageH1;
      after.insertAdjacentElement("afterend", lead);
    }
    }

    if (!article) return;
    if (article.querySelector(".short-answer")) return;

    const collapse = s => String(s || "").trim().replace(/\s+/g, " ");
    const pickAnswerText = () => {
      // Prefer the first H2's first meaningful paragraph/list as "main answer"
      const firstH2 = article.querySelector("h2");
      let el = firstH2 ? firstH2.nextElementSibling : null;
      while (el && el.tagName && !/^H2$/i.test(el.tagName)) {
        if (/^(P|UL|OL)$/i.test(el.tagName)) {
          const t = collapse(el.textContent);
          if (t) return t;
        }
        el = el.nextElementSibling;
      }
      // Fallback: first paragraph in article
      const firstP = article.querySelector("p");
      return firstP ? collapse(firstP.textContent) : "";
    };

    const toTldr = (text, maxSentences = 3) => {
      const t = collapse(text);
      if (!t) return "";
      const parts = t.split(/(?<=[.!?…])\s+/).filter(Boolean);
      const sliced = parts.slice(0, Math.max(1, maxSentences)).join(" ");
      // If result is too short (e.g., no punctuation), keep original but cap hard length.
      const out = sliced.length >= 40 ? sliced : t;
      return out.length > 420 ? `${out.slice(0, 417)}…` : out;
    };

    const text = toTldr(pickAnswerText(), 3);
    const short = document.createElement("div");
    short.className = "short-answer";
    short.innerHTML = `<strong>Коротко (TL;DR):</strong> ${text || "Ниже — прямые ответы на ключевые вопросы и структура, которую нейросети удобно цитируют."}`;
    article.insertAdjacentElement("afterbegin", short);
  };

  const buildTOCAndIds = () => {
    if (!article) return;
    const h2s = Array.from(article.querySelectorAll("h2"));
    if (h2s.length < 2) return;

    const toc = document.createElement("div");
    toc.className = "content-toc";
    toc.setAttribute("aria-label", "Содержание");

    h2s.forEach((h2, idx) => {
      if (!h2.id) h2.id = slugify(h2.textContent) + (idx ? `-${idx + 1}` : "");
      const a = document.createElement("a");
      a.href = `#${h2.id}`;
      a.textContent = h2.textContent.trim();
      toc.appendChild(a);
    });

    const existingToc = article.querySelector(".content-toc");
    if (existingToc) existingToc.remove();
    article.insertAdjacentElement("afterbegin", toc);
  };

  const injectFaqJsonLd = () => {
    if (!article) return;
    const h2s = Array.from(article.querySelectorAll("h2"));
    if (!h2s.length) return;

    const qa = [];
    h2s.forEach(h2 => {
      const q = h2.textContent.trim();
      if (!q) return;

      let el = h2.nextElementSibling;
      if (el && el.classList && el.classList.contains("faq-list")) {
        el.querySelectorAll(":scope > details").forEach(detail => {
          const sum = detail.querySelector("summary");
          if (!sum) return;
          const name = sum.textContent.trim().replace(/\s+/g, " ");
          const parts = [];
          detail.querySelectorAll(":scope > p").forEach(p => {
            const t = p.textContent.trim();
            if (t) parts.push(t);
          });
          const text = parts.join(" ").replace(/\s+/g, " ");
          if (name && text) {
            qa.push({
              "@type": "Question",
              name,
              acceptedAnswer: { "@type": "Answer", text }
            });
          }
        });
        return;
      }

      let ansText = "";
      while (el && el.tagName && !/^H2$/i.test(el.tagName)) {
        if (/^(P|UL|OL|DIV)$/i.test(el.tagName)) {
          ansText = el.textContent.trim().replace(/\s+/g, " ");
          if (ansText) break;
        }
        el = el.nextElementSibling;
      }
      if (!ansText) return;
      qa.push({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: ansText }
      });
    });

    if (qa.length < 2) return;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: qa
    };

    const existing = document.querySelector('script[data-auto="faq-jsonld"]');
    if (existing) existing.remove();
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.dataset.auto = "faq-jsonld";
    s.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(s);
  };

  const injectArticleJsonLd = () => {
    const metaDesc = document.querySelector('meta[name="description"]');
    const description = metaDesc ? (metaDesc.getAttribute("content") || "").trim() : "";
    const headline =
      (pageH1 ? pageH1.textContent.trim() : "") ||
      (document.title || "").trim() ||
      "Статья";

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const canonicalHref = canonicalEl ? (canonicalEl.getAttribute("href") || "").trim() : "";
    const mainEntityOfPage =
      canonicalHref ||
      (typeof window !== "undefined" && window.location ? window.location.pathname : "");

    // Fixed date requested (can be changed later to per-page values)
    const date = "2026-04-08";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline,
      description,
      proficiencyLevel: "Beginner",
      dependencies: "SEO база",
      mainEntityOfPage,
      datePublished: date,
      dateModified: date,
      author: {
        "@type": "Organization",
        name: "GEO Hub"
      }
    };

    const existing = document.querySelector('script[data-auto="article-jsonld"]');
    if (existing) existing.remove();
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.dataset.auto = "article-jsonld";
    s.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(s);
  };

  const injectReadAlsoLinks = () => {
    if (!article) return;
    const h2s = Array.from(article.querySelectorAll("h2"));
    if (!h2s.length) return;

    const candidates = [
      { href: `${prefix}methods/aeo.html`, label: "Что такое AEO оптимизация", kw: ["aeo", "answer", "ответ"] },
      { href: `${prefix}methods/geo.html`, label: "Что такое GEO оптимизация", kw: ["geo", "локал", "карты"] },
      { href: `${prefix}methods/seo.html`, label: "SEO оптимизация (2026)", kw: ["seo", "органик"] },
      {
        href: `${prefix}methods/methods-guide.html`,
        label: "Методы продвижения: как сочетать",
        kw: ["vs", "сравнен", "выбрать", "метод", "ландшафт", "стек", "конфликт"]
      },
      { href: `${prefix}tools/content-factory.html#checklists`, label: "Чеклисты (2026)", kw: ["чеклист", "шаг", "план"] },
      { href: `${prefix}case-studies/local-business.html`, label: "Кейсы локального бизнеса", kw: ["локальн", "карты", "рядом"] }
    ];

    h2s.forEach(h2 => {
      const already = h2.parentElement?.querySelector?.(`.read-also[data-for="${h2.id}"]`);
      if (already) return;
      const text = h2.textContent.toLowerCase();
      const currentUrl = new URL(window.location.href);
      const picked = candidates
        .filter(c => c.kw.some(k => text.includes(k)))
        .filter(c => {
          try {
            const target = new URL(c.href, currentUrl.href);
            return target.pathname !== currentUrl.pathname;
          } catch (e) {
            return true;
          }
        })
        .slice(0, 2);
      if (!picked.length) return;

      const box = document.createElement("p");
      box.className = "read-also";
      box.dataset.for = h2.id || "";
      box.innerHTML =
        `<strong>Читайте также:</strong> ` +
        picked.map(p => `<a href="${p.href}">${p.label}</a>`).join(" | ");

      const insertAfter = h2.nextElementSibling;
      if (insertAfter) insertAfter.insertAdjacentElement("afterend", box);
      else h2.insertAdjacentElement("afterend", box);
    });
  };

  /** Вспомогательные блоки (TL;DR, оглавление, примечания) — в боковую колонку. «Читайте также» и «Связанные страницы» остаются в основном тексте. */
  const relocateArticleRailBlocks = () => {
    document.querySelectorAll(".article-page-layout").forEach(layout => {
      const rail = layout.querySelector(".article-page-layout__rail");
      const article = layout.querySelector("article.content-article");
      if (!rail || !article) return;
      if (rail.dataset.blocksRelocated === "1") return;
      rail.dataset.blocksRelocated = "1";

      const nodes = article.querySelectorAll(".short-answer, .content-toc, .content-note");
      nodes.forEach(el => rail.appendChild(el));
    });
  };

  /** Синий блок внизу каждой статьи: консультация + кнопка «Забронировать» со звездой. */
  const injectArticleConsultFooter = () => {
    document.querySelectorAll("main article.content-article").forEach(article => {
      if (article.querySelector(".article-consult-footer")) return;

      const footer = document.createElement("div");
      footer.className = "article-consult-footer";
      footer.setAttribute("role", "region");
      footer.setAttribute(
        "aria-label",
        "Консультация с экспертом. Разберите ваш вопрос с опытным специалистом по продвижению."
      );

      const inner = document.createElement("div");
      inner.className = "article-consult-footer__inner";

      const copy = document.createElement("div");
      copy.className = "article-consult-footer__copy";

      const title = document.createElement("p");
      title.className = "article-consult-footer__title";
      title.textContent = "Консультация с экспертом";

      const hint = document.createElement("p");
      hint.className = "article-consult-footer__hint";
      hint.textContent = "Разберите ваш вопрос с опытным специалистом по продвижению.";

      copy.appendChild(title);
      copy.appendChild(hint);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "article-consult-footer__cta";
      btn.setAttribute("data-popup", "contacts");
      btn.setAttribute("aria-label", "Записаться на консультацию с экспертом");
      btn.innerHTML =
        `<svg class="visibility-cta__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"></path>` +
        `</svg><span class="article-consult-footer__cta-text">Забронировать</span>`;

      inner.appendChild(copy);
      inner.appendChild(btn);
      footer.appendChild(inner);
      article.appendChild(footer);
    });
  };

  /** На мобильном: боковая панель (консультация + рейл) над статьёй, в виде сворачиваемого блока (закрыт при загрузке). */
  const enhanceArticleSidebarAccordion = () => {
    if (!window.matchMedia) return;
    if (!window.matchMedia("(max-width: 960px)").matches) return;

    document.querySelectorAll(".container.article-page-layout").forEach(container => {
      if (container.dataset.articleSidebarAcc === "1") return;

      const sidebar = container.querySelector(":scope > .article-page-layout__sidebar");
      if (!sidebar) return;

      const details = document.createElement("details");
      details.className = "article-sidebar-acc";
      details.open = false; // закрыто при загрузке

      const summary = document.createElement("summary");
      summary.className = "article-sidebar-acc__summary";
      summary.innerHTML = `
        <span class="article-sidebar-acc__label">Содержание и теги</span>
        <button class="article-sidebar-acc__toggle" type="button" aria-label="Открыть список тегов и содержания"></button>
      `;

      // Открывать/закрывать только по клику на стрелку-кнопку (а не по всему summary)
      summary.addEventListener("click", e => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        if (target.closest("button.article-sidebar-acc__toggle")) return;
        e.preventDefault();
      });

      const toggleBtn = summary.querySelector("button.article-sidebar-acc__toggle");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", e => {
          e.preventDefault();
          e.stopPropagation();
          details.open = !details.open;
          toggleBtn.setAttribute(
            "aria-label",
            details.open ? "Закрыть список тегов и содержания" : "Открыть список тегов и содержания"
          );
        });
      }

      const panel = document.createElement("div");
      panel.className = "article-sidebar-acc__panel";

      while (sidebar.firstChild) panel.appendChild(sidebar.firstChild);

      details.appendChild(summary);
      details.appendChild(panel);

      sidebar.replaceWith(details);
      container.dataset.articleSidebarAcc = "1";
    });
  };

  ensureUpdateDate();
  ensureLeadAndShortAnswer();
  initArticlePageLayout();
  injectArticleConsultBanner();
  buildTOCAndIds();
  injectReadAlsoLinks();
  relocateArticleRailBlocks();
  injectArticleConsultFooter();
  enhanceArticleSidebarAccordion();
  injectFaqJsonLd();
  injectArticleJsonLd();

  const openTopMenu = () => {
    if (!burger) return;
    topMenu.hidden = false;
    topMenu.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
  };

  const closeTopMenu = () => {
    if (!burger) return;
    topMenu.classList.remove("is-open");
    topMenu.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  };

  if (burger) {
    burger.addEventListener("click", () => {
      const isOpen = topMenu.classList.contains("is-open") && !topMenu.hidden;
      if (isOpen) closeTopMenu();
      else openTopMenu();
    });
  }

  topMenu.addEventListener("click", e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-topmenu-close]")) closeTopMenu();
    const link = target.closest("a[href]");
    if (link) closeTopMenu();
  });

  // Legacy nav toggle fallback (if drawer isn't present)
  if (burger && nav && !document.querySelector(".top-menu")) {
    burger.addEventListener("click", () => {
      const expanded = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!expanded));
      document.body.classList.toggle("nav-open", !expanded);
      nav.classList.toggle("nav-open", !expanded);
    });
  }

  // Header dropdowns: only one open at a time (drawer can stay expanded)
  const headerDropdowns = Array.from(document.querySelectorAll(".main-nav details.nav-dd"));
  const closeAllHeaderDropdowns = (exceptEl = null) => {
    headerDropdowns.forEach(d => {
      if (d !== exceptEl) d.removeAttribute("open");
    });
  };

  headerDropdowns.forEach(d => {
    d.addEventListener("toggle", () => {
      if (d.open) closeAllHeaderDropdowns(d);
    });
  });

  document.addEventListener("click", e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const clickedInsideNav = Boolean(target.closest(".main-nav, .drawer-nav"));
    if (!clickedInsideNav) closeAllDropdowns();
  });

  // Footer/header popups
  const modal = document.querySelector("#site-modal");
  const modalTitle = document.querySelector("#modal-title");
  const modalBody = document.querySelector("#modal-body");
  const modalClose = document.querySelector(".modal-close");
  const popupTriggers = document.querySelectorAll("[data-popup]");

  // Contact form overlay (CodePen-like behavior, no jQuery)
  const bindContactCloseHandlers = root => {
    const scope = root instanceof Element ? root : document;
    const bindClose = el => {
      if (!(el instanceof Element)) return;
      if (el.dataset.boundClose === "true") return;
      const handler = e => {
        try {
          if (e && typeof e.preventDefault === "function") e.preventDefault();
          if (e && typeof e.stopPropagation === "function") e.stopPropagation();
        } catch {}
        closeContactOverlay();
      };
      el.addEventListener("pointerdown", handler, { capture: true });
      el.addEventListener("touchstart", handler, { capture: true, passive: false });
      el.addEventListener("click", handler, { capture: true });
      el.dataset.boundClose = "true";
    };

    scope.querySelectorAll("[data-contact-close]").forEach(bindClose);
  };

  const ensureContactOverlay = () => {
    const existing = document.querySelector("#contact-form-container");
    if (existing) {
      bindContactCloseHandlers(document.querySelector(".contact-form-wrap") || document.body);
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "contact-form-wrap";
    wrap.innerHTML = `
      <div class="form-overlay" data-contact-close></div>
      <div id="contact-form-container" class="contact-form-container" role="dialog" aria-modal="true" aria-label="Форма связи">
        <button type="button" class="contact-form-close" data-contact-close aria-label="Закрыть">×</button>
        <div id="contact-form-content" class="contact-form-content">
          <div id="contact-form-head" class="contact-form-head">
            <h3 class="pre">Заявка и контакты</h3>
            <p class="pre">Оставьте контакты — ответим в ближайшее время.</p>
            <h3 class="post">Спасибо!</h3>
            <p class="post">Мы свяжемся с вами как можно быстрее.</p>
          </div>
          <form id="contact-form" novalidate>
            <input class="input name" type="text" name="user_name" placeholder="Ваше имя" required />
            <input class="input email" type="email" name="user_email" placeholder="Email для связи" required />
            <textarea class="input message" name="message" placeholder="Коротко: что нужно сделать?" required></textarea>
            <button class="btn input submit" type="submit">Отправить</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
    bindContactCloseHandlers(wrap);
  };

  const isValidEmail = email => {
    const v = String(email || "").trim();
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  const openContactOverlay = () => {
    ensureContactOverlay();
    // Re-bind close handlers every open (webviews can drop events)
    bindContactCloseHandlers(document.querySelector(".contact-form-wrap") || document.body);
    document.body.classList.add("show-form-overlay");
    document.body.classList.remove("form-submitted");
    const head = document.querySelector("#contact-form-head");
    if (head) head.classList.remove("form-submitted");
    const container = document.querySelector("#contact-form-container");
    const content = document.querySelector("#contact-form-content");
    if (container) container.classList.add("expand");
    if (content) content.classList.add("expand");
  };

  const closeContactOverlay = () => {
    const container = document.querySelector("#contact-form-container");
    const content = document.querySelector("#contact-form-content");
    if (content) content.classList.remove("expand");
    if (container) container.classList.remove("expand");
    document.body.classList.remove("show-form-overlay");
    document.body.classList.remove("form-submitted");
  };

  const popupContent = {
    contacts: {
      title: "Контакты",
      body: `
        <p>ИП Комарова</p>
        <p>Телефон: <a href="tel:89060959296">8 906 095-92-96</a></p>
      `
    },
    privacy: {
      title: "Политика конфиденциальности",
      body: `
        <p>Мы обрабатываем персональные данные только для связи по заявкам и оказания услуг.</p>
        <p>Данные не передаются третьим лицам без законных оснований и хранятся в защищенном виде.</p>
      `
    },
    consent: {
      title: "Согласие на обработку данных",
      body: `
        <p>Оставляя данные на сайте, вы даете согласие на обработку персональных данных в целях обратной связи и оказания услуг.</p>
        <p>Вы можете отозвать согласие, направив запрос по контактному номеру, указанному в разделе «Контакты».</p>
      `
    },
    terms: {
      title: "Условия использования",
      body: `
        <p>Используя сайт, вы соглашаетесь с условиями обработки информации и правилами взаимодействия.</p>
        <p>Материалы сайта носят информационный характер и не являются публичной офертой.</p>
      `
    }
  };

  const openModal = key => {
    if (key === "contacts") {
      openContactOverlay();
      return;
    }
    if (!modal || !modalTitle || !modalBody || !popupContent[key]) return;
    modalTitle.textContent = popupContent[key].title;
    modalBody.innerHTML = popupContent[key].body;
    modal.hidden = false;
  };

  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
  };

  popupTriggers.forEach(trigger => {
    trigger.addEventListener("click", e => {
      e.preventDefault();
      openModal(trigger.getAttribute("data-popup"));
    });
  });

  document.addEventListener("click", e => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-contact-close]")) closeContactOverlay();
  });
  // Extra fallback for mobile webviews that don't fire click reliably
  document.addEventListener(
    "pointerup",
    e => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-contact-close]")) closeContactOverlay();
    },
    { capture: true }
  );

  document.addEventListener("submit", e => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id !== "contact-form") return;
    e.preventDefault();

    const name = form.querySelector('input[name="user_name"]');
    const email = form.querySelector('input[name="user_email"]');
    const message = form.querySelector('textarea[name="message"]');
    const fields = [name, email, message].filter(Boolean);

    fields.forEach(el => el.classList.remove("form-error"));

    let hasError = false;
    if (name && !String(name.value || "").trim()) { name.classList.add("form-error"); hasError = true; }
    if (email && !isValidEmail(email.value)) { email.classList.add("form-error"); hasError = true; }
    if (message && !String(message.value || "").trim()) { message.classList.add("form-error"); hasError = true; }

    if (hasError) return;

    // UI-only "submitted" state (no backend in this repo)
    document.body.classList.add("form-submitted");
    const head = document.querySelector("#contact-form-head");
    if (head) head.classList.add("form-submitted");

    window.setTimeout(() => {
      form.reset();
      closeContactOverlay();
      document.body.classList.remove("form-submitted");
      if (head) head.classList.remove("form-submitted");
    }, 1600);
  });

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal();
    });
  }

  window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeModal();
      closeContactOverlay();
      closeTopMenu();
    }
  });

  const visibilitySections = Array.from(document.querySelectorAll(".visibility-section"));
  visibilitySections.forEach(visibilitySection => {
    // Static centered ring
    visibilitySection.style.setProperty("--ring-x", "50");
    visibilitySection.style.setProperty("--ring-y", "50");
  });

  // Industries: CodePen-like expanding cards
  const optionsRoot = document.querySelector(".industry-options .options");
  if (optionsRoot) {
    const options = Array.from(optionsRoot.querySelectorAll(".option"));
    const setActive = next => {
      options.forEach(o => o.classList.toggle("active", o === next));
    };

    options.forEach(opt => {
      opt.tabIndex = 0;
      opt.addEventListener("click", () => setActive(opt));
      opt.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setActive(opt);
        }
      });
    });
  }

  // Brands slider
  const brandButtons = document.querySelectorAll(".brands-nav-item");
  const brandSlides = document.querySelectorAll(".brand-slide");

  if (brandButtons.length && brandSlides.length) {
    brandButtons.forEach(button => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-brand");

        brandButtons.forEach(btn =>
          btn.classList.toggle("is-active", btn === button)
        );

        brandSlides.forEach(slide =>
          slide.classList.toggle(
            "is-active",
            slide.getAttribute("data-brand") === targetId
          )
        );
      });
    });
  }

  // Platforms slider (Как мы работаем)
  const platformButtons = document.querySelectorAll(".platforms-nav-item");
  const platformSlides = document.querySelectorAll(".platform-slide");

  if (platformButtons.length && platformSlides.length) {
    platformButtons.forEach(button => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-platform");

        platformButtons.forEach(btn =>
          btn.classList.toggle("is-active", btn === button)
        );

        platformSlides.forEach(slide =>
          slide.classList.toggle(
            "is-active",
            slide.getAttribute("data-platform") === targetId
          )
        );
      });
    });
  }

  // Advanced reveal animation system
  const revealTargets = document.querySelectorAll(
    ".hero-content, .visibility-card, .platforms-content, .brands-header, .brand-slide.is-active, .faq-list details, .footer-inner"
  );

  revealTargets.forEach((el, index) => {
    el.classList.add("js-reveal");
    el.style.setProperty("--reveal-delay", `${Math.min(index * 70, 560)}ms`);
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    revealTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add("is-visible"));
  }

  // CodePen-inspired typewriter reveal for key headings
  const typewriterTargets = document.querySelectorAll(
    ".section-header h2, .platform-slide h3, .brand-content h3"
  );

  typewriterTargets.forEach((el, index) => {
    el.classList.add("js-typewriter");
    el.style.setProperty("--tw-duration", `${1100 + Math.min(index * 40, 500)}ms`);
  });

  const runTypewriter = el => {
    el.classList.remove("is-typed");
    // restart animation reliably
    void el.offsetWidth;
    el.classList.add("is-typed");
  };

  if ("IntersectionObserver" in window) {
    const typewriterObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runTypewriter(entry.target);
            typewriterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );

    typewriterTargets.forEach(el => typewriterObserver.observe(el));
  } else {
    typewriterTargets.forEach(runTypewriter);
  }

  // Re-animate active brand slide on switch
  if (brandButtons.length && brandSlides.length) {
    brandButtons.forEach(button => {
      button.addEventListener("click", () => {
        const active = document.querySelector(".brand-slide.is-active");
        if (active) {
          active.classList.remove("is-visible");
          requestAnimationFrame(() => active.classList.add("is-visible"));

          const brandTitle = active.querySelector("h3");
          if (brandTitle && brandTitle.classList.contains("js-typewriter")) {
            runTypewriter(brandTitle);
          }
        }
      });
    });
  }

  if (platformButtons.length && platformSlides.length) {
    platformButtons.forEach(button => {
      button.addEventListener("click", () => {
        const activePlatform = document.querySelector(".platform-slide.is-active h3");
        if (activePlatform && activePlatform.classList.contains("js-typewriter")) {
          runTypewriter(activePlatform);
        }
      });
    });
  }

  // Assign depth classes for advanced parallax motion
  const depth1 = document.querySelectorAll(".hero-content, .platforms-content");
  const depth2 = document.querySelectorAll(".brand-slide.is-active, .platform-slide.is-active");
  const depth3 = document.querySelectorAll(".logo-text, .header-cta");
  depth1.forEach(el => el.classList.add("fx-depth-1"));
  depth2.forEach(el => el.classList.add("fx-depth-2"));
  depth3.forEach(el => el.classList.add("fx-depth-3"));

  // Non-standard motion engine: hybrid mouse + scroll parallax
  const fxNodes = [
    ...document.querySelectorAll(".fx-depth-1, .fx-depth-2, .fx-depth-3")
  ];
  if (fxNodes.length) {
    let mx = 0;
    let my = 0;
    let sy = window.scrollY || 0;

    window.addEventListener("mousemove", e => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mx = (e.clientX - cx) / cx;
      my = (e.clientY - cy) / cy;
    });

    window.addEventListener("scroll", () => {
      sy = window.scrollY || 0;
    }, { passive: true });

    const tick = () => {
      fxNodes.forEach(node => {
        let depth = 1;
        if (node.classList.contains("fx-depth-2")) depth = 2;
        if (node.classList.contains("fx-depth-3")) depth = 3;

        const dx = mx * (3 * depth);
        const dy = my * (2.2 * depth) + (sy * 0.002 * depth);
        node.style.setProperty("--fx-x", `${dx.toFixed(2)}px`);
        node.style.setProperty("--fx-y", `${dy.toFixed(2)}px`);
      });
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }
});

