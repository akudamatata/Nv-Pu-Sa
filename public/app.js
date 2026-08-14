/**
 * Nv-Pu-Sa (X-Archive) v2 - Client Application & React-Bits Motion Engine
 * Synthesized: Karpathy (Discrete Column Masonry) · UI-UX-Pro-Max (OLED/Light) · Impeccable (Native Badge & Frameless Modal) · React-Bits (Slot Machine Shuffle) · Better-Icons
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==================== Sample Data for Instant Preview ====================
  const defaultSampleData = [
    {
      "id": "1280938963541221376",
      "screen_name": "afukadou7",
      "name": "阿芙卡豆",
      "avatar_url": "https://pbs.twimg.com/profile_images/2033912326085349377/WEkPM9t7_400x400.jpg",
      "cover_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      "followers_count": 102939,
      "description": "阿芙卡豆 | 官方指路 💓 TG & Fansone 专属记录页，分享日常与数码生活。https://fansone.co/afuka",
      "verified": true,
      "category": "Design & Lifestyle",
      "backed_up_at": "2026-08-11T15:21:30.336Z"
    },
    {
      "id": "15354924",
      "screen_name": "sama",
      "name": "Sam Altman",
      "avatar_url": "https://pbs.twimg.com/profile_images/1605336338520281088/8p7c1m-b_400x400.jpg",
      "cover_url": "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80",
      "followers_count": 3240000,
      "description": "CEO at OpenAI. Working on AGI to benefit all of humanity. https://openai.com",
      "verified": true,
      "category": "AI & Tech",
      "backed_up_at": "2026-08-11T16:00:00.000Z"
    },
    {
      "id": "33838201",
      "screen_name": "karpathy",
      "name": "Andrej Karpathy",
      "avatar_url": "https://pbs.twimg.com/profile_images/1799516629949603840/z0HquzC__400x400.jpg",
      "cover_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
      "followers_count": 1120000,
      "description": "Building Eureka Labs. Formerly OpenAI and Tesla AI lead. Passionate about LLMs, deep learning and education. https://eurekalabs.ai",
      "verified": true,
      "category": "AI Research",
      "backed_up_at": "2026-08-11T16:05:00.000Z"
    },
    {
      "id": "1157097323",
      "screen_name": "levelsio",
      "name": "Pieter Levels",
      "avatar_url": "https://pbs.twimg.com/profile_images/1783777553942007808/3Z__tM50_400x400.jpg",
      "cover_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
      "followers_count": 542000,
      "description": "Indie hacker. Building Nomad List, Remote OK, PhotoAI, and Interior AI. Shipping fast as a solo founder. https://levels.io",
      "verified": true,
      "category": "Indie Hacker",
      "backed_up_at": "2026-08-11T16:10:00.000Z"
    },
    {
      "id": "14499829",
      "screen_name": "ylecun",
      "name": "Yann LeCun",
      "avatar_url": "https://pbs.twimg.com/profile_images/1498642738902507523/wU2a74cE_400x400.jpg",
      "cover_url": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80",
      "followers_count": 890000,
      "description": "Chief AI Scientist at Meta. Professor at NYU. Turing Award Laureate for Deep Learning. https://yann.lecun.com",
      "verified": true,
      "category": "AI Research",
      "backed_up_at": "2026-08-11T16:15:00.000Z"
    },
    {
      "id": "96135824",
      "screen_name": "gregkamradt",
      "name": "Greg Kamradt",
      "avatar_url": "https://pbs.twimg.com/profile_images/1614761011884392451/7fHlO12T_400x400.jpg",
      "cover_url": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80",
      "followers_count": 185000,
      "description": "Building AI data tools & benchmarks. Needle in a Haystack evaluation creator. Exploring LLM capabilities.",
      "verified": false,
      "category": "AI & Data",
      "backed_up_at": "2026-08-11T16:20:00.000Z"
    }
  ];

  // SVG Icon Templates (Iconify / Lucide Standard)
  const ICONS = {
    verifiedNative: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>`,
    users: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    external: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    eye: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`
  };

  // ==================== 1. Canvas Starfield Particles Background ====================
  function initCanvasParticles() {
    const canvas = document.getElementById('bg-particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const numParticles = Math.min(Math.floor((width * height) / 24000), 45);
    const particles = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 0.6,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 105) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - dist / 105) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(render);
    }

    render();
  }

  initCanvasParticles();

  // ==================== 2. State Store (Default Theme: OLED) ====================
  const PAGE_SIZE = 12;
  const state = {
    rawUsers: [],
    filteredUsers: [],
    renderedCount: 0,
    columnElements: [],
    spotlightUser: null,
    currentFilter: 'all',
    currentSort: 'followers-desc',
    currentView: 'grid', // 'grid' | 'compact' | 'list'
    currentTheme: localStorage.getItem('x_archive_v2_theme') || 'oled',
    searchQuery: '',
    isShuffling: false,
    isLoadingMore: false
  };

  const fallbackCovers = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80'
  ];

  // DOM Elements Cache
  const htmlRoot = document.documentElement;
  const bloggerWall = document.getElementById('blogger-wall');
  const emptyStateDb = document.getElementById('empty-state-db');
  const emptyStateSearch = document.getElementById('empty-state-search');
  const infiniteSentinel = document.getElementById('infinite-scroll-sentinel');
  const btnLoadSampleData = document.getElementById('btn-load-sample-data');
  const globalSearch = document.getElementById('global-search');
  const searchClearBtn = document.getElementById('search-clear-btn');
  
  // Hero & Stats
  const statTotalChip = document.getElementById('stat-total-chip');
  const statVerifiedChip = document.getElementById('stat-verified-chip');
  const statMaxChip = document.getElementById('stat-max-chip');
  const heroSpotlightCard = document.getElementById('hero-spotlight-card');
  const spotlightContent = document.getElementById('spotlight-dynamic-content');
  const btnShuffleSpotlight = document.getElementById('btn-shuffle-spotlight');

  // Filter Pills & Badges
  const filterPills = document.querySelectorAll('.f-pill');
  const badgeCountAll = document.getElementById('badge-count-all');
  const badgeCountVerified = document.getElementById('badge-count-verified');
  const badgeCountRecent = document.getElementById('badge-count-recent');
  const resultsCountText = document.getElementById('results-count-text');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  // Sort Menu
  const sortTriggerBtn = document.getElementById('sort-trigger-btn');
  const sortMenu = document.getElementById('sort-menu');
  const sortCurrentText = document.getElementById('sort-current-text');
  const sortMenuItems = document.querySelectorAll('.select-dropdown-menu .menu-item');

  // View Switchers
  const viewTabs = document.querySelectorAll('.view-tab-btn');

  // Pure Icon Dual-Theme Toggle Button
  const themeBtn = document.getElementById('theme-btn');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const themeIconMoon = document.getElementById('theme-icon-moon');

  // Lucky Pick Frameless Roulette Modal Elements
  const btnLuckyPick = document.getElementById('btn-lucky-pick');
  const rouletteBackdrop = document.getElementById('random-roulette-backdrop');
  const rouletteCardContainer = document.getElementById('roulette-card-container');
  const rouletteBanner = document.getElementById('roulette-banner');
  const rouletteAvatar = document.getElementById('roulette-avatar');
  const rouletteTag = document.getElementById('roulette-tag');
  const rouletteName = document.getElementById('roulette-name');
  const rouletteVerified = document.getElementById('roulette-verified');
  const rouletteHandle = document.getElementById('roulette-handle');
  const rouletteBio = document.getElementById('roulette-bio');
  const rouletteOutsideActions = document.getElementById('roulette-outside-actions');
  const rouletteDismissHint = document.getElementById('roulette-dismiss-hint');
  const btnReshuffleAgain = document.getElementById('btn-reshuffle-again');
  const btnRouletteVisit = document.getElementById('btn-roulette-visit');

  // Standard Inspector Drawer (for regular card click)
  const inspectorBackdrop = document.getElementById('inspector-backdrop');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerBody = document.getElementById('drawer-body-content');
  const toastContainer = document.getElementById('toast-container');

  // ==================== 3. React-Bits Motion Modules ====================

  function animateCountUp(element, endVal, duration = 1000, isPercent = false, isFollowers = false) {
    if (!element) return;
    const startVal = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Math.floor(startVal + (endVal - startVal) * easeProgress);

      if (isPercent) {
        element.textContent = `${currentVal}%`;
      } else if (isFollowers) {
        element.textContent = formatFollowers(currentVal);
      } else {
        element.textContent = currentVal.toLocaleString();
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        if (isPercent) element.textContent = `${endVal}%`;
        else if (isFollowers) element.textContent = formatFollowers(endVal);
        else element.textContent = endVal.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  }

  function triggerClickSpark(e, sparkCount = 12, color = 'var(--accent-spark)') {
    const x = e ? (e.clientX || window.innerWidth / 2) : window.innerWidth / 2;
    const y = e ? (e.clientY || window.innerHeight / 2) : window.innerHeight / 2;

    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement('div');
      spark.className = 'click-spark-particle';

      const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.5;
      const distance = 35 + Math.random() * 40;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const size = 3 + Math.random() * 4;

      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.backgroundColor = color;
      spark.style.boxShadow = `0 0 12px ${color}`;
      spark.style.setProperty('--dx', `${dx}px`);
      spark.style.setProperty('--dy', `${dy}px`);

      document.body.appendChild(spark);

      setTimeout(() => spark.remove(), 650);
    }
  }

  function triggerLuxuryCelebrationFireworks(originElement) {
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;

    if (originElement) {
      const rect = originElement.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
    }

    const colors = [
      '#f59e0b', // Luxury Gold
      '#fbbf24', // Amber
      '#38bdf8', // Electric Cyan
      '#ec4899', // Cyber Pink
      '#a855f7', // Purple Neon
      '#ffffff', // Diamond Sparkle
      '#10b981'  // Emerald
    ];

    const shapes = ['star', 'diamond', 'circle', 'ribbon'];
    const particleCount = 52;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'celebration-burst-particle';

      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.45;
      const distance = 85 + Math.random() * 240;
      const vx = Math.cos(angle) * distance;
      const vy = Math.sin(angle) * distance - (35 + Math.random() * 45); // Natural pop with upward velocity

      const duration = 0.95 + Math.random() * 0.75;
      const rotMid = `${(Math.random() - 0.5) * 360}deg`;
      const rotLate = `${(Math.random() - 0.5) * 720}deg`;
      const rotEnd = `${(Math.random() - 0.5) * 1080}deg`;

      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.style.setProperty('--vx', `${vx}px`);
      p.style.setProperty('--vy', `${vy}px`);
      p.style.setProperty('--duration', `${duration}s`);
      p.style.setProperty('--rot-mid', rotMid);
      p.style.setProperty('--rot-late', rotLate);
      p.style.setProperty('--rot-end', rotEnd);
      p.style.color = color;

      if (shape === 'star') {
        p.classList.add('celebration-star-particle');
        const size = 12 + Math.random() * 10;
        p.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      } else if (shape === 'diamond') {
        p.classList.add('celebration-star-particle');
        const size = 10 + Math.random() * 8;
        p.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><polygon points="12 2 22 12 12 22 2 12"/></svg>`;
      } else if (shape === 'ribbon') {
        p.classList.add('celebration-confetti-ribbon');
        const w = 5 + Math.random() * 5;
        const h = 10 + Math.random() * 10;
        p.style.width = `${w}px`;
        p.style.height = `${h}px`;
        p.style.backgroundColor = color;
      } else {
        const size = 6 + Math.random() * 6;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.borderRadius = '50%';
        p.style.backgroundColor = color;
        p.style.boxShadow = `0 0 12px ${color}, 0 0 22px ${color}`;
      }

      document.body.appendChild(p);

      setTimeout(() => {
        p.remove();
      }, duration * 1000 + 100);
    }
  }

  function attachSpotlightEffect(cardElement) {
    if (!cardElement) return;
    cardElement.classList.add('spotlight-interactive');

    cardElement.addEventListener('mousemove', (e) => {
      const rect = cardElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cardElement.style.setProperty('--mouse-x', `${x}px`);
      cardElement.style.setProperty('--mouse-y', `${y}px`);
    });
  }

  function attach3DTilt(element, maxTilt = 7) {
    if (!element) return;
    element.classList.add('tilt-card-wrap');

    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      element.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  }

  if (heroSpotlightCard) {
    attachSpotlightEffect(heroSpotlightCard);
    attach3DTilt(heroSpotlightCard, 6);
  }

  // ==================== 4. Pure Icon Dual-Theme Toggle Engine (OLED by Default) ====================
  function applyTheme(theme) {
    state.currentTheme = theme === 'light' ? 'light' : 'oled';
    htmlRoot.setAttribute('data-theme', state.currentTheme);
    localStorage.setItem('x_archive_v2_theme', state.currentTheme);

    if (state.currentTheme === 'light') {
      themeIconSun?.classList.remove('hidden');
      themeIconMoon?.classList.add('hidden');
      themeBtn?.setAttribute('title', '当前: 清爽浅色 · 点击切换为纯黑极简 (OLED) [快捷键: T]');
    } else {
      themeIconSun?.classList.add('hidden');
      themeIconMoon?.classList.remove('hidden');
      themeBtn?.setAttribute('title', '当前: 纯黑极简 · 点击切换为清爽浅色 (Light) [快捷键: T]');
    }
  }

  themeBtn?.addEventListener('click', (e) => {
    triggerClickSpark(e, 8, 'var(--accent-primary)');
    const nextTheme = state.currentTheme === 'oled' ? 'light' : 'oled';
    applyTheme(nextTheme);
    showToast(`已切换至 ${nextTheme === 'light' ? '清爽浅色' : '纯黑极简 (OLED)'} 模式`);
  });

  applyTheme(state.currentTheme);

  // Close Sort menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!sortMenu?.contains(e.target) && !sortTriggerBtn?.contains(e.target)) {
      sortMenu?.classList.add('hidden');
    }
  });

  // ==================== 5. Fetch Archive Data ====================
  async function initArchiveData() {
    try {
      const res = await fetch('/api/archive');
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        state.rawUsers = json.data;
        if (json.data.length > 0) {
          localStorage.setItem('x_archive_cached_data', JSON.stringify(json.data));
        } else {
          localStorage.removeItem('x_archive_cached_data');
        }
      } else {
        fallbackToLocalStorage();
      }
    } catch (err) {
      console.warn('[v2 Engine] API fetch fallback to localStorage:', err);
      fallbackToLocalStorage();
    }

    updateHeroAndMetrics();
    pickSpotlightCreator();
    applyFilterAndSort();
  }

  function fallbackToLocalStorage() {
    const cached = localStorage.getItem('x_archive_cached_data');
    if (cached) {
      try {
        const list = JSON.parse(cached);
        if (Array.isArray(list) && list.length > 0) {
          state.rawUsers = list;
        }
      } catch (e) {}
    }
  }

  btnLoadSampleData?.addEventListener('click', (e) => {
    triggerClickSpark(e, 14, 'var(--accent-gold)');
    state.rawUsers = defaultSampleData;
    localStorage.setItem('x_archive_cached_data', JSON.stringify(defaultSampleData));
    updateHeroAndMetrics();
    pickSpotlightCreator();
    applyFilterAndSort();
    showToast('已成功载入样例博主数据进行画廊体验！');
  });

  // ==================== 6. Metrics & Hero Spotlight ====================
  function formatFollowers(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function updateHeroAndMetrics() {
    const total = state.rawUsers.length;
    animateCountUp(statTotalChip, total, 1000);

    if (total === 0) {
      statVerifiedChip.textContent = '0%';
      statMaxChip.textContent = '0';
      badgeCountAll.textContent = '0';
      badgeCountVerified.textContent = '0';
      if (badgeCountRecent) badgeCountRecent.textContent = '0';
      return;
    }

    const verifiedCount = state.rawUsers.filter(u => u.verified).length;
    const verifiedPercent = Math.round((verifiedCount / total) * 100);
    animateCountUp(statVerifiedChip, verifiedPercent, 1200, true);

    const maxFollowers = Math.max(...state.rawUsers.map(u => u.followers_count || 0));
    animateCountUp(statMaxChip, maxFollowers, 1400, false, true);

    // 计算 7 天内最新归档的博主数
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 3600 * 1000;
    const recentCount = state.rawUsers.filter(u => {
      if (!u.backed_up_at) return false;
      const t = new Date(u.backed_up_at).getTime();
      return !isNaN(t) && (now - t) <= sevenDaysMs;
    }).length;

    badgeCountAll.textContent = total.toString();
    badgeCountVerified.textContent = verifiedCount.toString();
    if (badgeCountRecent) badgeCountRecent.textContent = (recentCount || Math.min(total, 5)).toString();
  }

  function resolveMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('/api/media') || url.startsWith('data:') || url.startsWith('/')) {
      return url;
    }
    if (url.includes('twimg.com')) {
      return `/api/media?url=${encodeURIComponent(url)}`;
    }
    return url;
  }

  function pickSpotlightCreator() {
    if (state.rawUsers.length === 0) {
      spotlightContent.innerHTML = `
        <div style="padding: 6px 0; color: var(--text-secondary); font-size: 13px; line-height: 1.6;">
          <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">准备好探索精选博主了吗？</div>
          <div>在控制台配置 Cookie 并点击一键同步后，此处将为您自动推送主页优质创作者。</div>
        </div>
      `;
      return;
    }

    const candidates = state.rawUsers.filter(u => u.followers_count >= 50000 || u.verified);
    const pool = candidates.length > 0 ? candidates : state.rawUsers;
    const randomUser = pool[Math.floor(Math.random() * pool.length)];

    renderSpotlightCard(randomUser);
  }

  function renderSpotlightCard(user) {
    const rawAvatar = user.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    const avatar = resolveMediaUrl(rawAvatar);
    const isTopTier = (user.followers_count >= 500000);
    const tag = isTopTier ? 'Top Creator' : 'Creator';

    spotlightContent.innerHTML = `
      <div class="spotlight-avatar-wrap" onclick="window.open('https://x.com/${user.screen_name}', '_blank')">
        <img class="spotlight-avatar" src="${avatar}" alt="${escapeHtml(user.name)}" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';">
        ${user.verified ? `<div class="badge-verified-native" style="bottom: 2px; right: 2px;" title="Twitter 官方认证">${ICONS.verifiedNative}</div>` : ''}
      </div>
      <div class="spotlight-meta">
        <div class="spotlight-name-row">
          <span class="spotlight-name" title="${escapeHtml(user.name)}">${escapeHtml(user.name)}</span>
          <span class="card-influence-pill ${isTopTier ? 'top-tier' : ''}">${escapeHtml(tag)}</span>
        </div>
        <a class="spotlight-handle" href="https://x.com/${user.screen_name}" target="_blank">@${escapeHtml(user.screen_name)} · ${formatFollowers(user.followers_count)} 关注</a>
        <div class="spotlight-bio-snippet">${formatBioWithLinks(user.description)}</div>
      </div>
    `;
  }

  btnShuffleSpotlight?.addEventListener('click', (e) => {
    triggerClickSpark(e, 12, 'var(--accent-primary)');
    pickSpotlightCreator();
  });

  // ==================== 7. Filtering & Sorting Engine ====================
  function applyFilterAndSort() {
    const query = state.searchQuery.trim().toLowerCase();

    state.filteredUsers = state.rawUsers.filter(user => {
      const matchesQuery = !query ||
        (user.screen_name && user.screen_name.toLowerCase().includes(query)) ||
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.description && user.description.toLowerCase().includes(query));

      let matchesFilter = true;
      if (state.currentFilter === 'verified') {
        matchesFilter = !!user.verified;
      } else if (state.currentFilter === 'top') {
        matchesFilter = (user.followers_count || 0) >= 500000;
      } else if (state.currentFilter === '100k') {
        matchesFilter = (user.followers_count || 0) >= 100000;
      } else if (state.currentFilter === 'recent') {
        matchesFilter = true;
      }

      return matchesQuery && matchesFilter;
    });

    state.filteredUsers.sort((a, b) => {
      if (state.currentSort === 'recent' || state.currentFilter === 'recent') {
        const timeA = a.backed_up_at ? new Date(a.backed_up_at).getTime() : 0;
        const timeB = b.backed_up_at ? new Date(b.backed_up_at).getTime() : 0;
        if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
          return timeB - timeA;
        }
        return (b.id || '').toString().localeCompare((a.id || '').toString());
      } else if (state.currentSort === 'followers-desc') {
        return (b.followers_count || 0) - (a.followers_count || 0);
      } else if (state.currentSort === 'followers-asc') {
        return (a.followers_count || 0) - (b.followers_count || 0);
      } else if (state.currentSort === 'name-asc') {
        return (a.name || a.screen_name).localeCompare(b.name || b.screen_name);
      }
      return 0;
    });

    resultsCountText.textContent = `共呈现 ${state.filteredUsers.length} 位博主归档`;
    
    // Reset columns and start fresh render
    state.renderedCount = 0;
    initMasonryStructure();
    renderMoreCards();
  }

  function setSortMenuSelection(sortVal, sortText) {
    state.currentSort = sortVal;
    if (sortCurrentText) sortCurrentText.textContent = sortText;
    sortMenuItems.forEach(item => {
      const match = item.getAttribute('data-val') === sortVal;
      item.classList.toggle('active', match);
      item.querySelector('.check-icon')?.classList.toggle('hidden', !match);
    });
  }

  globalSearch?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    searchClearBtn.classList.toggle('hidden', !state.searchQuery);
    applyFilterAndSort();
  });

  searchClearBtn?.addEventListener('click', () => {
    globalSearch.value = '';
    state.searchQuery = '';
    searchClearBtn.classList.add('hidden');
    globalSearch.focus();
    applyFilterAndSort();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.currentFilter = pill.getAttribute('data-filter');

      // 点击“最新归档”时自动按时间最近排序，点击其余所有选项（全部/蓝标/Top头部/知名创作者）默认按粉丝数从高到低排序
      if (state.currentFilter === 'recent') {
        setSortMenuSelection('recent', '归档时间最近');
      } else {
        setSortMenuSelection('followers-desc', '粉丝数从高到低');
      }

      applyFilterAndSort();
    });
  });

  btnResetFilters?.addEventListener('click', (e) => {
    triggerClickSpark(e, 8, 'var(--accent-primary)');
    globalSearch.value = '';
    state.searchQuery = '';
    searchClearBtn.classList.add('hidden');
    state.currentFilter = 'all';
    filterPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-filter') === 'all'));
    setSortMenuSelection('followers-desc', '粉丝数从高到低');
    applyFilterAndSort();
    showToast('已重置所有筛选条件');
  });

  sortTriggerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    sortMenu.classList.toggle('hidden');
  });

  sortMenuItems.forEach(item => {
    item.addEventListener('click', () => {
      const val = item.getAttribute('data-val');
      const txt = item.querySelector('span').textContent;

      setSortMenuSelection(val, txt);
      sortMenu.classList.add('hidden');
      applyFilterAndSort();
    });
  });

  viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      viewTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentView = tab.getAttribute('data-view');
      state.renderedCount = 0;
      initMasonryStructure();
      renderMoreCards();
    });
  });

  // ==================== 8. Karpathy Discrete Column Masonry Engine (Zero Layout Shifting) ====================
  function initMasonryStructure() {
    bloggerWall.innerHTML = '';
    bloggerWall.className = `blogger-wall ${state.currentView}-view`;
    state.columnElements = [];

    if (state.currentView === 'list') {
      // List view is a single vertical container
      state.columnElements = [bloggerWall];
    } else {
      // Grid view: 3 discrete columns; Compact: 4 discrete columns
      const numCols = state.currentView === 'compact' ? 4 : 3;
      for (let i = 0; i < numCols; i++) {
        const col = document.createElement('div');
        col.className = 'masonry-column';
        bloggerWall.appendChild(col);
        state.columnElements.push(col);
      }
    }
  }

  function renderMoreCards() {
    if (state.rawUsers.length === 0) {
      emptyStateDb?.classList.remove('hidden');
      emptyStateSearch?.classList.add('hidden');
      infiniteSentinel?.classList.add('hidden');
      return;
    }
    emptyStateDb?.classList.add('hidden');

    if (state.filteredUsers.length === 0) {
      emptyStateSearch?.classList.remove('hidden');
      infiniteSentinel?.classList.add('hidden');
      return;
    }
    emptyStateSearch?.classList.add('hidden');

    const totalFiltered = state.filteredUsers.length;
    const startIndex = state.renderedCount;
    const endIndex = Math.min(startIndex + PAGE_SIZE, totalFiltered);

    if (startIndex >= totalFiltered) {
      infiniteSentinel?.classList.add('hidden');
      return;
    }

    if (state.columnElements.length === 0) {
      initMasonryStructure();
    }

    // Surgical Incremental Append: Append new card directly into shortest column without disturbing existing cards
    for (let i = startIndex; i < endIndex; i++) {
      const user = state.filteredUsers[i];
      const card = createBloggerCardElement(user, i);

      if (state.currentView === 'list') {
        bloggerWall.appendChild(card);
      } else {
        // Find column with minimum height
        let shortestCol = state.columnElements[0];
        let minHeight = shortestCol.offsetHeight;

        for (let c = 1; c < state.columnElements.length; c++) {
          const col = state.columnElements[c];
          if (col.offsetHeight < minHeight) {
            minHeight = col.offsetHeight;
            shortestCol = col;
          }
        }
        shortestCol.appendChild(card);
      }
    }

    state.renderedCount = endIndex;

    if (state.renderedCount < totalFiltered) {
      infiniteSentinel?.classList.remove('hidden');
    } else {
      infiniteSentinel?.classList.add('hidden');
    }
  }

  function createBloggerCardElement(user, idx) {
    const card = document.createElement('div');
    card.className = 'blogger-card';
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');
    card.style.animationDelay = `${Math.min(idx * 20, 250)}ms`;

    const rawAvatar = user.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    const avatarSrc = resolveMediaUrl(rawAvatar);
    
    let rawCover = user.cover_url || '';
    if (rawCover && rawCover.includes('pbs.twimg.com/profile_banners') && !rawCover.match(/\/(600x200|1500x500|responsive_web)$/)) {
      rawCover = rawCover.replace(/\/+$/, '') + '/600x200';
    }
    const coverSrc = rawCover ? resolveMediaUrl(rawCover) : fallbackCovers[idx % fallbackCovers.length];

    const isTopTier = (user.followers_count >= 500000);
    const tierTag = isTopTier ? 'Top Creator' : 'Creator';
    const formattedBio = formatBioWithLinks(user.description);

    card.innerHTML = `
      <div class="card-header-banner" style="background-image: url('${coverSrc}');"></div>
      <div class="card-main-content">
        <div class="card-avatar-row">
          <div class="card-avatar-wrap">
            <img class="card-avatar-img" src="${avatarSrc}" alt="${escapeHtml(user.name)}" loading="lazy" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';">
            ${user.verified ? `<div class="badge-verified-native" title="Twitter 官方认证">${ICONS.verifiedNative}</div>` : ''}
          </div>
        </div>

        <div class="card-user-info">
          <div class="card-name-row">
            <span class="card-user-name" title="${escapeHtml(user.name)}">${escapeHtml(user.name)}</span>
            <span class="card-influence-pill ${isTopTier ? 'top-tier' : ''}">${escapeHtml(tierTag)}</span>
          </div>
          <a class="card-user-handle" href="https://x.com/${user.screen_name}" target="_blank" onclick="event.stopPropagation();">@${escapeHtml(user.screen_name)}</a>
          <div class="card-metrics-chip">
            ${ICONS.users}
            <span>${formatFollowers(user.followers_count)} 关注者</span>
          </div>
        </div>

        <div class="card-bio-content">${formattedBio}</div>
      </div>

      <div class="card-action-footer">
        <button class="btn-inspect-profile" type="button">
          ${ICONS.eye}
          <span>档案详情</span>
        </button>
        <a class="btn-visit-x" href="https://x.com/${user.screen_name}" target="_blank" onclick="event.stopPropagation();">
          <span>访问 X</span>
          ${ICONS.external}
        </a>
      </div>
    `;

    attachSpotlightEffect(card);

    card.addEventListener('click', () => openInspectorDrawer(user));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openInspectorDrawer(user);
    });

    return card;
  }

  // Infinite Scroll Listener
  window.addEventListener('scroll', () => {
    if (state.isLoadingMore) return;
    if (state.renderedCount >= state.filteredUsers.length) return;

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
      state.isLoadingMore = true;
      setTimeout(() => {
        renderMoreCards();
        state.isLoadingMore = false;
      }, 150);
    }
  });

  // ==================== 9. Frameless Slot Machine Decelerating Random Roulette Modal ====================
  function startRandomRouletteShuffle() {
    if (state.rawUsers.length === 0) {
      showToast('归档库中暂无博主数据，请先同步或载入样例数据');
      return;
    }

    if (state.isShuffling) return;
    state.isShuffling = true;

    // Open center frameless modal
    rouletteBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Hide actions during shuffle
    rouletteOutsideActions?.classList.remove('is-visible');
    rouletteDismissHint?.classList.remove('is-visible');

    rouletteCardContainer.classList.remove('is-settled');
    rouletteCardContainer.classList.add('is-shuffling');

    const pool = state.rawUsers;
    
    // 30+ Frames Realistic Slot Machine Deceleration Curve:
    // Phase 1: High-speed dash (20 frames, ~28ms each, dazzling motion blur)
    // Phase 2: Deceleration braking (9 frames, physical brake stagger)
    const dashFrames = Array(20).fill(28);
    const brakingFrames = [45, 70, 110, 165, 240, 340, 470, 620, 800];
    const delays = [...dashFrames, ...brakingFrames];
    let stepIndex = 0;

    // Pick final target winner
    const winnerIndex = Math.floor(Math.random() * pool.length);
    const winnerUser = pool[winnerIndex];

    function nextShuffleStep() {
      const tempUser = pool[Math.floor(Math.random() * pool.length)];
      renderRouletteCardPreview(tempUser, false);

      if (stepIndex < delays.length) {
        const delay = delays[stepIndex];
        stepIndex++;
        setTimeout(nextShuffleStep, delay);
      } else {
        finalizeRouletteWinner(winnerUser);
      }
    }

    nextShuffleStep();
  }

  function renderRouletteCardPreview(user, isFinal) {
    const rawAvatar = user.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    const avatarSrc = resolveMediaUrl(rawAvatar);
    let rawCover = user.cover_url || fallbackCovers[0];
    if (rawCover.includes('pbs.twimg.com/profile_banners') && !rawCover.match(/\/(600x200|1500x500|responsive_web)$/)) {
      rawCover = rawCover.replace(/\/+$/, '') + '/600x200';
    }
    const coverSrc = resolveMediaUrl(rawCover);

    const isTopTier = (user.followers_count >= 500000);
    const tierTag = isTopTier ? 'Top Creator' : 'Creator';

    rouletteBanner.style.backgroundImage = `url('${coverSrc}')`;
    rouletteAvatar.src = avatarSrc;
    rouletteTag.className = `card-influence-pill ${isTopTier ? 'top-tier' : ''}`;
    rouletteTag.textContent = tierTag;
    rouletteName.textContent = user.name;
    rouletteVerified.style.display = user.verified ? 'flex' : 'none';
    rouletteHandle.textContent = `@${user.screen_name} · ${formatFollowers(user.followers_count)} 关注者`;
    rouletteBio.innerHTML = formatBioWithLinks(user.description);
    btnRouletteVisit.href = `https://x.com/${user.screen_name}`;
  }

  function finalizeRouletteWinner(user) {
    renderRouletteCardPreview(user, true);
    rouletteCardContainer.classList.remove('is-shuffling');
    rouletteCardContainer.classList.add('is-settled');
    state.isShuffling = false;

    // Trigger Luxury Celebration Fireworks & Starburst Burst around the winning card
    triggerLuxuryCelebrationFireworks(rouletteCardContainer);

    // Reveal outside action buttons gracefully upon complete stop
    setTimeout(() => {
      rouletteOutsideActions?.classList.add('is-visible');
      rouletteDismissHint?.classList.add('is-visible');
    }, 140);

    showToast(`抽取命中：@${user.screen_name}`);
  }

  function closeRouletteModal() {
    if (state.isShuffling) return;
    rouletteBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }

  btnLuckyPick?.addEventListener('click', (e) => {
    triggerClickSpark(e, 10, 'var(--accent-spark)');
    startRandomRouletteShuffle();
  });

  btnReshuffleAgain?.addEventListener('click', (e) => {
    triggerClickSpark(e, 10, 'var(--accent-spark)');
    startRandomRouletteShuffle();
  });

  rouletteBackdrop?.addEventListener('click', (e) => {
    if (e.target === rouletteBackdrop) closeRouletteModal();
  });

  // ==================== 10. Inspector Detail Drawer (Manual card inspector) ====================
  function openInspectorDrawer(user) {
    const rawAvatar = user.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    const avatar = resolveMediaUrl(rawAvatar);
    const rawCover = user.cover_url || fallbackCovers[0];
    const cover = resolveMediaUrl(rawCover);
    const isTop = (user.followers_count >= 500000);

    drawerBody.innerHTML = `
      <div style="height: 140px; border-radius: var(--radius-md); background: url('${cover}') center/cover no-repeat; border: 1px solid var(--border-subtle); position: relative;">
        <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 100%); border-radius: var(--radius-md);"></div>
      </div>

      <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-top: -40px; position: relative; padding: 0 8px;">
        <div style="position: relative; overflow: visible;">
          <img src="${avatar}" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--bg-elevated); box-shadow: var(--shadow-md); background: var(--bg-surface); object-fit: cover;">
          ${user.verified ? `<div class="badge-verified-native" style="bottom: 2px; right: 2px; width: 22px; height: 22px;" title="Twitter 官方认证">${ICONS.verifiedNative}</div>` : ''}
        </div>
        <span class="card-influence-pill ${isTop ? 'top-tier' : ''}" style="font-size: 12px;">${isTop ? 'Top 头部创作者' : '精选创作者'}</span>
      </div>

      <div>
        <h2 id="drawer-user-name" style="font-size: 20px; font-weight: 800; color: var(--text-main); line-height: 1.2;">${escapeHtml(user.name)}</h2>
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
          <span style="font-family: var(--font-mono); color: var(--accent-primary); font-size: 14px;">@${escapeHtml(user.screen_name)}</span>
          <button id="btn-copy-handle" style="padding: 2px 8px; font-size: 11px; background: var(--bg-chip); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-muted); cursor: pointer;" title="复制 @ID">
            复制 ID
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 12px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); text-align: center;">
        <div>
          <div style="font-size: 15px; font-weight: 700; font-family: var(--font-mono); color: var(--text-main);">${formatFollowers(user.followers_count)}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">粉丝数</div>
        </div>
        <div>
          <div style="font-size: 15px; font-weight: 700; font-family: var(--font-mono); color: ${user.verified ? '#1d9bf0' : 'var(--text-muted)'};">${user.verified ? '已认证' : '未认证'}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">蓝标状态</div>
        </div>
        <div>
          <div style="font-size: 15px; font-weight: 700; font-family: var(--font-mono); color: var(--text-main);">${user.backed_up_at ? new Date(user.backed_up_at).toLocaleDateString() : '已收录'}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">收录时间</div>
        </div>
      </div>

      <div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">博主简介 (Bio)</div>
        <div style="padding: 14px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); font-size: 14px; line-height: 1.6; color: var(--text-secondary);">
          ${formatBioWithLinks(user.description)}
        </div>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 10px;">
        <a href="https://x.com/${user.screen_name}" target="_blank" style="flex: 1; padding: 12px; background: var(--accent-primary); color: #000000; font-weight: 700; font-size: 14px; border-radius: var(--radius-full); text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: var(--shadow-glow);">
          <span>前往 X 个人主页</span>
          ${ICONS.external}
        </a>
      </div>
    `;

    document.getElementById('btn-copy-handle')?.addEventListener('click', () => {
      navigator.clipboard.writeText(`@${user.screen_name}`);
      showToast(`已复制 @${user.screen_name} 到剪贴板`);
    });

    inspectorBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeInspectorDrawer() {
    inspectorBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }

  drawerCloseBtn?.addEventListener('click', closeInspectorDrawer);
  inspectorBackdrop?.addEventListener('click', (e) => {
    if (e.target === inspectorBackdrop) closeInspectorDrawer();
  });

  // ==================== 11. Toast Notification System ====================
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
      <span style="color: var(--accent-primary); display: flex; align-items: center;">${ICONS.verifiedNative}</span>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 220);
    }, 2400);
  }

  // ==================== 12. Utilities ====================
  function formatBioWithLinks(text) {
    if (!text) return '暂无个人简介';
    let safe = escapeHtml(text);
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    return safe.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" onclick="event.stopPropagation();">${url} ↗</a>`;
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  // ==================== 13. Global Keyboard Shortcuts ====================
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== globalSearch) {
      e.preventDefault();
      globalSearch.focus();
    }
    if (e.key === 'Escape') {
      if (!rouletteBackdrop.classList.contains('hidden')) {
        closeRouletteModal();
      } else if (!inspectorBackdrop.classList.contains('hidden')) {
        closeInspectorDrawer();
      } else if (document.activeElement === globalSearch) {
        globalSearch.blur();
      }
    }
    if ((e.key === 'r' || e.key === 'R') && document.activeElement !== globalSearch) {
      e.preventDefault();
      startRandomRouletteShuffle();
    }
    if (document.activeElement !== globalSearch) {
      if (e.key === '1') document.querySelector('[data-view="grid"]')?.click();
      if (e.key === '2') document.querySelector('[data-view="compact"]')?.click();
      if (e.key === '3') document.querySelector('[data-view="list"]')?.click();
      if (e.key === 't' || e.key === 'T') {
        const nextTheme = state.currentTheme === 'oled' ? 'light' : 'oled';
        applyTheme(nextTheme);
        showToast(`已切换至 ${nextTheme === 'light' ? '清爽浅色' : '纯黑极简 (OLED)'} 模式`);
      }
    }
  });

  // Start initialization
  initArchiveData();

});
