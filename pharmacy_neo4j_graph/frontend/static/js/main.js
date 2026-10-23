/**
 * PHARMA Care & Inventory - Main UI Controller
 * Toast notifications, modal utilities, and global AJAX helpers
 */

// Toast notification manager
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `saas-toast ${type}`;
  
  let icon = 'fa-check-circle text-success';
  if (type === 'error') icon = 'fa-exclamation-circle text-danger';
  if (type === 'warning') icon = 'fa-exclamation-triangle text-warning';
  
  toast.innerHTML = `
    <i class="fas ${icon} fa-lg"></i>
    <div style="flex:1;">${message}</div>
    <button type="button" class="btn-close" style="font-size:10px;" onclick="this.parentElement.remove()"></button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}

// Global quick search filter for table views
function setupTableSearch(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;

  input.addEventListener('keyup', function () {
    const filter = this.value.toLowerCase();
    const rows = table.getElementsByTagName('tr');
    
    for (let i = 1; i < rows.length; i++) {
      const text = rows[i].textContent.toLowerCase();
      rows[i].style.display = text.includes(filter) ? '' : 'none';
    }
  });
}

// Format number as Indian Rupee string
function formatINR(val) {
  return '₹' + parseFloat(val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ============================================================================
// REAL-TIME OPERATIONAL NOTIFICATION CENTER
// ============================================================================
let allNotificationItems = [];
let activeNotifFilter = 'all';

function filterNotifications(category, btnEl) {
  activeNotifFilter = category;
  document.querySelectorAll('.notif-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  if (btnEl) {
    btnEl.classList.add('active');
  }
  renderNotificationList();
}

function renderNotificationList() {
  const container = document.getElementById('notif-items-container');
  if (!container) return;

  let filtered = allNotificationItems;
  if (activeNotifFilter === 'danger') {
    filtered = allNotificationItems.filter(it => it.severity === 'danger');
  } else if (activeNotifFilter !== 'all') {
    filtered = allNotificationItems.filter(it => it.category === activeNotifFilter);
  }

  if (filtered.length === 0) {
    const filterLabels = {
      all: 'operational alerts',
      danger: 'critical priority alerts',
      stock: 'low stock alerts',
      expiry: 'expiry alerts',
      orders: 'logistics alerts'
    };
    const label = filterLabels[activeNotifFilter] || 'alerts';
    container.innerHTML = `
      <div class="text-center py-5 small">
        <div class="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style="width: 52px; height: 52px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">
          <i class="fas fa-check-circle fs-3"></i>
        </div>
        <div class="text-white fw-bold fs-6">No Active ${label}</div>
        <div class="text-muted mt-1 px-4" style="color: #94a3b8 !important;">All monitored parameters in this category are operating within safe clinical thresholds.</div>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(it => {
    const severity = it.severity || 'info';
    
    // Status Badge styling
    let badgeStyle = '';
    if (severity === 'danger') {
      badgeStyle = 'background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4);';
    } else if (severity === 'warning') {
      badgeStyle = 'background: rgba(245, 158, 11, 0.2); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.4);';
    } else {
      badgeStyle = 'background: rgba(13, 148, 136, 0.2); color: #99f6e4; border: 1px solid rgba(13, 148, 136, 0.4);';
    }

    // High-contrast solid Action buttons
    let btnBg = '';
    let btnIcon = '';
    if (severity === 'danger') {
      btnBg = 'background: #dc2626; color: #ffffff !important; border: none;';
      btnIcon = it.category === 'expiry' ? 'fa-biohazard' : 'fa-plus';
    } else if (severity === 'warning') {
      btnBg = 'background: #d97706; color: #ffffff !important; border: none;';
      btnIcon = 'fa-boxes';
    } else {
      btnBg = 'background: #0d9488; color: #ffffff !important; border: none;';
      btnIcon = 'fa-truck';
    }
    
    html += `
      <div class="notif-item-card ${severity} d-flex justify-content-between align-items-center gap-3">
        <div style="flex: 1; min-width: 0;">
          <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
            <span class="badge px-2 py-0.5 rounded fw-bold" style="${badgeStyle} font-size: 10px; letter-spacing: 0.4px;">${it.badge}</span>
            <span class="fw-bold text-white fs-6" style="word-break: break-word; letter-spacing: -0.2px;">${it.title}</span>
          </div>
          <div style="color: #cbd5e1; font-size: 12.5px; line-height: 1.45; margin-top: 3px;">
            ${it.message}
          </div>
          <div class="d-flex align-items-center gap-2.5 mt-2" style="font-size: 11.5px;">
            <span style="color: #94a3b8; font-weight: 500;"><i class="far fa-clock me-1 text-teal"></i>${it.timestamp}</span>
            <span class="badge border px-2 py-0.5 rounded text-uppercase" style="background: rgba(255, 255, 255, 0.08); color: #94a3b8; border-color: rgba(255, 255, 255, 0.1) !important; font-size: 9.5px; font-weight: 600;">${it.category}</span>
          </div>
        </div>
        <div class="flex-shrink-0">
          <a href="${it.link}" class="btn btn-sm px-3 py-1.5 rounded-pill text-nowrap fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm" style="${btnBg} font-size: 12px;">
            <i class="fas ${btnIcon} small"></i>
            <span>${it.action_label}</span>
            <i class="fas fa-arrow-right" style="font-size: 10px;"></i>
          </a>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

async function loadNotifications(showFeedback = false) {
  const badge = document.getElementById('notif-badge-counter');
  const subtitle = document.getElementById('notif-subtitle');
  const icon = document.getElementById('notif-refresh-icon');

  if (icon) icon.classList.add('fa-spin');

  try {
    const res = await fetch('/api/notifications');
    const json = await res.json();
    if (!json.success || !json.data) return;

    const data = json.data;
    const count = data.total_count || 0;
    const dangerCount = data.danger_count || 0;
    allNotificationItems = data.items || [];

    // Update Counts in Filter Tabs
    const elAll = document.getElementById('notif-count-all');
    const elDanger = document.getElementById('notif-count-danger');
    const elStock = document.getElementById('notif-count-stock');
    const elExpiry = document.getElementById('notif-count-expiry');
    const elOrders = document.getElementById('notif-count-orders');

    if (elAll) elAll.textContent = count;
    if (elDanger) elDanger.textContent = dangerCount;
    if (elStock) elStock.textContent = (data.counts_by_category && data.counts_by_category.stock) || 0;
    if (elExpiry) elExpiry.textContent = (data.counts_by_category && data.counts_by_category.expiry) || 0;
    if (elOrders) elOrders.textContent = (data.counts_by_category && data.counts_by_category.orders) || 0;

    // Update Badge on Bell Icon
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.className = `position-absolute top-0 start-100 translate-middle badge rounded-pill shadow-sm ${dangerCount > 0 ? 'bg-danger' : 'bg-warning text-dark'}`;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    // Update Subtitle with high-contrast text
    if (subtitle) {
      if (dangerCount > 0) {
        subtitle.innerHTML = `<span class="badge bg-danger text-white px-1.5 py-0.5 rounded-pill me-1" style="font-size: 10px;">ACTION</span> <span class="fw-semibold" style="color: #f87171;">${count} active alerts (${dangerCount} critical require attention)</span>`;
      } else {
        subtitle.innerHTML = `<span class="fw-medium" style="color: #94a3b8;">${count} active alerts across network</span>`;
      }
    }

    // Render Items
    renderNotificationList();

    if (showFeedback) {
      showToast('Notifications refreshed successfully.', 'success');
    }
  } catch (err) {
    console.error('Failed to load notifications:', err);
  } finally {
    if (icon) icon.classList.remove('fa-spin');
  }
}

// ============================================================================
// GLOBAL COMMAND PALETTE (⌘K / Ctrl+K)
// ============================================================================
let paletteDebounceTimer = null;
let paletteActiveIndex = -1;

function openCommandPalette() {
  const modalEl = document.getElementById('commandPaletteModal');
  if (!modalEl) return;
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

async function performCommandSearch(query = '') {
  const container = document.getElementById('commandPaletteResults');
  if (!container) return;
  
  try {
    const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (!json.success || !json.data) return;
    
    const results = json.data;
    paletteActiveIndex = -1;
    
    if (results.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted small">
          <i class="fas fa-search-minus fs-4 mb-2 d-block opacity-50"></i>
          No matching records or actions found for "<span class="text-light">${query}</span>".
        </div>
      `;
      return;
    }
    
    let html = '';
    results.forEach((item, index) => {
      html += `
        <a href="${item.url}" class="palette-result-item" data-index="${index}" data-url="${item.url}">
          <div class="item-icon">
            <i class="${item.icon}"></i>
          </div>
          <div class="flex-grow-1 text-truncate">
            <div class="d-flex align-items-center gap-2">
              <span class="item-title">${item.title}</span>
              <span class="badge ${item.badge_color} small" style="font-size: 9px; padding: 2px 6px;">${item.badge}</span>
            </div>
            <div class="item-subtitle text-truncate">${item.subtitle}</div>
          </div>
          <div class="text-muted small">
            <i class="fas fa-arrow-turn-down fa-rotate-90 text-light opacity-50"></i>
          </div>
        </a>
      `;
    });
    container.innerHTML = html;

    const items = container.querySelectorAll('.palette-result-item');
    items.forEach((el, idx) => {
      el.addEventListener('mouseenter', () => {
        highlightPaletteIndex(idx);
      });
    });

    if (items.length > 0) {
      highlightPaletteIndex(0);
    }
  } catch (err) {
    console.error('Failed to perform command palette search:', err);
  }
}

