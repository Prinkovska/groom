/* =========================================================
   Paw Beauty Grooming — інтерактив і анімації
   ========================================================= */

/* Куди надсилати заявки. Порожньо = демо-режим (заявка лише в консоль).
   Варіанти: Formspree (https://formspree.io/f/xxxx), Web3Forms,
   або Google Apps Script, що пересилає в Telegram-бот. */
const CONFIG = {
  endpoint: '',
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

/* ---------- Шапка, прогрес, мобільна панель ---------- */
const header = $('#header');
const progressBar = $('.scroll-progress__bar');
const progressPaw = $('.scroll-progress__paw');
const mbar = $('#mbar');
const hero = $('#hero');

function onScroll() {
  const y = scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? y / max : 0;
  header.classList.toggle('is-scrolled', y > 40);
  progressBar.style.transform = `scaleX(${p})`;
  progressPaw.style.left = `${p * 100}%`;
  progressPaw.style.opacity = y > 40 ? 1 : 0;
  mbar.classList.toggle('is-visible', y > hero.offsetHeight * 0.7);
  drawStepsLine();
  heroOnScroll(y);
}

/* Перший екран: фон «відʼїжджає» в заокруглену картку, текст пливе вгору і тане */
const heroContent = $('#heroContent');
function heroOnScroll(y) {
  if (reduceMotion) return;
  const h = hero.offsetHeight;
  if (y > h) return;
  const p = Math.min(y / (h * 0.7), 1);
  hero.style.setProperty('--hp', p.toFixed(3));
  heroContent.style.transform = `translateY(${y * 0.3}px)`;
  heroContent.style.opacity = Math.max(1 - p * 1.1, 0);
}
addEventListener('scroll', onScroll, { passive: true });

/* ---------- Бургер ---------- */
const burger = $('#burger');
const nav = $('#nav');
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', open);
  nav.classList.toggle('is-open', open);
});
$$('a', nav).forEach(a => a.addEventListener('click', () => {
  burger.setAttribute('aria-expanded', 'false');
  nav.classList.remove('is-open');
}));

/* ---------- Підсвітка активного пункту меню ---------- */
const navLinks = $$('.nav a[href^="#"]');
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });

/* ---------- Поява блоків при скролі ---------- */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    revealObs.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
$$('.reveal, .reveal-scale, .step').forEach(el => revealObs.observe(el));

/* ---------- Лічильники ---------- */
const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const to = parseFloat(el.dataset.count);
    const dec = +(el.dataset.decimals || 0);
    const dur = 1600;
    const start = performance.now();
    const fmt = v => v.toLocaleString('uk-UA', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reduceMotion) { el.textContent = fmt(to); return; }
    (function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = fmt(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    })(start);
    countObs.unobserve(el);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach(el => countObs.observe(el));

/* ---------- Заголовок першого екрана з'являється по словах ---------- */
(function splitTitle() {
  if (reduceMotion) return;
  let i = 0;
  $$('.hero__title .split').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map(w => `<span class="w" style="--i:${i++}">${w}</span>`).join(' ');
    if (el.nextElementSibling?.classList.contains('rotator')) i += 2;
  });
})();

/* ---------- Фон першого екрана: відео або слайди ----------
   Якщо у assets/video/ є hero.mp4 (і hero-mobile.mp4), показуємо відео.
   Інакше — фото змінюються з ефектом повільного наїзду камери. */
(function heroBackground() {
  const video = $('#heroVideo');
  const slides = $$('.hero__slides img');
  let timer;
  if (slides.length > 1 && !reduceMotion) {
    let i = 0;
    timer = setInterval(() => {
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, 6000);
  }
  if (!video || reduceMotion || navigator.connection?.saveData) return;
  video.addEventListener('canplay', () => {
    hero.classList.add('has-video');
    clearInterval(timer);
    video.play().catch(() => hero.classList.remove('has-video'));
  }, { once: true });
  // браузер ставить відео на паузу у фоновій вкладці — відновлюємо, коли вкладка знову видима
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && hero.classList.contains('has-video')) video.play().catch(() => {});
  });
  video.load();
})();

/* ---------- Слово, що змінюється в заголовку ---------- */
(function rotator() {
  const box = $('.rotator');
  const words = $$('.rotator__word');
  if (words.length < 2 || reduceMotion) return;
  // ширина блоку плавно підлаштовується під поточне слово — без «дірки» в рядку
  const fit = w => { box.style.width = w.scrollWidth + 'px'; };
  let i = 0;
  fit(words[0]);
  document.fonts?.ready.then(() => fit(words[i]));
  addEventListener('resize', () => fit(words[i]));
  setInterval(() => {
    const cur = words[i];
    i = (i + 1) % words.length;
    cur.classList.remove('is-active');
    cur.classList.add('is-out');
    words[i].classList.remove('is-out');
    words[i].classList.add('is-active');
    fit(words[i]);
    setTimeout(() => cur.classList.remove('is-out'), 650);
  }, 2400);
})();

