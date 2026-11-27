/* ============================================================
   极简 ADB 工具箱 · 交互脚本
   下载链接集中在这里配置：当前指向 GitHub Releases v1.2.1
   的 Windows 安装包；如需更换版本，修改下方 CONFIG 即可。
   ============================================================ */
(function () {
  'use strict';

  const CONFIG = {
    owner: 'JaneAwA',
    repo: 'ADB-Toolbox-Source',
    branch: 'main',
    downloadDir: 'downloads',
    // Windows 版安装包托管在 GitHub Releases v1.2.1
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

  const mirrorSelect = $('#mirrorSelect');
  const sourceStatus = $('#sourceStatus');
  const STORAGE_KEY = 'adb-toolbox-download-route';
  const downloadLinks = $$('[data-file]');

  function routeLabel(prefix) {
    if (!prefix) return 'GitHub 官方原链接';
    const option = mirrorSelect && Array.from(mirrorSelect.options).find((o) => o.value === prefix);
    return option ? option.textContent.replace('国内镜像 · ', '国内镜像 ') : prefix;
  }

  // 按所选线路拼接下载链接，并记住用户选择
  function applyRoute(showToast) {
    if (!mirrorSelect) return;
    const prefix = mirrorSelect.value;
    downloadLinks.forEach((link) => {
      link.href = prefix + (link.dataset.origin || '');
    });
    if (sourceStatus) sourceStatus.textContent = '当前：' + routeLabel(prefix);
    try { localStorage.setItem(STORAGE_KEY, prefix); } catch (e) { /* 隐私模式下忽略 */ }
    if (showToast) toast('已切换至 ' + routeLabel(prefix));
  }

  if (mirrorSelect) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null && Array.from(mirrorSelect.options).some((o) => o.value === saved)) {
        mirrorSelect.value = saved;
      }
    } catch (e) { /* 隐私模式下忽略 */ }
    mirrorSelect.addEventListener('change', () => applyRoute(true));
  }

  downloadLinks.forEach((link) => {
    const file = link.getAttribute('data-file');
    link.dataset.origin = downloadURL(file);

    // 始终用官方原链接检测文件有效性，避免镜像站跨域影响判断
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    fetch(link.dataset.origin, { method: 'HEAD', signal: controller.signal, cache: 'no-store' })
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

  applyRoute(false);

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
        appWindow.style.transform = `translate3d(${(px * 8).toFixed(1)}px, ${(py * 6).toFixed(1)}px, 0)`;
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
