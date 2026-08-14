/**
 * Admin Module - PastisMap 🥃📍
 * Manages secret URL token verification, mode switching (Read-Only vs Editor),
 * and header authentication for write API requests.
 */

const AdminModule = (() => {
  let isAdmin = false;
  let adminToken = null;

  /**
   * Initializes Admin mode by checking URL parameters or sessionStorage.
   */
  async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const tokenFromStorage = sessionStorage.getItem('pastismap_admin_token');

    const tokenToTest = tokenFromUrl || tokenFromStorage;

    if (tokenToTest) {
      const valid = await verifyToken(tokenToTest);
      if (valid) {
        setAdminToken(tokenToTest);
      } else if (tokenFromUrl) {
        console.warn('⚠️ Token admin présent dans l\'URL mais invalide.');
      }
    }

    updateAdminUI();
  }

  /**
   * Verifies the token against the backend API.
   * @param {string} token 
   * @returns {Promise<boolean>}
   */
  async function verifyToken(token) {
    if (!token) return false;
    try {
      const res = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      return data.valid === true;
    } catch (e) {
      console.error('Erreur vérification token:', e);
      return false;
    }
  }

  /**
   * Sets the active admin token and persists in session.
   * @param {string} token 
   */
  function setAdminToken(token) {
    isAdmin = true;
    adminToken = token;
    sessionStorage.setItem('pastismap_admin_token', token);
    updateAdminUI();
  }

  /**
   * Clears admin token.
   */
  function logoutAdmin() {
    isAdmin = false;
    adminToken = null;
    sessionStorage.removeItem('pastismap_admin_token');
    updateAdminUI();
  }

  /**
   * Returns current headers required for API requests.
   * @returns {Object}
   */
  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (isAdmin && adminToken) {
      headers['X-Admin-Token'] = adminToken;
    }
    return headers;
  }

  /**
   * Updates the UI elements based on current admin state.
   */
  function updateAdminUI() {
    const modeBadge = document.getElementById('modeBadge');
    const modeText = document.getElementById('modeText');
    const editorActionPanel = document.getElementById('editorActionContainer');
    const detailAdminActions = document.getElementById('detailAdminActions');

    if (isAdmin) {
      if (modeBadge) {
        modeBadge.className = 'mode-badge mode-editor';
        modeBadge.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> <span id="modeText">Mode Éditeur</span>';
      }
      if (editorActionPanel) editorActionPanel.classList.remove('hidden');
      if (detailAdminActions) detailAdminActions.classList.remove('hidden');
    } else {
      if (modeBadge) {
        modeBadge.className = 'mode-badge mode-readonly';
        modeBadge.innerHTML = '<i class="fa-solid fa-eye"></i> <span id="modeText">Mode Lecture</span>';
      }
      if (editorActionPanel) editorActionPanel.classList.add('hidden');
      if (detailAdminActions) detailAdminActions.classList.add('hidden');
    }
  }

  return {
    init,
    verifyToken,
    setAdminToken,
    logoutAdmin,
    getAuthHeaders,
    getIsAdmin: () => isAdmin,
    getToken: () => adminToken
  };
})();