function highlightPaletteIndex(index) {
  const container = document.getElementById('commandPaletteResults');
  if (!container) return;
  const items = container.querySelectorAll('.palette-result-item');
  if (items.length === 0) return;

  paletteActiveIndex = (index + items.length) % items.length;
  items.forEach((el, idx) => {
    if (idx === paletteActiveIndex) {
      el.classList.add('active');
      el.scrollIntoView({ block: 'nearest' });
    } else {
      el.classList.remove('active');
    }
  });
}

function initCommandPalette() {
  const modalEl = document.getElementById('commandPaletteModal');
  const inputEl = document.getElementById('commandPaletteInput');
  if (!modalEl || !inputEl) return;

  // Shortcut ⌘K / Ctrl+K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      if (modalEl.classList.contains('show')) {
        modal.hide();
      } else {
        modal.show();
      }
    }
  });

  // When opened, focus input and preload static suggestions
  modalEl.addEventListener('shown.bs.modal', () => {
    inputEl.focus();
    inputEl.select();
    performCommandSearch(inputEl.value.trim());
  });

  // Input listener with debounce
  inputEl.addEventListener('input', (e) => {
    clearTimeout(paletteDebounceTimer);
    paletteDebounceTimer = setTimeout(() => {
      performCommandSearch(e.target.value.trim());
    }, 150);
  });

  // Keyboard navigation inside input
  inputEl.addEventListener('keydown', (e) => {
    const container = document.getElementById('commandPaletteResults');
    if (!container) return;
    const items = container.querySelectorAll('.palette-result-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightPaletteIndex(paletteActiveIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightPaletteIndex(paletteActiveIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (paletteActiveIndex >= 0 && items[paletteActiveIndex]) {
        const url = items[paletteActiveIndex].getAttribute('data-url');
        if (url) window.location.href = url;
      }
    }
  });
}

