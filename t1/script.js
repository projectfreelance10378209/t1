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
     7. Плашка cookie
     8. Цели Яндекс.Метрики
   ===================================================================== */

'use strict';


/* ====================================================================
   0. НАСТРОЙКИ — всё, что нужно менять заказчику/разработчику, здесь
   ==================================================================== */

const CONFIG = {
  // Телефон: для ссылки tel: — только цифры и «+»; для показа на странице — любой формат
  phone:     '+70000000000',
  phoneText: '+7 (000) 000-00-00',

  // Telegram: ссылка и подпись (например https://t.me/akpp57 и @akpp57)
  telegram:     'https://t.me/USERNAME',
  telegramText: '@username',

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
   7. ПЛАШКА COOKIE
   ==================================================================== */

function initCookie() {
  const banner = $('#cookie');
  if (!banner) return;

  let accepted = false;
  try { accepted = localStorage.getItem('cookieAccepted') === '1'; } catch (e) { /* localStorage недоступен */ }
  if (accepted) return;

  // Показываем после интро, чтобы не мешать
  setTimeout(() => { banner.hidden = false; }, CONFIG.introDuration + 1200);

  $('#cookie-ok').addEventListener('click', () => {
    banner.hidden = true;
    try { localStorage.setItem('cookieAccepted', '1'); } catch (e) { /* ничего страшного */ }
  });
}


/* ====================================================================
   8. ЦЕЛИ ЯНДЕКС.МЕТРИКИ
   Элементы с data-goal="call" / data-goal="telegram" отправляют цель
   при клике. Работает, когда в CONFIG указан metrikaId и подключён счётчик.
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
