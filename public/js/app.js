/**
 * Main Application Logic - PastisMap 🥃📍
 * Connects API, Map, Admin auth, and UI elements.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Global State
  let allBars = [];
  let filteredBars = [];
  let selectedBar = null;
  let activePriceFilter = 'all';
  let activeBrandFilter = 'all';
  let activeSearchQuery = '';
  let activeSortOption = 'price-asc';

  // --- INITIALIZATION ---
  const [config] = await Promise.all([
    loadConfig(),
    AdminModule.init()
  ]);
  MapModule.init('map', handleBarSelected, config && config.cartomapApiKey);

  await loadBarsData();
  await loadStatsData();

  setupEventListeners();

  // --- API DATA FETCHING ---

  async function loadConfig() {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) throw new Error('Erreur API Config');
      return await res.json();
    } catch (e) {
      console.warn('Configuration non chargée ou par défaut:', e);
      return { cartomapApiKey: '' };
    }
  }

  async function loadBarsData() {
    try {
      const res = await fetch('/api/bars');
      if (!res.ok) throw new Error('Erreur API');
      allBars = await res.json();
      applyFiltersAndRender();
    } catch (e) {
      console.error('Erreur chargement bars:', e);
      UIModule.showToast('Erreur lors du chargement des données.', 'error');
    }
  }

  async function loadStatsData() {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Erreur stats');
      const stats = await res.json();
      UIModule.updateStats(stats);
    } catch (e) {
      console.error('Erreur chargement stats:', e);
    }
  }

  // --- FILTERING & SORTING LOGIC ---

  function applyFiltersAndRender() {
    filteredBars = allBars.filter(bar => {
      // 1. Search Query Filter
      if (activeSearchQuery) {
        const q = activeSearchQuery.toLowerCase();
        const matchName = bar.name && bar.name.toLowerCase().includes(q);
        const matchCity = bar.city && bar.city.toLowerCase().includes(q);
        const matchBrand = bar.brand && bar.brand.toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchBrand) return false;
      }

      // 2. Price Category Filter
      if (activePriceFilter !== 'all') {
        const cat = UIModule.getPriceCategory(bar.price);
        if (cat !== activePriceFilter) return false;
      }

      // 3. Brand Filter
      if (activeBrandFilter !== 'all') {
        if (bar.brand !== activeBrandFilter) return false;
      }

      return true;
    });

    // Sort Bars
    filteredBars.sort((a, b) => {
      if (activeSortOption === 'price-asc') return a.price - b.price;
      if (activeSortOption === 'price-desc') return b.price - a.price;
      if (activeSortOption === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

    // Render both Sidebar list and Map markers
    UIModule.renderBarsList(filteredBars, handleBarSelected);
    MapModule.renderMarkers(filteredBars, handleBarSelected);
  }

  // --- HANDLERS & SELECTIONS ---

  function handleBarSelected(bar) {
    selectedBar = bar;
    MapModule.flyToBar(bar);
    openDetailModal(bar);
  }

  // --- MODALS MANAGERS ---

  // 1. Bar Detail Modal
  function openDetailModal(bar) {
    selectedBar = bar;
    const modal = document.getElementById('detailModal');
    const nameEl = document.getElementById('detailBarName');
    const priceBadge = document.getElementById('detailPriceBadge');
    const brandTag = document.getElementById('detailBrandTag');
    const addressEl = document.getElementById('detailAddress');
    const dateEl = document.getElementById('detailDate');
    const notesEl = document.getElementById('detailNotes');
    const directionsBtn = document.getElementById('detailDirectionsBtn');

    nameEl.textContent = bar.name;
    priceBadge.textContent = UIModule.formatPrice(bar.price);
    brandTag.innerHTML = `<i class="fa-solid fa-glass-water"></i> ${UIModule.escapeHTML(bar.brand)}`;
    addressEl.textContent = bar.address || (bar.city ? `Ville: ${bar.city}` : 'Adresse non renseignée');
    dateEl.textContent = UIModule.formatDate(bar.updated_at || bar.created_at);
    notesEl.textContent = bar.notes || 'Pas de remarques particulières.';

    // Google Maps Directions link
    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${bar.lat},${bar.lng}`;
    directionsBtn.href = gmapsUrl;

    modal.classList.remove('hidden');
  }

  function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
  }

  // 2. Add / Edit Bar Form Modal
  function openAddEditModal(barToEdit = null) {
    const modal = document.getElementById('barModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('barForm');
    const customBrandGroup = document.getElementById('customBrandGroup');

    form.reset();
    MapModule.clearPickLocation();

    if (barToEdit) {
      title.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Modifier le bar';
      document.getElementById('barId').value = barToEdit.id;
      document.getElementById('barName').value = barToEdit.name;
      document.getElementById('barPrice').value = barToEdit.price;
      document.getElementById('barCity').value = barToEdit.city || '';
      document.getElementById('barAddress').value = barToEdit.address || '';
      document.getElementById('barNotes').value = barToEdit.notes || '';
      document.getElementById('barLat').value = barToEdit.lat;
      document.getElementById('barLng').value = barToEdit.lng;
      document.getElementById('displayLat').textContent = parseFloat(barToEdit.lat).toFixed(4);
      document.getElementById('displayLng').textContent = parseFloat(barToEdit.lng).toFixed(4);

      // Handle brand select / custom
      const standardBrands = ['Ricard', 'Pastis 51', 'Pastis Henri Bardouin', 'Casanis', 'Duval', 'Artisanale'];
      if (standardBrands.includes(barToEdit.brand)) {
        document.getElementById('barBrand').value = barToEdit.brand;
        customBrandGroup.classList.add('hidden');
      } else {
        document.getElementById('barBrand').value = 'Autre';
        document.getElementById('customBrand').value = barToEdit.brand;
        customBrandGroup.classList.remove('hidden');
      }

      MapModule.setPickLocation(barToEdit.lat, barToEdit.lng);
    } else {
      title.innerHTML = '<i class="fa-solid fa-glass-water"></i> Ajouter un relevé de Pastis';
      document.getElementById('barId').value = '';
      customBrandGroup.classList.add('hidden');
      document.getElementById('displayLat').textContent = '--';
      document.getElementById('displayLng').textContent = '--';
    }

    modal.classList.remove('hidden');
  }

  function closeAddEditModal() {
    document.getElementById('barModal').classList.add('hidden');
    MapModule.clearPickLocation();
  }

  // --- SAVE / EDIT / DELETE API ACTIONS ---

  async function handleSaveBar(e) {
    e.preventDefault();
    if (!AdminModule.getIsAdmin()) {
      UIModule.showToast('Accès éditeur requis pour enregistrer.', 'error');
      return;
    }

    const id = document.getElementById('barId').value;
    const name = document.getElementById('barName').value.trim();
    const price = parseFloat(document.getElementById('barPrice').value);
    const selectedBrand = document.getElementById('barBrand').value;
    const customBrand = document.getElementById('customBrand').value.trim();
    const brand = (selectedBrand === 'Autre' && customBrand) ? customBrand : selectedBrand;
    const city = document.getElementById('barCity').value.trim();
    const address = document.getElementById('barAddress').value.trim();
    const lat = parseFloat(document.getElementById('barLat').value);
    const lng = parseFloat(document.getElementById('barLng').value);
    const notes = document.getElementById('barNotes').value.trim();

    if (!name || isNaN(price) || isNaN(lat) || isNaN(lng)) {
      UIModule.showToast('Veuillez remplir tous les champs obligatoires (Nom, Prix, Emplacement).', 'error');
      return;
    }

    const payload = { name, brand, price, lat, lng, city, address, notes };
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/bars/${id}` : '/api/bars';

    try {
      const res = await fetch(endpoint, {
        method: method,
        headers: AdminModule.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur serveur');
      }

      const savedBar = await res.json();
      UIModule.showToast(id ? 'Établissement modifié avec succès !' : 'Nouveau relevé de pastis ajouté !', 'success');

      closeAddEditModal();
      await loadBarsData();
      await loadStatsData();

      if (savedBar) {
        handleBarSelected(savedBar);
      }
    } catch (e) {
      console.error('Erreur enregistrement bar:', e);
      UIModule.showToast(e.message || 'Erreur lors de l\'enregistrement.', 'error');
    }
  }

  async function handleDeleteBar() {
    if (!selectedBar || !AdminModule.getIsAdmin()) return;

    if (!confirm(`Voulez-vous vraiment supprimer le bar "${selectedBar.name}" ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/bars/${selectedBar.id}`, {
        method: 'DELETE',
        headers: AdminModule.getAuthHeaders()
      });

      if (!res.ok) throw new Error('Erreur suppression');

      UIModule.showToast('Établissement supprimé.', 'success');
      closeDetailModal();
      await loadBarsData();
      await loadStatsData();
    } catch (e) {
      console.error('Erreur suppression:', e);
      UIModule.showToast('Impossible de supprimer l\'établissement.', 'error');
    }
  }

  // --- EVENT LISTENERS ---

  function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    searchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value;
      clearSearchBtn.classList.toggle('hidden', !activeSearchQuery);
      applyFiltersAndRender();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      activeSearchQuery = '';
      clearSearchBtn.classList.add('hidden');
      applyFiltersAndRender();
    });

    // Price Filter Pills
    document.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        activePriceFilter = e.target.dataset.filter;
        applyFiltersAndRender();
      });
    });

    // Brand Select Filter
    document.getElementById('brandFilterSelect').addEventListener('change', (e) => {
      activeBrandFilter = e.target.value;
      applyFiltersAndRender();
    });

    // Sort Select
    document.getElementById('sortSelect').addEventListener('change', (e) => {
      activeSortOption = e.target.value;
      applyFiltersAndRender();
    });

    // Geolocate Button
    document.getElementById('geolocateBtn').addEventListener('click', () => {
      MapModule.locateUser((lat, lng) => {
        // If in admin mode, auto-fill location in modal
        document.getElementById('barLat').value = lat;
        document.getElementById('barLng').value = lng;
        document.getElementById('displayLat').textContent = lat.toFixed(4);
        document.getElementById('displayLng').textContent = lng.toFixed(4);
      });
    });

    // Toggle Sidebar
    document.getElementById('toggleSidebarBtn').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });

    // Open Add Modal
    document.getElementById('openAddModalBtn').addEventListener('click', () => {
      openAddEditModal();
    });

    // Close Modals
    document.getElementById('closeModalBtn').addEventListener('click', closeAddEditModal);
    document.getElementById('cancelFormBtn').addEventListener('click', closeAddEditModal);
    document.getElementById('closeDetailModalBtn').addEventListener('click', closeDetailModal);

    // Form Brand Selection change (toggle custom input)
    document.getElementById('barBrand').addEventListener('change', (e) => {
      const customGroup = document.getElementById('customBrandGroup');
      if (e.target.value === 'Autre') {
        customGroup.classList.remove('hidden');
      } else {
        customGroup.classList.add('hidden');
      }
    });

    // Location Pickers inside Form
    document.getElementById('pickLocationOnMapBtn').addEventListener('click', () => {
      closeAddEditModal();
      MapModule.startPickLocationMode((lat, lng) => {
        document.getElementById('barLat').value = lat;
        document.getElementById('barLng').value = lng;
        document.getElementById('displayLat').textContent = lat.toFixed(4);
        document.getElementById('displayLng').textContent = lng.toFixed(4);
        openAddEditModal();
        MapModule.setPickLocation(lat, lng);
        UIModule.showToast('Position sélectionnée !', 'success');
      });
    });

    document.getElementById('cancelMapPickBtn').addEventListener('click', () => {
      MapModule.stopPickLocationMode();
    });

    document.getElementById('useCurrentLocationBtn').addEventListener('click', () => {
      MapModule.locateUser((lat, lng) => {
        document.getElementById('barLat').value = lat;
        document.getElementById('barLng').value = lng;
        document.getElementById('displayLat').textContent = lat.toFixed(4);
        document.getElementById('displayLng').textContent = lng.toFixed(4);
        MapModule.setPickLocation(lat, lng);
      });
    });

    // Submit Form
    document.getElementById('barForm').addEventListener('submit', handleSaveBar);

    // Detail Modal Actions
    document.getElementById('editDetailBarBtn').addEventListener('click', () => {
      closeDetailModal();
      openAddEditModal(selectedBar);
    });

    document.getElementById('deleteDetailBarBtn').addEventListener('click', handleDeleteBar);

    // Admin Token Key Modal
    const adminKeyBtn = document.getElementById('adminKeyBtn');
    const adminTokenModal = document.getElementById('adminTokenModal');
    const closeAdminTokenModalBtn = document.getElementById('closeAdminTokenModalBtn');
    const cancelTokenBtn = document.getElementById('cancelTokenBtn');
    const submitTokenBtn = document.getElementById('submitTokenBtn');
    const adminTokenInput = document.getElementById('adminTokenInput');
    const tokenErrorMsg = document.getElementById('tokenErrorMsg');

    adminKeyBtn.addEventListener('click', () => {
      adminTokenInput.value = '';
      tokenErrorMsg.classList.add('hidden');
      adminTokenModal.classList.remove('hidden');
    });

    closeAdminTokenModalBtn.addEventListener('click', () => adminTokenModal.classList.add('hidden'));
    cancelTokenBtn.addEventListener('click', () => adminTokenModal.classList.add('hidden'));

    submitTokenBtn.addEventListener('click', async () => {
      const token = adminTokenInput.value.trim();
      if (!token) return;

      const valid = await AdminModule.verifyToken(token);
      if (valid) {
        AdminModule.setAdminToken(token);
        adminTokenModal.classList.add('hidden');
        UIModule.showToast('Mode Éditeur déverrouillé avec succès ! ✏️', 'success');
        applyFiltersAndRender();
      } else {
        tokenErrorMsg.classList.remove('hidden');
      }
    });

    // Delegate "Details" button inside Leaflet popups
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('view-detail-btn')) {
        const id = parseInt(e.target.dataset.id, 10);
        const bar = allBars.find(b => b.id === id);
        if (bar) handleBarSelected(bar);
      }
    });
  }
});
