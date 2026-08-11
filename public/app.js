/**
 * X-Archive Public Showcase Wall Logic (v9.5 - Custom Popover Dropdown Engine)
 */

document.addEventListener('DOMContentLoaded', () => {
  let rawBloggerData = [];
  let filteredData = [];
  let currentCategory = 'all';
  let currentSort = 'followers-desc';
  let isGridView = true;

  const fallbackCovers = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80'
  ];

  // DOM Elements
  const bloggerGrid = document.getElementById('blogger-grid');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');

  // Custom Dropdown Popover Elements
  const sortDropdownTrigger = document.getElementById('sort-dropdown-trigger');
  const sortDropdownMenu = document.getElementById('sort-dropdown-menu');
  const sortSelectedLabel = document.getElementById('sort-selected-label');

  // Pills
  const pillAll = document.getElementById('pill-all');
  const pillVerified = document.getElementById('pill-verified');
  const pill100k = document.getElementById('pill-100k');

  // View switchers
  const btnViewGrid = document.getElementById('btn-view-grid');
  const btnViewList = document.getElementById('btn-view-list');

  // Stat Bento
  const statTotal = document.getElementById('stat-total');
  const statVerified = document.getElementById('stat-verified');
  const statTop = document.getElementById('stat-top');

  // 1. Shortcut '/' to focus search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // 2. Custom Popover Dropdown Interaction (Replacing native HTML select)
  if (sortDropdownTrigger && sortDropdownMenu) {
    sortDropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      sortDropdownMenu.classList.toggle('hidden');
      sortDropdownTrigger.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!sortDropdownMenu.contains(e.target) && !sortDropdownTrigger.contains(e.target)) {
        sortDropdownMenu.classList.add('hidden');
        sortDropdownTrigger.classList.remove('active');
      }
    });

    const dropdownItems = sortDropdownMenu.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
      item.addEventListener('click', () => {
        const val = item.getAttribute('data-value');
        const text = item.querySelector('span').textContent;

        dropdownItems.forEach(i => {
          i.classList.remove('active');
          i.querySelector('.item-check-icon')?.classList.add('hidden');
        });

        item.classList.add('active');
        item.querySelector('.item-check-icon')?.classList.remove('hidden');

        sortSelectedLabel.textContent = text;
        currentSort = val;
        sortDropdownMenu.classList.add('hidden');
        sortDropdownTrigger.classList.remove('active');

        applyFilterAndSort();
      });
    });
  }

  // 3. Fetch Archive Data
  async function loadArchiveData() {
    try {
      const res = await fetch('/api/archive');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        rawBloggerData = json.data;
        updateBentoStats();
        applyFilterAndSort();
      }
    } catch (err) {
      console.warn('获取归档数据网络错误:', err);
    }
  }

  function updateBentoStats() {
    const total = rawBloggerData.length;
    statTotal.textContent = total.toLocaleString();

    if (total === 0) {
      statVerified.textContent = '0%';
      statTop.textContent = '0';
      return;
    }

    const verifiedCount = rawBloggerData.filter(u => u.verified).length;
    const verifiedPercent = Math.round((verifiedCount / total) * 100);
    statVerified.textContent = `${verifiedPercent}%`;

    const maxFollowers = Math.max(...rawBloggerData.map(u => u.followers_count || 0));
    statTop.textContent = formatFollowers(maxFollowers);
  }

  function formatFollowers(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function applyFilterAndSort() {
    const query = searchInput.value.trim().toLowerCase();

    filteredData = rawBloggerData.filter(user => {
      const matchesSearch = !query || 
        (user.screen_name && user.screen_name.toLowerCase().includes(query)) ||
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.description && user.description.toLowerCase().includes(query));

      let matchesPill = true;
      if (currentCategory === 'verified') {
        matchesPill = user.verified;
      } else if (currentCategory === '100k') {
        matchesPill = (user.followers_count || 0) >= 100000;
      }

      return matchesSearch && matchesPill;
    });

    filteredData.sort((a, b) => {
      if (currentSort === 'followers-desc') {
        return (b.followers_count || 0) - (a.followers_count || 0);
      } else if (currentSort === 'followers-asc') {
        return (a.followers_count || 0) - (b.followers_count || 0);
      } else if (currentSort === 'name-asc') {
        return (a.name || a.screen_name).localeCompare(b.name || b.screen_name);
      } else if (currentSort === 'recent') {
        return new Date(b.backed_up_at || 0) - new Date(a.backed_up_at || 0);
      }
      return 0;
    });

    renderGallery();
  }

  function formatBioWithLinks(text) {
    if (!text) return '暂无个人简介';
    
    let safeText = escapeHtml(text);
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    safeText = safeText.replace(urlRegex, function(url) {
      return `<a href="${url}" target="_blank" class="bio-link" onclick="event.stopPropagation();">${url} ↗</a>`;
    });

    return safeText;
  }

  // Render Showcase Cards
  function renderGallery() {
    bloggerGrid.innerHTML = '';

    if (filteredData.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    filteredData.forEach((user, idx) => {
      const card = document.createElement('div');
      card.className = 'blogger-showcase-card';

      const avatarSrc = user.avatar_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
      const coverSrc = user.cover_url || fallbackCovers[idx % fallbackCovers.length];
      const categoryTag = user.category || (user.followers_count > 500000 ? 'Top Creator' : 'Curated Blogger');

      const formattedBio = formatBioWithLinks(user.description);

      card.innerHTML = `
        <div>
          <!-- Banner -->
          <div class="card-banner" style="background-image: url('${coverSrc}');">
            <div class="card-banner-overlay"></div>
          </div>

          <!-- Body -->
          <div class="card-body-content">
            <div class="card-avatar-row">
              <div class="avatar-wrapper-ring">
                <img class="showcase-avatar" src="${avatarSrc}" alt="${escapeHtml(user.name)}" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';">
                ${user.verified ? '<div class="badge-verified-glow" title="蓝标认证">✓</div>' : ''}
              </div>
              <span class="category-tag-pill">${escapeHtml(categoryTag)}</span>
            </div>

            <div class="card-name-title" title="${escapeHtml(user.name)}">${escapeHtml(user.name)}</div>
            <a class="card-handle-str" href="https://x.com/${user.screen_name}" target="_blank">@${escapeHtml(user.screen_name)}</a>

            <div>
              <div class="followers-count-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>${formatFollowers(user.followers_count)} 关注粉丝</span>
              </div>
            </div>

            <div class="card-bio-paragraph">${formattedBio}</div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="card-action-footer">
          <div class="footer-lock-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span>Verified Vault</span>
          </div>
          <a class="btn-visit-profile" href="https://x.com/${user.screen_name}" target="_blank">
            <span>Visit Profile</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </a>
        </div>
      `;

      bloggerGrid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  // Event Handlers
  searchInput.addEventListener('input', applyFilterAndSort);

  // Pills Selection
  [pillAll, pillVerified, pill100k].forEach(pill => {
    pill?.addEventListener('click', (e) => {
      [pillAll, pillVerified, pill100k].forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');

      if (e.currentTarget === pillVerified) currentCategory = 'verified';
      else if (e.currentTarget === pill100k) currentCategory = '100k';
      else currentCategory = 'all';

      applyFilterAndSort();
    });
  });

  btnViewGrid.addEventListener('click', () => {
    isGridView = true;
    btnViewGrid.classList.add('active');
    btnViewList.classList.remove('active');
    bloggerGrid.classList.remove('list-view');
  });

  btnViewList.addEventListener('click', () => {
    isGridView = false;
    btnViewList.classList.add('active');
    btnViewGrid.classList.remove('active');
    bloggerGrid.classList.add('list-view');
  });

  loadArchiveData();
});