/* ---------- Паралакс фону першого екрана + слід з лапок ---------- */
if (finePointer && !reduceMotion) {
  // легкий паралакс фону за мишкою
  const bgLayers = $$('.hero__slides, .hero__video');
  hero.addEventListener('mousemove', e => {
    const x = e.clientX / innerWidth - 0.5;
    const y = e.clientY / innerHeight - 0.5;
    bgLayers.forEach(l => { l.style.transform = `translate(${x * -18}px, ${y * -12}px) scale(1.04)`; });
  });

  let last = 0, flip = false;
  hero.addEventListener('mousemove', e => {
    const now = performance.now();
    if (now - last < 140) return;
    last = now;
    const paw = document.createElement('span');
    paw.className = 'paw-trail';
    paw.textContent = '🐾';
    flip = !flip;
    paw.style.left = e.clientX + (flip ? 10 : -10) + 'px';
    paw.style.top = e.clientY + 14 + 'px';
    paw.style.rotate = (flip ? 15 : -15) + 'deg';
    document.body.appendChild(paw);
    setTimeout(() => paw.remove(), 1100);
  });
}

/* ---------- Магнітні кнопки ---------- */
if (finePointer && !reduceMotion) {
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}

/* ---------- «Прожектор» на картках ---------- */
$$('.spotlight').forEach(card => card.addEventListener('mousemove', e => {
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', e.clientX - r.left + 'px');
  card.style.setProperty('--my', e.clientY - r.top + 'px');
}));

/* ---------- Фільтр послуг ---------- */
(function filter() {
  const btns = $$('.filter__btn');
  const pill = $('.filter__pill');
  const cards = $$('.svc');
  function movePill(btn) {
    pill.style.width = btn.offsetWidth + 'px';
    pill.style.transform = `translateX(${btn.offsetLeft - 5}px)`;
  }
  btns.forEach(btn => btn.addEventListener('click', () => {
    btns.forEach(b => b.classList.toggle('is-active', b === btn));
    movePill(btn);
    const f = btn.dataset.filter;
    cards.forEach(c => {
      const show = f === 'all' || c.dataset.type.split(' ').includes(f);
      c.classList.toggle('is-hidden', !show);
      if (show) { c.classList.remove('is-in'); requestAnimationFrame(() => c.classList.add('is-in')); }
    });
  }));
  movePill(btns[0]);
  addEventListener('resize', () => movePill($('.filter__btn.is-active')));
})();

/* ---------- Калькулятор вартості ----------
   base — ціна для міні-породи з доглянутою шерстю (грн). Узгодити з власником. */
const PRICES = {
  dog: [
    { name: 'Комплексний грумінг', base: 1000 },
    { name: 'Експрес-линька', base: 600 },
    { name: 'Гігієнічний догляд', base: 500 },
    { name: 'Тримінг', base: 900 },
    { name: 'SPA-догляд', base: 700 },
  ],
  cat: [
    { name: 'Догляд за котами', base: 600 },
    { name: 'Експрес-линька', base: 600 },
    { name: 'Гігієнічний догляд', base: 500 },
    { name: 'SPA-догляд', base: 700 },
  ],
};
const calcForm = $('#calcForm');
const calcServices = $('#calcServices');
let calcSummary = { service: 'Комплексний грумінг', from: 1000, to: 1200 };

