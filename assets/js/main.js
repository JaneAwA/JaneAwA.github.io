/* ============================================================
   极简 ADB 工具箱 · 交互脚本
   下载链接集中在这里配置：当前指向 GitHub Releases v1.2.0
   的 Windows 安装包；如需更换版本，修改下方 CONFIG 即可。
   ============================================================ */
(function () {
  'use strict';

  const CONFIG = {
    owner: 'JaneAwA',
    repo: 'JaneAwA.github.io',
    branch: 'main',
    downloadDir: 'downloads',
    // Windows 版安装包托管在 GitHub Releases v1.2.0
    useReleases: true
  };

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------- 下载链接 ---------- */
  function downloadURL(file) {
    if (CONFIG.useReleases) {
      return `https://github.com/${CONFIG.owner}/${CONFIG.repo}/releases/latest/download/${file}`;
    }
    return `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${CONFIG.downloadDir}/${encodeURIComponent(file)}`;
  }

  const toastEl = $('#toast');
  let toastTimer;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  $$('[data-file]').forEach((link) => {
    const file = link.getAttribute('data-file');
    link.href = downloadURL(file);

    // 检测文件是否已上传：未上传时给出友好提示，而不是跳到 404 页面
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    fetch(link.href, { method: 'HEAD', signal: controller.signal, cache: 'no-store' })
      .then((res) => {
        clearTimeout(timeout);
        if (!res.ok) link.dataset.state = 'missing';
      })
      .catch(() => {
        clearTimeout(timeout);
        // 网络异常时保留按钮可用，避免误判
      });

    link.addEventListener('click', (e) => {
      if (link.dataset.state === 'missing') {
        e.preventDefault();
        toast('安装包还未上传，请稍后再来 🌿');
      }
    });
  });

  /* ---------- 入场动画 ---------- */
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !REDUCED) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach((el) => io.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add('in'));
  }

  /* ---------- 视差滚动 ---------- */
  const depthEls = $$('[data-depth]');
  const parallaxEls = $$('[data-parallax]');
  const topbar = $('#topbar');
  let ticking = false;

  function updateScroll() {
    const y = window.scrollY || window.pageYOffset;

    if (topbar) topbar.classList.toggle('scrolled', y > 24);

    if (!REDUCED) {
      depthEls.forEach((el) => {
        const depth = parseFloat(el.dataset.depth) || 0.1;
        el.style.transform = `translate3d(0, ${(-y * depth).toFixed(1)}px, 0)`;
      });
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
      });
    }
    ticking = false;
  }

  function requestScrollUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateScroll);
      ticking = true;
    }
  }
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  updateScroll();

  /* ---------- 鼠标视差 / 卡片光泽 ---------- */
  const appWindow = $('#appWindow');
  const heroVisual = $('.hero-visual');

  if (!REDUCED && window.matchMedia('(pointer: fine)').matches) {
    if (heroVisual && appWindow) {
      heroVisual.addEventListener('mousemove', (e) => {
        const r = heroVisual.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        appWindow.style.transform = `rotateY(${(px * 7).toFixed(2)}deg) rotateX(${(-py * 6).toFixed(2)}deg) translateZ(18px)`;
        $$('.float-chip', heroVisual).forEach((chip, i) => {
          const d = (i === 0 ? 16 : -14);
          chip.style.marginLeft = `${(px * d).toFixed(1)}px`;
          chip.style.marginTop = `${(py * d).toFixed(1)}px`;
        });
      });
      heroVisual.addEventListener('mouseleave', () => {
        appWindow.style.transform = '';
        $$('.float-chip', heroVisual).forEach((chip) => {
          chip.style.marginLeft = '';
          chip.style.marginTop = '';
        });
      });
    }

    $$('.feature-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
        card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
      });
    });
  }

  /* ---------- 终端打字动画 ---------- */
  const typed = $('#typed');
  const commands = [
    'adb devices',
    'adb install -r app.apk',
    'adb logcat --pid=2048',
    'adb shell screencap /sdcard/shot.png'
  ];
  if (typed && !REDUCED) {
    let ci = 0, pos = 0, deleting = false;
    function typeStep() {
      const current = commands[ci];
      if (deleting) {
        pos--;
        typed.textContent = current.slice(0, pos);
        if (pos <= 0) { deleting = false; ci = (ci + 1) % commands.length; }
      } else {
        pos++;
        typed.textContent = current.slice(0, pos);
        if (pos >= current.length) { deleting = true; setTimeout(typeStep, 1600); return; }
      }
      setTimeout(typeStep, deleting ? 32 : 62);
    }
    setTimeout(typeStep, 900);
  }

  /* ---------- 导航高亮 ---------- */
  const sections = ['home', 'features', 'workflow', 'download'].map((id) => document.getElementById(id)).filter(Boolean);
  const navLinks = $$('.nav-links a');
  if ('IntersectionObserver' in window && sections.length) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach((s) => navIO.observe(s));
  }
})();
