/**
 * UI Module - PastisMap 🥃📍
 * Handles modal dialogues, list item rendering, stats updating, and toast notifications.
 */

const UIModule = (() => {
  
  /**
   * Displays a floating toast notification.
   * @param {string} message 
   * @param {string} type 'success' | 'error' | 'info'
   */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /**
   * Formats price into standard French currency display.
   * @param {number} price 
   * @returns {string}
   */
  function formatPrice(price) {
    return parseFloat(price).toFixed(2) + ' €';
  }

  /**
   * Determines price category class.
   * @param {number} price 
   * @returns {string} 'cheap' | 'mid' | 'expensive'
   */
  function getPriceCategory(price) {
    const p = parseFloat(price);
    if (p <= 2.50) return 'cheap';
    if (p <= 3.50) return 'mid';
    return 'expensive';
  }

  /**
   * Formats ISO Date string to human readable French date.
   * @param {string} isoString 
   * @returns {string}
   */
  function formatDate(isoString) {
    if (!isoString) return 'Date inconnue';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  }

  /**
   * Renders the list of bars in the sidebar.
   * @param {Array} bars 
   * @param {Function} onSelectBar 
   */
  function renderBarsList(bars, onSelectBar) {
    const listContainer = document.getElementById('barsList');
    const barCountBadge = document.getElementById('barCountBadge');

    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (barCountBadge) {
      barCountBadge.textContent = `${bars.length} bar${bars.length > 1 ? 's' : ''}`;
    }

    if (bars.length === 0) {
      listContainer.innerHTML = `
        <div class="loading-spinner">
          <i class="fa-solid fa-ghost fa-2x margin-bottom-md"></i>
          <p>Aucun établissement ne correspond à vos critères.</p>
        </div>
      `;
      return;
    }

    bars.forEach(bar => {
      const cat = getPriceCategory(bar.price);
      const card = document.createElement('div');
      card.className = 'bar-card';
      card.dataset.id = bar.id;

      card.innerHTML = `
        <div class="bar-card-info">
          <h4>${escapeHTML(bar.name)}</h4>
          <div class="bar-card-meta">
            <span class="bar-brand-tag"><i class="fa-solid fa-glass-water"></i> ${escapeHTML(bar.brand)}</span>
            ${bar.city ? `<span>&bull; ${escapeHTML(bar.city)}</span>` : ''}
          </div>
        </div>
        <div class="bar-card-price price-${cat}">
          ${formatPrice(bar.price)}
        </div>
      `;

      card.addEventListener('click', () => {
        if (onSelectBar) onSelectBar(bar);
      });

      listContainer.appendChild(card);
    });
  }

  /**
   * Updates global baromètre stats card.
   * @param {Object} stats 
   */
  function updateStats(stats) {
    if (!stats) return;
    const avgEl = document.getElementById('statAvgPrice');
    const minEl = document.getElementById('statMinPrice');
    const topBrandEl = document.getElementById('statTopBrand');

    if (avgEl) avgEl.textContent = stats.avgPrice ? `${stats.avgPrice.toFixed(2)} €` : '-- €';
    if (minEl) minEl.textContent = stats.minPrice ? `${stats.minPrice.toFixed(2)} €` : '-- €';
    if (topBrandEl) topBrandEl.textContent = stats.popularBrand || 'Ricard';
  }

  /**
   * HTML Escape Helper
   */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return {
    showToast,
    formatPrice,
    getPriceCategory,
    formatDate,
    renderBarsList,
    updateStats,
    escapeHTML
  };
})();
