import '@google/model-viewer';

// ── DOM refs ──
const splash = document.getElementById('splash');
const btnBegin = document.getElementById('btn-begin');
const appEl = document.getElementById('app');
const mv = document.getElementById('mv');
const topBanner = document.getElementById('top-banner');
const btnInvite = document.getElementById('btn-invite');
const btnAR = document.getElementById('btn-ar');
const invitationCard = document.getElementById('invitation-card');
const btnBackAR = document.getElementById('btn-back-ar');
const btnRSVP = document.getElementById('btn-rsvp');

// ── Begin → reveal the 3D viewer ──
btnBegin.addEventListener('click', () => {
  splash.style.transition = 'opacity 0.6s';
  splash.style.opacity = '0';
  setTimeout(() => splash.classList.add('hidden'), 600);
  appEl.classList.remove('hidden');
  // model-viewer lazy-loads; dismiss the banner after a few seconds
  setTimeout(() => topBanner.classList.add('fade'), 6000);
});

// Allow skipping the splash via ?auto=1 (used for quick previews/testing)
if (new URLSearchParams(location.search).has('auto')) {
  setTimeout(() => btnBegin.click(), 50);
}

// ── AR availability: hide/adjust the AR button if unsupported ──
mv.addEventListener('load', () => {
  if (!mv.canActivateAR) {
    btnAR.textContent = '🔄 Spin & Explore in 3D';
    btnAR.classList.add('no-ar');
    btnAR.addEventListener('click', (e) => {
      e.preventDefault();
      // No native AR (e.g. desktop) — just nudge the model
      mv.cameraOrbit = '45deg 75deg 5m';
    });
  }
});

mv.addEventListener('ar-status', (e) => {
  if (e.detail.status === 'session-started') topBanner.classList.add('fade');
  if (e.detail.status === 'failed') {
    topBanner.classList.remove('fade');
    topBanner.querySelector('span').textContent = '⚠ AR couldn’t start — explore in 3D instead';
  }
});

// ── Guided camera tour ──
const VIEWS = {
  couple: { target: '0m 1.0m 2.0m', orbit: '0deg 88deg 3.2m', fov: '40deg' },
  inside: { target: '0m 1.3m -0.6m', orbit: '0deg 90deg 2.6m', fov: '50deg' },
  invite: { target: '0m 1.55m -1.5m', orbit: '0deg 90deg 2.7m', fov: '42deg' },
  full:   { target: '0m 1.3m 0.2m', orbit: '0deg 74deg 9m', fov: '36deg' },
};
const tourBar = document.getElementById('tour-bar');
tourBar.addEventListener('click', (e) => {
  const btn = e.target.closest('.tour-btn');
  if (!btn) return;
  const v = VIEWS[btn.dataset.view];
  if (!v) return;
  // Stop auto-rotate so the framed view holds, except on "Full View"
  if (btn.dataset.view === 'full') mv.setAttribute('auto-rotate', '');
  else mv.removeAttribute('auto-rotate');
  mv.cameraTarget = v.target;
  mv.cameraOrbit = v.orbit;
  mv.fieldOfView = v.fov;
  tourBar.querySelectorAll('.tour-btn').forEach((b) => b.classList.toggle('active', b === btn));
  topBanner.classList.add('fade');
});

// ── Invitation card ──
btnInvite.addEventListener('click', () => invitationCard.classList.remove('hidden'));
btnBackAR.addEventListener('click', () => invitationCard.classList.add('hidden'));

// ── RSVP via WhatsApp ──
btnRSVP.addEventListener('click', () => {
  const msg = encodeURIComponent(
    '🌸 Namaskara! Accepting your kind invitation with joy! 🙏\n' +
    "We'll be there to bless Shreya & Shravan! 💛\n#ShreyaWedsShravan"
  );
  window.open(`https://wa.me/?text=${msg}`, '_blank');
});
