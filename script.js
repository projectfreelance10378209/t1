/* =====================================================================
   АКПП 57 — скрипты лендинга
   Содержание:
     0. НАСТРОЙКИ (контакты, Метрика, фото галереи) — правятся здесь
     1. Подстановка контактов
     2. Интро-экран
     3. Шапка, меню, подсветка активного раздела
     4. Плавное появление элементов
     5. Галерея и лайтбокс
     6. Модальные окна
     7. Согласие на cookie (Метрика и карта включаются только после него)
     8. Цели Яндекс.Метрики
   ===================================================================== */

'use strict';


/* ====================================================================
   0. НАСТРОЙКИ — всё, что нужно менять заказчику/разработчику, здесь
   ==================================================================== */

const CONFIG = {
  // ВАЖНО: эти значения подставляются во ВСЕ кнопки и ссылки на сайте
  // (и перезаписывают то, что написано в index.html). Менять контакты нужно здесь.

  // Телефон: для ссылки tel: — только цифры и «+»; для показа на странице — любой формат
  phone:     '+79107481241',
  phoneText: '+7 (910) 748-12-41',

  // Telegram: ссылка и подпись
  telegram:     'https://t.me/akpp_57',
  telegramText: '@akpp_57',

  // Max: ссылка и подпись, которая показывается в «Контактах».
  // ВНИМАНИЕ: у Max нет прямой ссылки по номеру телефона (как wa.me у WhatsApp).
  // Рабочая ссылка на профиль выглядит как https://max.ru/u/ДЛИННЫЙ_КОД — её нужно
  // скопировать в самом приложении (профиль → QR-код → «Поделиться») и вставить сюда.
  // Текущая ссылка по номеру может не открывать чат — проверить с телефона.
  max:     'https://max.ru/79107481241',
  maxText: '+7 (910) 748-12-41',

  // ID счётчика Яндекс.Метрики (число). Пока null — цели не отправляются
  metrikaId: null,

  // Сколько миллисекунд показывать интро-экран (по заданию 2–3 секунды)
  introDuration: 2600
};

/*
  ФОТО ГАЛЕРЕИ.
  Чтобы добавить фото: положите файл в папку images/gallery/ и добавьте строку в список.
  Пример:
    { src: 'images/gallery/01.jpg', alt: 'Разборка АКПП' },
  Пока список пуст — показываются заглушки.
*/
const GALLERY_PHOTOS = [
  // { src: 'images/gallery/01.jpg', alt: 'Описание фото' },
];

/* Сколько заглушек показывать, пока нет настоящих фото */
const GALLERY_PLACEHOLDERS = 8;


/* ====================================================================
   Вспомогательные функции
   ==================================================================== */

/** Короткие обёртки над querySelector */
const $  = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/** Пользователь отключил анимации в системе? */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ====================================================================
   1. ПОДСТАНОВКА КОНТАКТОВ
   Все кнопки/ссылки с атрибутами data-phone и data-telegram
   получают значения из CONFIG — менять в HTML ничего не нужно.
   ==================================================================== */

function applyContacts() {
  $$('[data-phone]').forEach((el) => { el.href = `tel:${CONFIG.phone}`; });
  $$('[data-phone-text]').forEach((el) => { el.textContent = CONFIG.phoneText; });

  $$('[data-telegram]').forEach((el) => { el.href = CONFIG.telegram; });
  $$('[data-telegram-text]').forEach((el) => { el.textContent = CONFIG.telegramText; });

  $$('[data-max]').forEach((el) => { el.href = CONFIG.max; });
  $$('[data-max-text]').forEach((el) => { el.textContent = CONFIG.maxText; });
}


/* ====================================================================
   2. ИНТРО-ЭКРАН
   Чёрный фон + логотип, затем плавно открывается сайт.
   Клик по экрану пропускает интро.
   ==================================================================== */

function initIntro() {
  const intro = $('#intro');
  if (!intro) return;

  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    intro.classList.add('is-hidden');
    document.body.classList.remove('is-loading');
    startReveal();                       // запускаем появление элементов
    setTimeout(() => intro.remove(), 900);
  };

  setTimeout(finish, prefersReducedMotion ? 300 : CONFIG.introDuration);
  intro.addEventListener('click', finish);
}


/* ====================================================================
   3. ШАПКА, МЕНЮ, АКТИВНЫЙ РАЗДЕЛ
   ==================================================================== */