function renderCalcServices() {
  const pet = calcForm.pet.value;
  calcServices.innerHTML = PRICES[pet].map((s, i) =>
    `<label class="chip"><input type="radio" name="service" value="${i}" ${i === 0 ? 'checked' : ''}><span>${s.name}</span></label>`
  ).join('');
  // для котів розміри «середній/великий» відповідають звичайному/великому коту
  calcForm.querySelectorAll('[name="size"]')[2].closest('.chip').style.display = pet === 'cat' ? 'none' : '';
  if (pet === 'cat' && calcForm.size.value === '1.8') calcForm.size[1].checked = true;
}
function animateNumber(el, to) {
  const from = parseInt(el.textContent.replace(/\D/g, ''), 10) || 0;
  const start = performance.now();
  (function tick(now) {
    const t = Math.min((now - start) / 500, 1);
    el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}
function calc() {
  const pet = calcForm.pet.value;
  const svc = PRICES[pet][+calcForm.service.value || 0];
  const size = parseFloat(calcForm.size.value);
  const coat = +calcForm.coat.value;
  const from = Math.round((svc.base * size + coat) / 50) * 50;
  const to = Math.round(from * 1.2 / 50) * 50;
  calcSummary = { service: svc.name, from, to };
  animateNumber($('#calcFrom'), from);
  animateNumber($('#calcTo'), to);
}
calcForm.addEventListener('change', e => {
  if (e.target.name === 'pet') renderCalcServices();
  calc();
});
renderCalcServices();
calc();
$('#calcBook').addEventListener('click', () => {
  prefill({ service: calcSummary.service, price: `${calcSummary.from}–${calcSummary.to} грн` });
});

/* ---------- Лінія між етапами малюється при скролі ---------- */
const stepsList = $('#stepsList');
function drawStepsLine() {
  const r = stepsList.getBoundingClientRect();
  const p = Math.min(Math.max((innerHeight * 0.8 - r.top) / (innerHeight * 0.4), 0), 1);
  stepsList.style.setProperty('--p', p);
}

/* ---------- Слайдери «До / Після» ---------- */
$$('[data-ba]').forEach(ba => {
  const set = clientX => {
    const r = ba.getBoundingClientRect();
    const pos = Math.min(Math.max((clientX - r.left) / r.width, 0.03), 0.97);
    ba.style.setProperty('--pos', pos * 100 + '%');
  };
  let drag = false;
  ba.addEventListener('pointerdown', e => { drag = true; ba.classList.add('is-drag'); ba.setPointerCapture(e.pointerId); set(e.clientX); });
  ba.addEventListener('pointermove', e => { if (drag) set(e.clientX); });
  ['pointerup', 'pointercancel'].forEach(ev => ba.addEventListener(ev, () => { drag = false; ba.classList.remove('is-drag'); }));
  if (finePointer) ba.addEventListener('mousemove', e => { if (!drag) set(e.clientX); });

  // підказка: повзунок сам «гойдається» при першій появі
  if (!reduceMotion) {
    const hint = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      hint.disconnect();
      const keys = [50, 25, 75, 50];
      const start = performance.now() + 500;
      (function tick(now) {
        const t = Math.min(Math.max((now - start) / 1800, 0), 1);
        const seg = Math.min(Math.floor(t * 3), 2);
        const lt = t * 3 - seg;
        const ease = lt < .5 ? 2 * lt * lt : 1 - Math.pow(-2 * lt + 2, 2) / 2;
        if (!drag) ba.style.setProperty('--pos', keys[seg] + (keys[seg + 1] - keys[seg]) * ease + '%');
        if (t < 1) requestAnimationFrame(tick);
      })(performance.now());
    }, { threshold: 0.6 });
    hint.observe(ba);
  }
});

/* ---------- Нескінченна стрічка відгуків ---------- */
const track = $('.marquee__track');
track.innerHTML += track.innerHTML;
$$('.review', track).slice(track.children.length / 2).forEach(r => r.setAttribute('aria-hidden', 'true'));

/* ---------- Галерея: стрілки, перетягування, лайтбокс ---------- */
(function gallery() {
  const g = $('#galleryTrack');
  const step = () => g.querySelector('.gallery__item').offsetWidth + 20;
  $$('.gallery__arrows .arrow').forEach(b => b.addEventListener('click', () => g.scrollBy({ left: step() * b.dataset.dir, behavior: 'smooth' })));

  let down = false, startX = 0, startScroll = 0, moved = 0;
  g.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    down = true; moved = 0; startX = e.clientX; startScroll = g.scrollLeft;
  });
  addEventListener('pointermove', e => {
    if (!down) return;
    moved = Math.abs(e.clientX - startX);
    if (moved > 5) g.classList.add('is-drag');
    g.scrollLeft = startScroll - (e.clientX - startX);
  });
  addEventListener('pointerup', () => { down = false; g.classList.remove('is-drag'); });

  const lb = $('#lightbox');
  const lbImg = $('img', lb);
  $$('.gallery__item', g).forEach(item => item.addEventListener('click', e => {
    if (moved > 5) { e.preventDefault(); return; }
    lbImg.src = item.dataset.full;
    lbImg.alt = $('img', item).alt;
    lb.hidden = false;
  }));
  lb.addEventListener('click', e => { if (e.target !== lbImg) lb.hidden = true; });
})();

/* ---------- Дата «до кінця місяця» ---------- */
(function monthEnd() {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const txt = last.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
  $$('[data-month-end]').forEach(el => { el.textContent = txt; });
})();

/* ---------- Передзаповнення форми з кнопок ---------- */
const form = $('#bookingForm');
function flash(field) {
  const f = field.closest('.field');
  f.classList.remove('is-flash');
  void f.offsetWidth;
  f.classList.add('is-flash');
}
function prefill({ service, master, price }) {
  if (service) {
    const opt = [...form.service.options].find(o => o.text === service);
    if (opt) { form.service.value = opt.value || opt.text; setTimeout(() => flash(form.service), 700); }
  }
  if (master) { form.master.value = master; setTimeout(() => flash(form.master), 700); }
  form.price.value = price || '';
}
$$('[data-service], [data-master]').forEach(a => a.addEventListener('click', () => {
  prefill({ service: a.dataset.service, master: a.dataset.master });
}));