// ============================================================================
// SIDEBAR SCROLL PERSISTENCE & POSITION SYNC
// ============================================================================
function initSidebarScrollPersistence() {
  const sb = document.querySelector('.sidebar-scrollable');
  if (!sb) return;

  const STORAGE_KEY = 'pharma_sidebar_scroll_top';

  // 1. Restore scroll position
  const savedPos = sessionStorage.getItem(STORAGE_KEY);
  if (savedPos !== null) {
    sb.scrollTop = parseInt(savedPos, 10);
  }

  // 2. Ensure active item is comfortably in viewport
  setTimeout(() => {
    const activeLink = sb.querySelector('.nav-item-link.active');
    if (activeLink) {
      const sbRect = sb.getBoundingClientRect();
      const activeRect = activeLink.getBoundingClientRect();
      const isVisible = (
        activeRect.top >= sbRect.top + 10 &&
        activeRect.bottom <= sbRect.bottom - 10
      );
      if (!isVisible) {
        activeLink.scrollIntoView({ block: 'center', behavior: 'auto' });
        sessionStorage.setItem(STORAGE_KEY, sb.scrollTop);
      }
    }
  }, 40);

  // 3. Continuously record user scroll
  let scrollDebounce = null;
  sb.addEventListener('scroll', () => {
    clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, sb.scrollTop);
    }, 50);
  }, { passive: true });

  // 4. Save scroll position synchronously on click
  sb.querySelectorAll('.nav-item-link').forEach(link => {
    link.addEventListener('click', () => {
      sessionStorage.setItem(STORAGE_KEY, sb.scrollTop);
    });
  });
}