function initHeader() {
  const header = $('#header');
  const burger = $('#burger');
  const nav    = $('#nav');

  // Фон у шапки появляется после небольшой прокрутки
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Мобильное меню
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };

  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Подсветка пункта меню текущего раздела
  const links = $$('a', nav);
  const sections = links
    .map((a) => $(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });   // «линия» посередине экрана

    sections.forEach((section) => spy.observe(section));
  }
}


/* ====================================================================
   4. ПЛАВНОЕ ПОЯВЛЕНИЕ ЭЛЕМЕНТОВ ПРИ ПРОКРУТКЕ
   Элементы с классом .reveal получают .is-visible, когда попадают в экран.
   ==================================================================== */

function startReveal() {
  const items = $$('.reveal');

  // Без поддержки IntersectionObserver или при отключённых анимациях — показываем всё сразу
  if (!('IntersectionObserver' in window) || prefersReducedMotion) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  // Небольшая задержка между соседними элементами даёт эффект «каскада»
  items.forEach((el) => {
    const siblings = $$('.reveal', el.parentElement);
    el.style.setProperty('--delay', `${Math.min(siblings.indexOf(el), 5) * 0.08}s`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);          // анимируем один раз
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el) => observer.observe(el));
}


/* ====================================================================
   5. ГАЛЕРЕЯ И ЛАЙТБОКС
   ==================================================================== */

/** Рисует SVG-заглушку (data-URI), пока нет настоящих фото */
function makePlaceholder(n) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#1b1b21"/><stop offset="1" stop-color="#101014"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <circle cx="400" cy="280" r="70" fill="none" stroke="#e8a33d" stroke-opacity=".5" stroke-width="22" stroke-dasharray="27 27"/>
      <circle cx="400" cy="280" r="46" fill="none" stroke="#e8a33d" stroke-opacity=".5" stroke-width="6"/>
      <text x="400" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#6d6d78">Фото ${n}</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function initGallery() {
  const grid = $('#gallery-grid');
  if (!grid) return;

  // Настоящие фото или заглушки
  const photos = GALLERY_PHOTOS.length
    ? GALLERY_PHOTOS
    : Array.from({ length: GALLERY_PLACEHOLDERS }, (_, i) => ({
        src: makePlaceholder(i + 1),
        alt: `Фото ${i + 1} (заглушка)`
      }));

  // Строим сетку
  photos.forEach((photo, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'gallery__item reveal';
    item.setAttribute('aria-label', `Открыть фото: ${photo.alt || index + 1}`);

    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.alt || '';
    img.loading = 'lazy';
    item.appendChild(img);

    item.addEventListener('click', () => openLightbox(index));
    grid.appendChild(item);
  });

  // --- Лайтбокс ---
  const box     = $('#lightbox');
  const imgEl   = $('#lb-img');
  const caption = $('#lb-caption');
  let current = 0;
  let lastFocus = null;

  function show(index) {
    current = (index + photos.length) % photos.length;   // зацикливаем
    imgEl.src = photos[current].src;
    imgEl.alt = photos[current].alt || '';
    caption.textContent = photos[current].alt || '';
  }

  function openLightbox(index) {
    lastFocus = document.activeElement;
    show(index);
    box.hidden = false;
    document.body.classList.add('no-scroll');
    $('#lb-close').focus();
  }

  function closeLightbox() {
    box.hidden = true;
    document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }

  $('#lb-close').addEventListener('click', closeLightbox);
  $('#lb-prev').addEventListener('click', () => show(current - 1));
  $('#lb-next').addEventListener('click', () => show(current + 1));

  // Клик по тёмному фону закрывает окно
  box.addEventListener('click', (e) => { if (e.target === box) closeLightbox(); });

  // Клавиатура: Esc, ← и →
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  // Свайп на телефоне
  let touchX = null;
  box.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
}


/* ====================================================================
   6. МОДАЛЬНЫЕ ОКНА (политика конфиденциальности, согласие)
   Кнопка с data-modal="id" открывает <dialog id="id">.
   ==================================================================== */