/* ---------- Маска телефону ---------- */
function phoneMask(input) {
  input.addEventListener('focus', () => { if (!input.value) input.value = '+380 '; });
  input.addEventListener('input', () => {
    let d = input.value.replace(/\D/g, '');
    if (!d.startsWith('380')) d = '380' + d.replace(/^3?8?0?/, '');
    d = d.slice(0, 12);
    const p = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)];
    let out = '+' + p[0];
    if (p[1]) out += ' (' + p[1];
    if (p[2]) out += ') ' + p[2];
    if (p[3]) out += '-' + p[3];
    if (p[4]) out += '-' + p[4];
    input.value = out;
  });
}
const phoneOk = v => v.replace(/\D/g, '').length === 12;
$$('input[type="tel"]').forEach(phoneMask);

/* ---------- Відправка заявок ---------- */
async function send(data) {
  if (!CONFIG.endpoint) {
    console.info('[Демо] Заявка:', data);
    return new Promise(r => setTimeout(r, 600));
  }
  const res = await fetch(CONFIG.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Помилка відправки');
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  let ok = true;
  [form.elements.name, form.phone].forEach(inp => {
    const bad = inp === form.phone ? !phoneOk(inp.value) : !inp.value.trim();
    inp.closest('.field').classList.toggle('is-error', bad);
    if (bad) ok = false;
  });
  if (!ok) { form.querySelector('.is-error input').focus(); return; }
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Надсилаємо…';
  try {
    await send({ form: 'Запис на грумінг', ...Object.fromEntries(new FormData(form)) });
    form.classList.add('is-sent');
    confetti();
  } catch {
    btn.textContent = 'Не вдалося. Спробуйте ще раз';
  } finally {
    btn.disabled = false;
    if (!form.classList.contains('is-sent')) setTimeout(() => { btn.textContent = 'Записатися на грумінг'; }, 2500);
  }
});

/* ---------- Попап при спробі піти (лише ПК, один раз за сесію) ---------- */
(function popup() {
  const pop = $('#popup');
  const pf = $('#popupForm');
  let seen = false;
  try { seen = sessionStorage.getItem('pb-popup') === '1'; } catch {}
  const open = () => {
    if (seen || form.classList.contains('is-sent')) return;
    seen = true;
    try { sessionStorage.setItem('pb-popup', '1'); } catch {}
    pop.hidden = false;
  };
  const close = () => { pop.hidden = true; };
  if (finePointer) {
    setTimeout(() => document.addEventListener('mouseout', e => {
      if (!e.relatedTarget && e.clientY < 10) open();
    }), 8000);
  }
  pop.addEventListener('click', e => { if (e.target === pop || e.target.closest('.popup__close')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { close(); $('#lightbox').hidden = true; } });
  pf.addEventListener('submit', async e => {
    e.preventDefault();
    const inp = pf.phone;
    if (!phoneOk(inp.value)) { inp.focus(); inp.style.borderColor = '#E57368'; return; }
    await send({ form: 'Попап −10%', phone: inp.value });
    $('.popup__card').innerHTML = '<div class="popup__paw">🎉</div><h3>Знижку закріплено!</h3><p>Передзвонимо протягом 10 хвилин.</p>';
    confetti();
    setTimeout(close, 2600);
  });
})();

/* ---------- Конфеті з лапок ---------- */
function confetti() {
  if (reduceMotion) return;
  const c = $('#confetti');
  const ctx = c.getContext('2d');
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const icons = ['🐾', '🐶', '🐱', '💚', '✨'];
  const parts = Array.from({ length: 70 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 200,
    y: innerHeight * .55,
    vx: (Math.random() - .5) * 14,
    vy: -Math.random() * 16 - 6,
    r: Math.random() * 360,
    vr: (Math.random() - .5) * 12,
    s: 16 + Math.random() * 16,
    i: icons[Math.floor(Math.random() * icons.length)],
  }));
  const start = performance.now();
  (function frame(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach(p => {
      p.vy += .45; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r * Math.PI / 180);
      ctx.font = `${p.s}px serif`; ctx.fillText(p.i, -p.s / 2, p.s / 2); ctx.restore();
    });
    if (now - start < 2600) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(start);
}

/* ---------- Рік у футері ---------- */
$('#year').textContent = new Date().getFullYear();

/* Перший розрахунок стану шапки/прогресу — після оголошення всіх функцій */
onScroll();
