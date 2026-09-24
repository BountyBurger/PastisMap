/**
 * Map Module - PastisMap 🥃📍
 * Manages Leaflet map instance, custom pastis markers, popups, geolocation,
 * and location picker mode.
 */

const MapModule = (() => {
  let map = null;
  let markersLayer = null;
  let userLocationMarker = null;
  let tempPickMarker = null;
  let isPickMode = false;
  let onLocationPickedCallback = null;

  // France Center Default
  const DEFAULT_CENTER = [46.603354, 1.888334];
  const DEFAULT_ZOOM = 6;

  /**
   * Initializes Leaflet Map
   * @param {string} mapContainerId
   * @param {function} onMarkerClick
   * @param {string} [apiKey]
   */
  function init(mapContainerId, onMarkerClick, apiKey = '') {
    if (map) return;

    // Create map instance
    map = L.map(mapContainerId, {
      zoomControl: false
    }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

    // Add Leaflet zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add CartoDB Voyager tiles (clean, light, perfect for pastis map pins!)
    const key = apiKey || window.CARTOMAP_API_KEY || '';
    const tileUrl = key
      ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key.trim())}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Layer group for bar markers
    markersLayer = L.layerGroup().addTo(map);

    // Map click event listener (used for location picking)
    map.on('click', (e) => {
      if (isPickMode && onLocationPickedCallback) {
        setPickLocation(e.latlng.lat, e.latlng.lng);
        onLocationPickedCallback(e.latlng.lat, e.latlng.lng);
        stopPickLocationMode();
      }
    });
  }

  /**
   * Creates custom HTML marker icon based on price
   */
  function createPastisIcon(price) {
    const cat = UIModule.getPriceCategory(price);
    const formattedPrice = parseFloat(price).toFixed(2);

    const html = `
      <div class="custom-pastis-pin pin-${cat}">
        <span class="pin-content">${formattedPrice}€</span>
      </div>
    `;

    return L.divIcon({
      html: html,
      className: '',
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -36]
    });
  }

  /**
   * Renders markers on map from array of bars
   */
  function renderMarkers(bars, onSelectBar) {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    bars.forEach(bar => {
      const icon = createPastisIcon(bar.price);
      const marker = L.marker([bar.lat, bar.lng], { icon: icon });

      // Create popup content
      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <h3 style="font-family: 'Outfit', sans-serif; font-weight: 700; margin-bottom: 4px; color: #0f172a; font-size: 16px;">
            ${UIModule.escapeHTML(bar.name)}
          </h3>
          <div style="font-size: 13px; color: #475569; margin-bottom: 6px;">
            <strong style="color: #f59e0b;">🥃 ${UIModule.escapeHTML(bar.brand)}</strong> &bull; ${UIModule.escapeHTML(bar.city || '')}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span style="font-size: 18px; font-weight: 800; color: #0f172a;">${UIModule.formatPrice(bar.price)}</span>
            <button class="btn btn-sm btn-primary view-detail-btn" data-id="${bar.id}" style="padding: 4px 10px; font-size: 12px;">
              Détails &rarr;
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 260 });

      marker.on('click', () => {
        if (onSelectBar) onSelectBar(bar);
      });

      marker.addTo(markersLayer);
    });
  }

  /**
   * Flies map to specific lat, lng, and opens popup
   */
  function flyToBar(bar) {
    if (!map) return;
    map.flyTo([bar.lat, bar.lng], 14, {
      duration: 1.2
    });
  }

  /**
   * Centers map to user's geolocation
   */
  function locateUser(callback) {
    if (!map) return;

    if (!navigator.geolocation) {
      UIModule.showToast('La géolocalisation n\'est pas supportée par votre navigateur.', 'error');
      return;
    }

    UIModule.showToast('Recherche de votre position...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (userLocationMarker) {
          map.removeLayer(userLocationMarker);
        }

        // Custom pulsing dot for user location
        const userIcon = L.divIcon({
          html: '<div style="width:16px;height:16px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.8);"></div>',
          className: '',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        userLocationMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
        userLocationMarker.bindPopup('<strong>📍 Vous êtes ici !</strong>').openPopup();

        map.flyTo([lat, lng], 13, { duration: 1.5 });
        UIModule.showToast('Position trouvée !', 'success');

        if (callback) callback(lat, lng);
      },
      (err) => {
        console.error('Erreur géolocalisation:', err);
        UIModule.showToast('Impossible d\'obtenir votre position.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  /**
   * Starts map click pick mode
   */
  function startPickLocationMode(callback) {
    isPickMode = true;
    onLocationPickedCallback = callback;
    document.getElementById('mapInstructionBanner').classList.remove('hidden');
    if (map) map.getContainer().style.cursor = 'crosshair';
  }

  /**
   * Stops pick location mode
   */
  function stopPickLocationMode() {
    isPickMode = false;
    onLocationPickedCallback = null;
    document.getElementById('mapInstructionBanner').classList.add('hidden');
    if (map) map.getContainer().style.cursor = '';
  }

  /**
   * Sets temporary pick marker
   */
  function setPickLocation(lat, lng) {
    if (!map) return;
    if (tempPickMarker) map.removeLayer(tempPickMarker);

    const pinIcon = L.divIcon({
      html: '<div style="font-size:28px;color:#ef4444;text-shadow:0 2px 8px rgba(0,0,0,0.5);"><i class="fa-solid fa-location-dot"></i></div>',
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    tempPickMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
  }

  /**
   * Removes temp pick marker
   */
  function clearPickLocation() {
    if (tempPickMarker && map) {
      map.removeLayer(tempPickMarker);
      tempPickMarker = null;
    }
  }

  return {
    init,
    renderMarkers,
    flyToBar,
    locateUser,
    startPickLocationMode,
    stopPickLocationMode,
    setPickLocation,
    clearPickLocation,
    getMap: () => map
  };
})();
