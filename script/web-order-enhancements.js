(() => {
  const PENDING_ENDPOINT = '/orderskun/pending';
  const WEB_CARD_CLASS = 'web-order-card';
  const WEB_BADGE_ROW_CLASS = 'web-order-badge-row';
  const WEB_LABEL_CLASS = 'web-order-label';
  const WEB_ACTIONS_CLASS = 'web-order-actions';
  const WEB_TEL_BUTTON_CLASS = 'web-tel-btn';
  const WEB_TEL_PANEL_CLASS = 'web-tel-panel';

  let latestPendingOrders = [];
  let enhancementScheduled = false;
  const openOrderIds = new Set();

  function getCurrentLang() {
    return localStorage.getItem('loacastrogg') || 'pt';
  }

  function getDictionary() {
    if (typeof translation === 'undefined') {
      return {};
    }

    return translation[getCurrentLang()] || translation.pt || {};
  }

  function getLabel(key, fallback) {
    const dict = getDictionary();
    return dict[key] || fallback;
  }

  function adjustPickupTime(isoString, isWebOrder) {
    const pickupTime = new Date(String(isoString).replace('Z', ''));

    if (isWebOrder) {
      pickupTime.setHours(pickupTime.getHours() + 9);
    }

    return pickupTime;
  }

  function getTimeState(isoString, isWebOrder) {
    const pickupTime = adjustPickupTime(isoString, isWebOrder);
    const now = new Date();
    const diffMs = pickupTime.getTime() - now.getTime();
    const absMs = Math.abs(diffMs);
    const hours = String(Math.floor(absMs / (1000 * 60 * 60))).padStart(2, '0');
    const minutes = String(Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const seconds = String(Math.floor((absMs % (1000 * 60)) / 1000)).padStart(2, '0');

    if (diffMs > 0) {
      return {
        color: '#ADD8E6',
        text: `${getLabel('time_left', 'Time left')}: ${hours}:${minutes}:${seconds}`
      };
    }

    return {
      color: '#FF7F7F',
      text: `${getLabel('time_passed', 'Time passed')}: ${hours}:${minutes}:${seconds}`
    };
  }

  function formatPickupLabel(isoString, isWebOrder) {
    const pickupTime = adjustPickupTime(isoString, isWebOrder);
    const hours = String(pickupTime.getHours()).padStart(2, '0');
    const minutes = String(pickupTime.getMinutes()).padStart(2, '0');
    return `${getLabel('pickup_time', 'Pickup Time:')} ${hours}:${minutes}`;
  }

  function sortOrdersLikePage(orders) {
    return [...orders].sort((a, b) => new Date(a.pickup_time) - new Date(b.pickup_time));
  }

  function capturePendingOrders(payload) {
    if (!Array.isArray(payload)) {
      latestPendingOrders = [];
      return;
    }

    latestPendingOrders = sortOrdersLikePage(payload);
    scheduleEnhancement();
  }

  function patchFetch() {
    if (window.__webOrderFetchPatched) {
      return;
    }

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const url = String(args[0] || '');

      if (url.includes(PENDING_ENDPOINT)) {
        response.clone().json().then(capturePendingOrders).catch(() => {});
      }

      return response;
    };

    window.__webOrderFetchPatched = true;
  }

  async function primePendingOrders() {
    if (typeof server === 'undefined' || typeof clients === 'undefined' || !clients || !clients.id) {
      return;
    }

    try {
      const response = await fetch(`${server}/orderskun/pending`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ client_id: clients.id })
      });

      if (!response.ok) {
        return;
      }

      capturePendingOrders(await response.json());
    } catch (error) {
      console.error('web-order-enhancements prime fetch failed:', error);
    }
  }

  function ensureBadgeRow(card, order) {
    let row = card.querySelector(`.${WEB_BADGE_ROW_CLASS}`);
    if (!row) {
      const title = card.querySelector('h3');
      if (!title) {
        return;
      }

      row = document.createElement('div');
      row.className = WEB_BADGE_ROW_CLASS;
      title.insertAdjacentElement('afterend', row);
    }

    let label = row.querySelector(`.${WEB_LABEL_CLASS}`);
    if (!label) {
      label = document.createElement('div');
      label.className = WEB_LABEL_CLASS;
      label.textContent = 'WEB ORDER';
      row.appendChild(label);
    }

    let actions = row.querySelector(`.${WEB_ACTIONS_CLASS}`);
    if (!actions) {
      actions = document.createElement('div');
      actions.className = WEB_ACTIONS_CLASS;
      row.appendChild(actions);
    }

    let button = actions.querySelector(`.${WEB_TEL_BUTTON_CLASS}`);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = WEB_TEL_BUTTON_CLASS;
      button.textContent = 'TEL';
      actions.appendChild(button);
    }

    const orderId = String(order.id || '');
    button.dataset.orderId = orderId;
    button.dataset.webTel = order.web_tel || '-';
    button.classList.toggle('is-open', openOrderIds.has(orderId));
    return row;
  }

  function ensureTelPanel(card, order) {
    let panel = card.querySelector(`.${WEB_TEL_PANEL_CLASS}`);
    if (!panel) {
      panel = document.createElement('div');
      panel.className = WEB_TEL_PANEL_CLASS;

      const totalElement = card.querySelector('.valor-p');
      if (totalElement) {
        totalElement.insertAdjacentElement('afterend', panel);
      } else {
        card.appendChild(panel);
      }
    }

    panel.textContent = `${getLabel('phone_number', 'Phone Number')}: ${order.web_tel || '-'}`;
    panel.hidden = !openOrderIds.has(String(order.id || ''));
    return panel;
  }

  function normalizePickupLabel(card, order) {
    const timeBlocks = card.querySelectorAll('.order-time-div');
    if (timeBlocks.length === 0) {
      return;
    }

    const firstSpan = timeBlocks[0].querySelector('span');
    if (!firstSpan) {
      return;
    }

    if (order && order.is_web === true) {
      firstSpan.textContent = formatPickupLabel(order.pickup_time, true);
      return;
    }

    firstSpan.textContent = firstSpan.textContent.replace(/(\d{1,2}):(\d{1,2})$/, (_, h, m) => {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    });
  }

  function updateTimeBlocks(card, order) {
    const timeBlocks = card.querySelectorAll('.order-time-div');
    if (timeBlocks.length < 2) {
      return;
    }

    const pickupLabel = formatPickupLabel(order.pickup_time, true);
    const timeState = getTimeState(order.pickup_time, true);

    timeBlocks[0].style.setProperty('background-color', timeState.color, 'important');
    timeBlocks[1].style.setProperty('background-color', timeState.color, 'important');

    const firstSpan = timeBlocks[0].querySelector('span');
    const secondSpan = timeBlocks[1].querySelector('span');

    if (firstSpan) {
      firstSpan.textContent = pickupLabel;
    }

    if (secondSpan) {
      secondSpan.textContent = timeState.text;
    }
  }

  function enhanceCard(card, order) {
    normalizePickupLabel(card, order);

    if (!order || order.is_web !== true) {
      return;
    }

    card.classList.add(WEB_CARD_CLASS);
    ensureBadgeRow(card, order);
    ensureTelPanel(card, order);
    updateTimeBlocks(card, order);
  }

  function enhanceOrderCards() {
    const container = document.getElementById('order-list-comanda');
    if (!container || latestPendingOrders.length === 0) {
      return;
    }

    const cards = Array.from(container.querySelectorAll('.order-card-comanda'));
    if (cards.length === 0) {
      return;
    }

    const sortedOrders = sortOrdersLikePage(latestPendingOrders);
    cards.forEach((card, index) => enhanceCard(card, sortedOrders[index]));
  }

  function scheduleEnhancement() {
    if (enhancementScheduled) {
      return;
    }

    enhancementScheduled = true;
    requestAnimationFrame(() => {
      enhancementScheduled = false;
      enhanceOrderCards();
    });
  }

  function watchOrderContainer() {
    const container = document.getElementById('order-list-comanda');
    if (!container || container.dataset.webObserverAttached === 'true') {
      return;
    }

    const observer = new MutationObserver(() => {
      scheduleEnhancement();
    });

    observer.observe(container, { childList: true, subtree: true });
    container.dataset.webObserverAttached = 'true';

    container.addEventListener('click', (event) => {
      const button = event.target.closest(`.${WEB_TEL_BUTTON_CLASS}`);
      if (!button) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const orderId = button.dataset.orderId || '';
      if (!orderId) {
        return;
      }

      if (openOrderIds.has(orderId)) {
        openOrderIds.delete(orderId);
      } else {
        openOrderIds.add(orderId);
      }

      scheduleEnhancement();
    });
  }

  function init() {
    patchFetch();
    watchOrderContainer();
    primePendingOrders();
    scheduleEnhancement();
  }

  patchFetch();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
