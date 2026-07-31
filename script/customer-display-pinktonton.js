(function initializePinkTontonCustomerDisplay() {
  'use strict';

  const RESTAURANT_ID = 26;
  const token = window.localStorage.getItem('token');
  const decodeToken = window.jwt_decode;
  const apiBase = String(
    window.PINK_TONTON_DISPLAY_SERVER
    || (typeof server === 'string' ? server : '')
  ).replace(/\/+$/, '');
  if (!token || typeof decodeToken !== 'function' || !apiBase) {
    return;
  }

  let decodedToken;
  try {
    decodedToken = decodeToken(token);
  } catch (error) {
    console.error('[Customer display] Invalid login token', error);
    return;
  }

  const restaurantId = Number(decodedToken.restaurant_id ?? decodedToken.userId);
  if (restaurantId !== RESTAURANT_ID) return;

  let pendingTimer = null;
  let pendingState = null;

  async function post(path, body) {
    const response = await fetch(`${apiBase}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body || {})
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async function flushUpdate() {
    const state = pendingState;
    pendingState = null;
    pendingTimer = null;
    if (!state) return;

    try {
      await post('/state', state);
    } catch (error) {
      console.error('[Customer display] Update failed', error);
    }
  }

  function update(state, options) {
    if (!state || !Array.isArray(state.items)) return;
    pendingState = { ...state, type: 'update' };

    if (options && options.immediate) {
      if (pendingTimer) clearTimeout(pendingTimer);
      flushUpdate();
      return;
    }

    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = setTimeout(flushUpdate, 180);
  }

  async function reset() {
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingState = null;
    pendingTimer = null;

    try {
      await post('/state', { type: 'reset' });
    } catch (error) {
      console.error('[Customer display] Reset failed', error);
    }
  }

  async function createPairingCode() {
    const button = document.getElementById('pink-customer-display-pair');
    if (button) button.disabled = true;

    try {
      const result = await post('/pair', {});
      window.alert(
        `iPadカスタマー画面の接続コード\n\n${result.code}\n\n`
        + 'iPadへこの6桁を入力してください。\nコードは10分間有効です。'
      );
    } catch (error) {
      window.alert(`接続コードを発行できませんでした。\n${error.message}`);
    } finally {
      if (button) button.disabled = false;
    }
  }

  function addPairingButton() {
    if (document.getElementById('pink-customer-display-pair')) return;

    const button = document.createElement('button');
    button.id = 'pink-customer-display-pair';
    button.type = 'button';
    button.textContent = 'iPad表示接続';
    button.title = 'iPadのカスタマー画面を接続';
    Object.assign(button.style, {
      position: 'fixed',
      right: '12px',
      bottom: '12px',
      zIndex: '10000',
      border: '0',
      borderRadius: '8px',
      padding: '10px 14px',
      background: '#374151',
      color: '#fff',
      fontSize: '14px',
      boxShadow: '0 3px 12px rgba(0,0,0,.3)',
      cursor: 'pointer'
    });
    button.addEventListener('click', createPairingCode);
    document.body.appendChild(button);
  }

  window.PinkTontonCustomerDisplay = {
    update,
    reset,
    createPairingCode
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addPairingButton);
  } else {
    addPairingButton();
  }
}());