// ============================================================================
// THEME MANAGER (DARK / LIGHT MODE)
// ============================================================================
function getStoredTheme() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('theme')) {
    const t = urlParams.get('theme');
    if (t === 'light' || t === 'dark') {
      return t;
    }
  }
  return localStorage.getItem('pharma_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function setTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    root.classList.add('dark-theme');
    root.classList.add('dark-mode');
  } else {
    root.classList.remove('dark-theme');
    root.classList.remove('dark-mode');
  }
  localStorage.setItem('pharma_theme', theme);
  updateThemeUI(theme);
  
  // Broadcast theme change event for charts or components that re-render
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: theme } }));
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getStoredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  if (typeof showToast === 'function') {
    showToast(next === 'dark' ? '🌙 Dark Mode Activated' : '☀️ Light Mode Activated', 'info');
  }
}

function updateThemeUI(theme) {
  const moonIcon = document.querySelector('.theme-icon-moon');
  const sunIcon = document.querySelector('.theme-icon-sun');
  const toggleBtn = document.getElementById('themeToggleBtn');
  
  if (moonIcon && sunIcon) {
    if (theme === 'dark') {
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'inline-block';
    } else {
      moonIcon.style.display = 'inline-block';
      sunIcon.style.display = 'none';
    }
  }

  if (toggleBtn) {
    if (theme === 'dark') {
      toggleBtn.title = 'Switch to Light Mode';
      toggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
      toggleBtn.title = 'Switch to Dark Mode';
      toggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
    }
  }

  // Also sync any settings page options if present
  document.querySelectorAll('[data-theme-choice]').forEach(el => {
    if (el.getAttribute('data-theme-choice') === theme) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

function initTheme() {
  const theme = getStoredTheme();
  setTheme(theme);

  // Listen to system OS preference changes if no manual override
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('pharma_theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Dynamically adapt Chart.js charts to theme toggles
  window.addEventListener('themeChanged', e => {
    const isDark = e.detail && e.detail.theme === 'dark';
    if (window.Chart) {
      Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
      if (Chart.instances) {
        Object.values(Chart.instances).forEach(chart => {
          if (chart.options && chart.options.scales) {
            Object.values(chart.options.scales).forEach(scale => {
              if (scale.grid) {
                scale.grid.color = isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9';
              }
              if (scale.ticks) {
                scale.ticks.color = isDark ? '#94a3b8' : '#64748b';
              }
            });
          }
          try { chart.update(); } catch (err) {}
        });
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[*] PHARMA Care & Inventory SaaS Frontend Loaded');
  // Initialize Theme (Dark/Light)
  initTheme();
  // Initialize sidebar scroll state
  initSidebarScrollPersistence();
  // Initialize live notifications
  loadNotifications();
  // Poll every 30 seconds
  setInterval(loadNotifications, 30000);
  // Initialize Command Palette
  initCommandPalette();
});