function initModals() {
  $$('[data-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.modal);
      if (!target) return;

      // Закрываем другие открытые окна (например, при переходе «Согласие → Политика»)
      $$('dialog[open]').forEach((d) => d.close());

      if (typeof target.showModal === 'function') target.showModal();
      else target.setAttribute('open', '');           // запасной вариант для старых браузеров
      document.body.classList.add('no-scroll');
    });
  });

  $$('dialog.modal').forEach((dialog) => {
    // Крестик
    $$('[data-close]', dialog).forEach((btn) => btn.addEventListener('click', () => dialog.close()));

    // Клик по затемнённому фону
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

    // Любое закрытие (крестик, Esc, фон) снимает блокировку прокрутки
    dialog.addEventListener('close', () => {
      if (!$('dialog[open]')) document.body.classList.remove('no-scroll');
    });
  });
}


/* ====================================================================
   7. СОГЛАСИЕ НА COOKIE
   Пока посетитель не нажал «Принять», НЕ загружаются:
     — счётчик Яндекс.Метрики;
     — карта Яндекс.Карт (вместо неё показывается заглушка).
   Выбор («accepted» / «declined») хранится в localStorage и меняется
   по ссылке «Настройки cookie» в подвале.
   ==================================================================== */

const CONSENT_KEY = 'cookieConsent';
let memoryConsent = null;          // запасной вариант, если localStorage недоступен

function getConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return memoryConsent; }
}

function setConsent(value) {
  memoryConsent = value;
  try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* ничего страшного */ }
}

/** Подключает счётчик Яндекс.Метрики (стандартный код, вызывается один раз) */
let metrikaLoaded = false;
function loadMetrika() {
  if (metrikaLoaded || !CONFIG.metrikaId) return;
  metrikaLoaded = true;

  // Стандартный загрузчик Метрики. При желании его можно заменить кодом из кабинета Метрики.
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (let j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) return; }
    k = e.createElement(t); a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

  window.ym(CONFIG.metrikaId, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false          // запись сессий выключена; включить можно, если заказчик захочет
  });
}

/** Показывает карту (после согласия) или заглушку (до согласия / после отказа) */
function setMapEnabled(enabled) {
  const frame = $('#map-frame');
  const stub  = $('#map-stub');
  if (!frame || !stub) return;

  if (enabled) {
    if (!frame.src || frame.src === 'about:blank') frame.src = frame.dataset.src;
  } else if (frame.src) {
    frame.src = 'about:blank';   // если карта уже загружалась — выгружаем её
  }
  frame.hidden = !enabled;
  stub.hidden  = enabled;
}

/** Применяет выбор посетителя */
function applyConsent(value) {
  if (value === 'accepted') loadMetrika();
  setMapEnabled(value === 'accepted');
}

function initCookie() {
  const banner = $('#cookie');
  if (!banner) return;

  const show = () => { banner.hidden = false; };
  const decide = (value) => {
    setConsent(value);
    applyConsent(value);
    banner.hidden = true;
  };

  $('#cookie-accept').addEventListener('click', () => decide('accepted'));
  $('#cookie-decline').addEventListener('click', () => decide('declined'));
  $$('[data-cookie-accept]').forEach((btn) => btn.addEventListener('click', () => decide('accepted')));
  $$('[data-cookie-settings]').forEach((btn) => btn.addEventListener('click', show));

  // Что выбрано раньше: если ничего — до согласия всё остаётся выключенным
  const saved = getConsent();
  applyConsent(saved);

  // Плашку показываем после интро, чтобы не мешать
  if (!saved) setTimeout(() => { if (!getConsent()) show(); }, CONFIG.introDuration + 600);
}


/* ====================================================================
   8. ЦЕЛИ ЯНДЕКС.МЕТРИКИ
   Элементы с data-goal="call" / "telegram" / "max" отправляют цель
   при клике. Работает, когда в CONFIG указан metrikaId и посетитель принял cookie
   (без согласия счётчик не загружается, и window.ym не существует).
   ==================================================================== */

function initGoals() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-goal]');
    if (!el || !CONFIG.metrikaId || typeof window.ym !== 'function') return;
    window.ym(CONFIG.metrikaId, 'reachGoal', el.dataset.goal);
  });
}


/* ====================================================================
   ЗАПУСК
   ==================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  applyContacts();
  initHeader();
  initGallery();     // строим галерею до запуска анимаций появления
  initModals();
  initCookie();
  initGoals();

  // Год в подвале
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Интро запускает появление элементов после своего завершения
  initIntro();
});
