const photos = [
  [6, 'Перевозка внедорожника по трассе', 'Внедорожник на платформе эвакуатора у дорожного ограждения'],
  [8, 'Ночной выезд после ДТП', 'На освещённой платформе ночью стоит автомобиль с повреждённой передней частью'],
  [15, 'Внедорожник на платформе', 'Синий внедорожник на платформе золотистого эвакуатора'],
  [4, 'Погрузка легкового автомобиля', 'Тёмный седан заехал на наклонную платформу'],
  [5, 'Перевозка повреждённой машины', 'Обгоревший кузов внедорожника на эвакуаторе'],
  [16, 'Перевозка спортивного купе', 'Низкое синее купе на платформе рядом с кабиной'],
  [12, 'Эвакуация микроавтобуса ночью', 'Серый микроавтобус на эвакуаторе при свете фонарей'],
  [10, 'Выезд за универсалом', 'Светлый универсал на платформе у частного дома'],
  [7, 'Эвакуация после аварии', 'Повреждённый автомобиль закреплён на платформе у обочины'],
  [11, 'Перевозка седана', 'Седан на платформе у здания'],
  [14, 'Погрузка кроссовера', 'Чёрный кроссовер на опущенной платформе у гаража'],
  [9, 'Эвакуация в городе', 'Светлый седан на платформе эвакуатора на городской улице'],
  [17, 'Перевозка кроссовера', 'Тёмный кроссовер на эвакуаторе в солнечный день'],
  [3, 'Выезд к заправке', 'Эвакуатор с серебристым кроссовером рядом с заправочной станцией'],
  [13, 'Автомобиль на платформе', 'Тёмный автомобиль с закреплёнными колёсами на платформе'],
];

const gallery = document.querySelector('#works');
const cards = [...gallery.querySelectorAll('.gallery-frame')];
const controls = gallery.querySelector('.gallery-controls');
const autoButton = document.querySelector('#autoplay');
const counter = document.querySelector('#counter');
const announcement = document.querySelector('#announcement');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const pictureUrl = id => './assets/job-' + String(id).padStart(2, '0') + '.webp';
let selected = 0;
let autoEnabled = !motionPreference.matches;
let inView = false;
let hovered = false;
let timer = null;
let sequence = 0;
let touchOrigin = null;

function schedule() {
  clearTimeout(timer);
  if (autoEnabled && inView && !hovered && !document.hidden) {
    timer = setTimeout(() => changePhoto(1), 6500);
  }
}

function setAutomatic(enabled) {
  autoEnabled = enabled;
  const label = enabled ? 'Приостановить смену фото' : 'Включить смену фото';
  autoButton.setAttribute('aria-label', label);
  autoButton.title = label;
  autoButton.querySelector('use').setAttribute('href', enabled ? '#pause' : '#play');
  schedule();
}

async function changePhoto(direction, manual = false) {
  if (manual) setAutomatic(false);
  clearTimeout(timer);
  selected = (selected + direction + photos.length) % photos.length;
  const revision = ++sequence;
  const pair = [photos[selected], photos[(selected + 1) % photos.length]];
  await Promise.all(pair.map(async ([id]) => {
    const preload = new Image();
    preload.src = pictureUrl(id);
    try { await preload.decode(); } catch { /* The visible image retains its alt text if loading fails. */ }
  }));
  if (revision !== sequence) return;
  cards.forEach((frame, index) => {
    const [id, caption, alt] = pair[index];
    const image = frame.querySelector('img');
    image.alt = alt;
    image.src = pictureUrl(id);
    frame.querySelector('figcaption').textContent = caption;
    image.classList.remove('picture-change');
    image.style.setProperty('--nudge', direction < 0 ? '-9px' : '9px');
    requestAnimationFrame(() => {
      if (revision === sequence) image.classList.add('picture-change');
    });
  });
  counter.textContent = String(selected + 1).padStart(2, '0') + ' / ' + photos.length;
  if (manual) announcement.textContent = 'Фото ' + (selected + 1) + ' из ' + photos.length + '. ' + pair[0][1];
  schedule();
}

controls.hidden = false;
document.querySelector('#back').addEventListener('click', () => changePhoto(-1, true));
document.querySelector('#forward').addEventListener('click', () => changePhoto(1, true));
autoButton.addEventListener('click', () => setAutomatic(!autoEnabled));
gallery.addEventListener('focusin', event => {
  if (event.target.matches(':focus-visible') && !gallery.contains(event.relatedTarget)) setAutomatic(false);
});
gallery.addEventListener('pointerenter', event => {
  if (event.pointerType === 'mouse') { hovered = true; schedule(); }
});
gallery.addEventListener('pointerleave', () => { hovered = false; schedule(); });
gallery.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  changePhoto(event.key === 'ArrowLeft' ? -1 : 1, true);
});
const photoArea = gallery.querySelector('.gallery-pair');
photoArea.addEventListener('touchstart', event => {
  touchOrigin = event.touches.length === 1 ? event.touches[0] : null;
}, { passive: true });
photoArea.addEventListener('touchcancel', () => { touchOrigin = null; });
photoArea.addEventListener('touchend', event => {
  if (!touchOrigin) return;
  const dx = event.changedTouches[0].clientX - touchOrigin.clientX;
  const dy = event.changedTouches[0].clientY - touchOrigin.clientY;
  touchOrigin = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) changePhoto(dx < 0 ? 1 : -1, true);
}, { passive: true });

setAutomatic(autoEnabled);
motionPreference.addEventListener('change', () => setAutomatic(!motionPreference.matches));
document.addEventListener('visibilitychange', schedule);
if ('IntersectionObserver' in window) {
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    schedule();
  }, { threshold: .35 });
  visibility.observe(photoArea);
  const entrance = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('arrived');
      entrance.unobserve(entry.target);
    }
  }, { threshold: .12 });
  document.querySelectorAll('.section-heading, .price-intro, .price-info, .area-list, .contact-grid').forEach(block => entrance.observe(block));
} else {
  inView = true;
  schedule();
}
