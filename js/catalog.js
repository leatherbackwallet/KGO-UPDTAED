/* Products catalog page — filtering, search, pagination */

let currentFilters = { query: '', occasion: '', category: '', page: 1 };

document.addEventListener('DOMContentLoaded', async () => {
  initMobileMenu();
  highlightActiveNav();
  readFiltersFromUrl();
  await populateFilterDropdowns();
  syncFilterUI();
  await renderPage();
  attachFilterListeners();
});

/* ─── READ FILTERS FROM URL ─── */

function readFiltersFromUrl() {
  currentFilters = {
    query:    getParam('q')        || '',
    occasion: getParam('occasion') || '',
    category: getParam('category') || '',
    page:     parseInt(getParam('page') || '1', 10),
  };
}

/* ─── POPULATE FILTER DROPDOWNS ─── */

async function populateFilterDropdowns() {
  const occasionSelect  = document.getElementById('filter-occasion');
  const categorySelect  = document.getElementById('filter-category');

  if (occasionSelect) {
    const occasions = await getAllOccasions();
    occasionSelect.innerHTML = `<option value="">All Occasions</option>` +
      occasions.map(o => {
        const meta = getOccasionMeta(o);
        return `<option value="${escapeHtml(o)}">${meta.emoji} ${meta.label}</option>`;
      }).join('');
  }

  if (categorySelect) {
    const categories = await getAllCategories();
    categorySelect.innerHTML = `<option value="">All Categories</option>` +
      categories.map(c => `<option value="${escapeHtml(c.key)}">${escapeHtml(c.label)}</option>`).join('');
  }
}

/* ─── SYNC UI TO currentFilters ─── */

function syncFilterUI() {
  const searchInput     = document.getElementById('search-input');
  const occasionSelect  = document.getElementById('filter-occasion');
  const categorySelect  = document.getElementById('filter-category');
  const clearSearchBtn  = document.getElementById('search-clear');

  if (searchInput)    searchInput.value    = currentFilters.query;
  if (occasionSelect) occasionSelect.value = currentFilters.occasion;
  if (categorySelect) categorySelect.value = currentFilters.category;

  if (clearSearchBtn) {
    clearSearchBtn.style.display = currentFilters.query ? 'flex' : 'none';
  }
}

/* ─── RENDER PRODUCTS PAGE ─── */

async function renderPage() {
  const container   = document.getElementById('product-grid');
  const countEl     = document.getElementById('results-count');
  const paginationEl = document.getElementById('pagination');
  const activeFiltersEl = document.getElementById('active-filters');

  if (!container) return;

  renderSkeletons(container);

  const result = await filterProducts(currentFilters);

  if (countEl) {
    countEl.textContent = result.total === 0
      ? 'No products found'
      : `${result.total} product${result.total !== 1 ? 's' : ''}`;
  }

  renderActiveFilterTags(activeFiltersEl);

  if (result.total === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">🔍</div>
        <h3>No products found</h3>
        <p>Try changing your search or filters.</p>
        <button class="btn btn-outline" onclick="clearAllFilters()">Clear all filters</button>
      </div>
    `;
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }

  container.innerHTML = result.items.map(renderProductCard).join('');
  renderPagination(paginationEl, result.page, result.pages);
  updateUrl();
}

/* ─── ACTIVE FILTER TAGS ─── */

function renderActiveFilterTags(container) {
  if (!container) return;
  const tags = [];

  if (currentFilters.query) {
    tags.push({ label: `"${currentFilters.query}"`, clear: () => { currentFilters.query = ''; } });
  }
  if (currentFilters.occasion) {
    const meta = getOccasionMeta(currentFilters.occasion);
    tags.push({ label: `${meta.emoji} ${meta.label}`, clear: () => { currentFilters.occasion = ''; } });
  }
  if (currentFilters.category) {
    const catDef = CONFIG.CATEGORY_KEYWORDS.find(c => c.key === currentFilters.category);
    tags.push({ label: catDef ? catDef.label : currentFilters.category, clear: () => { currentFilters.category = ''; } });
  }

  if (!tags.length) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <div class="active-filters">
      ${tags.map((t, i) => `
        <span class="active-filter-tag">
          ${escapeHtml(t.label)}
          <button onclick="removeFilterTag(${i})" aria-label="Remove filter">✕</button>
        </span>
      `).join('')}
      <button class="clear-all-filters" onclick="clearAllFilters()">Clear all</button>
    </div>
  `;

  // Store removers on window for onclick handlers
  window._filterRemovers = tags.map(t => t.clear);
}

window.removeFilterTag = function(index) {
  if (window._filterRemovers && window._filterRemovers[index]) {
    window._filterRemovers[index]();
    currentFilters.page = 1;
    syncFilterUI();
    renderPage();
  }
};

window.clearAllFilters = function() {
  currentFilters = { query: '', occasion: '', category: '', page: 1 };
  syncFilterUI();
  renderPage();
};

/* ─── PAGINATION ─── */

function renderPagination(container, current, total) {
  if (!container || total <= 1) { if (container) container.innerHTML = ''; return; }

  const range = buildPageRange(current, total);
  container.innerHTML = `
    <div class="pagination">
      <button class="pagination__btn" onclick="goToPage(${current - 1})" ${current === 1 ? 'disabled' : ''}>‹</button>
      ${range.map(p =>
        p === '...'
          ? `<span class="pagination__btn" style="pointer-events:none;border:none;color:var(--color-text-muted)">…</span>`
          : `<button class="pagination__btn ${p === current ? 'active' : ''}" onclick="goToPage(${p})">${p}</button>`
      ).join('')}
      <button class="pagination__btn" onclick="goToPage(${current + 1})" ${current === total ? 'disabled' : ''}>›</button>
    </div>
  `;
}

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range = [1];
  if (current > 3)       range.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) range.push(i);
  if (current < total - 2) range.push('...');
  range.push(total);
  return range;
}

window.goToPage = function(page) {
  currentFilters.page = page;
  renderPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ─── UPDATE URL (without reload) ─── */

function updateUrl() {
  const params = new URLSearchParams();
  if (currentFilters.query)    params.set('q',        currentFilters.query);
  if (currentFilters.occasion) params.set('occasion', currentFilters.occasion);
  if (currentFilters.category) params.set('category', currentFilters.category);
  if (currentFilters.page > 1) params.set('page',     currentFilters.page);
  const qs = params.toString();
  history.replaceState({}, '', `/KGO-UPDTAED/products.html${qs ? '?' + qs : ''}`);
}

/* ─── FILTER EVENT LISTENERS ─── */

function attachFilterListeners() {
  const searchInput    = document.getElementById('search-input');
  const occasionSelect = document.getElementById('filter-occasion');
  const categorySelect = document.getElementById('filter-category');
  const clearSearchBtn = document.getElementById('search-clear');

  if (searchInput) {
    const onSearch = debounce((e) => {
      currentFilters.query = e.target.value.trim();
      currentFilters.page  = 1;
      if (clearSearchBtn) clearSearchBtn.style.display = currentFilters.query ? 'flex' : 'none';
      renderPage();
    }, 350);
    searchInput.addEventListener('input', onSearch);
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentFilters.query = '';
      currentFilters.page  = 1;
      clearSearchBtn.style.display = 'none';
      renderPage();
    });
  }

  if (occasionSelect) {
    occasionSelect.addEventListener('change', (e) => {
      currentFilters.occasion = e.target.value;
      currentFilters.page     = 1;
      renderPage();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      currentFilters.category = e.target.value;
      currentFilters.page     = 1;
      renderPage();
    });
  }
}
