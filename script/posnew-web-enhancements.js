(() => {
  const WEB_CARD_CLASS = 'pos-web-order-card';
  const WEB_CHIP_CLASS = 'pos-web-order-chip';
  const WEB_META_CLASS = 'pos-web-order-meta';
  const WEB_ROW_CLASS = 'pos-web-order-row';
  const WEB_LABEL_CLASS = 'pos-web-order-label';
  const WEB_VALUE_CLASS = 'pos-web-order-value';
  const DELIVERED_BUTTON_ID = 'confirm-ptakes';
  const DELETE_BUTTON_ID = 'delete-order';

  let enhancementScheduled = false;

  function getOrdersList() {
    return document.getElementById('orders-list');
  }

  function getPendingOrders() {
    if (typeof clients === 'undefined' || !clients || !Array.isArray(clients.pendingOrders)) {
      return [];
    }

    return clients.pendingOrders;
  }

  function getOrderById(orderId) {
    const normalizedId = String(orderId || '');
    if (!normalizedId) {
      return null;
    }

    return getPendingOrders().find((order) => String(order.id) === normalizedId) || null;
  }

  function getText(key, fallback) {
    if (typeof t === 'function') {
      return t(key);
    }

    return fallback;
  }

  function showDoneMessage(message) {
    if (typeof showCustomAlert === 'function') {
      showCustomAlert(message);
      return;
    }

    alert(message);
  }

  function showLoading() {
    if (typeof showLoadingPopup === 'function') {
      showLoadingPopup();
    }
  }

  function hideLoading() {
    if (typeof hideLoadingPopup === 'function') {
      hideLoadingPopup();
    }
  }

  function getSelectedOrder() {
    const clientState = typeof clients !== 'undefined' ? clients : null;
    const selectedOrderId = clientState ? clientState.selectedOrder : '';
    if (!selectedOrderId) {
      return null;
    }

    return getOrderById(selectedOrderId) || (clientState && clientState.printInfo ? clientState.printInfo : null);
  }

  function resetSelectionState() {
    const selected = document.querySelector('#orders-list .order-card.selected-card');
    if (selected) {
      selected.classList.remove('selected-card');
    }

    if (typeof clients !== 'undefined' && clients) {
      clients.selectedOrder = '';
      clients.printInfo = '';
    }

    if (typeof clearOrderDetails === 'function') {
      clearOrderDetails();
    }
  }

  function removeOrderLocally(orderId) {
    const card = document.querySelector(`#orders-list .order-card[data-id="${orderId}"]`);
    if (card) {
      card.remove();
    }

    if (typeof clients !== 'undefined' && clients && Array.isArray(clients.pendingOrders)) {
      clients.pendingOrders = clients.pendingOrders.filter((order) => String(order.id) !== String(orderId));
    }
  }

  function clearPaymentButtonSelection() {
    ['cash-payment', 'credit-payment', 'other-payment'].forEach((id) => {
      const button = document.getElementById(id);
      if (button) {
        button.classList.remove('selected');
      }
    });
  }

  async function parseErrorMessage(response, fallback) {
    try {
      const data = await response.json();
      if (data && data.message) {
        return data.message;
      }
    } catch (error) {
      try {
        const text = await response.text();
        if (text) {
          return text;
        }
      } catch (innerError) {
      }
    }

    return fallback;
  }

  function getWebDisplayName(order, card) {
    const candidates = [
      order.web_name,
      order.customer_name,
      order.user_name,
      order.client_name,
      order.name,
      order.order_name
    ];

    if (card && card.dataset.webOriginalTitle) {
      const originalParts = card.dataset.webOriginalTitle
        .split(/<br\s*\/?>/i)
        .map((part) => part.trim())
        .filter((part) => part !== '');

      if (originalParts.length >= 2) {
        candidates.push(originalParts[originalParts.length - 2]);
      }
    }

    const match = candidates.find((value) => typeof value === 'string' && value.trim() !== '');
    return match ? match.trim() : '-';
  }

  function ensureWebChip(leftColumn) {
    let chip = leftColumn.querySelector(`.${WEB_CHIP_CLASS}`);
    if (!chip) {
      chip = document.createElement('div');
      chip.className = WEB_CHIP_CLASS;
      chip.textContent = 'WEB';
      leftColumn.appendChild(chip);
    }

    return chip;
  }

  function ensureMetaRow(container, labelText, valueText) {
    const key = labelText.toLowerCase();
    let row = container.querySelector(`[data-web-row="${key}"]`);
    if (!row) {
      row = document.createElement('div');
      row.className = WEB_ROW_CLASS;
      row.dataset.webRow = key;

      const label = document.createElement('span');
      label.className = WEB_LABEL_CLASS;
      row.appendChild(label);

      const value = document.createElement('span');
      value.className = WEB_VALUE_CLASS;
      row.appendChild(value);

      container.appendChild(row);
    }

    const label = row.querySelector(`.${WEB_LABEL_CLASS}`);
    const value = row.querySelector(`.${WEB_VALUE_CLASS}`);
    if (label) {
      label.textContent = `${labelText}:`;
    }
    if (value) {
      value.textContent = valueText || '-';
    }

    return row;
  }

  function ensureWebMeta(leftColumn, card, order) {
    let meta = leftColumn.querySelector(`.${WEB_META_CLASS}`);
    if (!meta) {
      meta = document.createElement('div');
      meta.className = WEB_META_CLASS;
      leftColumn.appendChild(meta);
    }

    ensureMetaRow(meta, 'Name', getWebDisplayName(order, card));
    ensureMetaRow(meta, 'TEL', order.web_tel || '-');
  }

  function updateHeading(card, order) {
    const title = card.querySelector('.order-leftdiv h3');
    if (!title) {
      return;
    }

    if (!card.dataset.webOriginalTitle) {
      card.dataset.webOriginalTitle = title.innerHTML;
    }

    const pieces = title.innerHTML
      .split(/<br\s*\/?>/i)
      .map((part) => part.trim())
      .filter((part) => part !== '');

    if (pieces.length === 0) {
      title.innerHTML = 'web';
      return;
    }

    const status = pieces[pieces.length - 1];
    const prefix = pieces.length >= 3 ? pieces[0] : '';
    title.innerHTML = prefix ? `${prefix}<br>web<br>${status}` : `web<br>${status}`;
  }

  function cleanupCard(card) {
    card.classList.remove(WEB_CARD_CLASS);

    const leftColumn = card.querySelector('.order-leftdiv');
    const title = card.querySelector('.order-leftdiv h3');
    if (title && card.dataset.webOriginalTitle) {
      title.innerHTML = card.dataset.webOriginalTitle;
      delete card.dataset.webOriginalTitle;
    }

    if (!leftColumn) {
      return;
    }

    const chip = leftColumn.querySelector(`.${WEB_CHIP_CLASS}`);
    const meta = leftColumn.querySelector(`.${WEB_META_CLASS}`);
    if (chip) {
      chip.remove();
    }
    if (meta) {
      meta.remove();
    }
  }

  function enhanceCard(card) {
    const order = getOrderById(card.dataset.id);
    if (!order || order.is_web !== true) {
      cleanupCard(card);
      return;
    }

    const leftColumn = card.querySelector('.order-leftdiv');
    if (!leftColumn) {
      return;
    }

    card.classList.add(WEB_CARD_CLASS);
    updateHeading(card, order);
    ensureWebChip(leftColumn);
    ensureWebMeta(leftColumn, card, order);
  }

  function enhanceOrdersList() {
    const ordersList = getOrdersList();
    if (!ordersList) {
      return;
    }

    const cards = ordersList.querySelectorAll('.order-card');
    cards.forEach((card) => enhanceCard(card));
  }

  function scheduleEnhancement() {
    if (enhancementScheduled) {
      return;
    }

    enhancementScheduled = true;
    requestAnimationFrame(() => {
      enhancementScheduled = false;
      enhanceOrdersList();
    });
  }

  function watchOrdersList() {
    const ordersList = getOrdersList();
    if (!ordersList || ordersList.dataset.webObserverAttached === 'true') {
      return;
    }

    const observer = new MutationObserver(() => {
      scheduleEnhancement();
    });

    observer.observe(ordersList, { childList: true, subtree: true });
    ordersList.dataset.webObserverAttached = 'true';
  }

  function attachDeleteHandler() {
    const button = document.getElementById(DELETE_BUTTON_ID);
    if (!button || button.dataset.webSafeHandlerAttached === 'true') {
      return;
    }

    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const selectedOrder = getSelectedOrder();
      if (!selectedOrder || !selectedOrder.id) {
        alert(getText('select_order', 'Select order'));
        hideLoading();
        return;
      }

      const confirmDelete = confirm(getText('confirm_delete_order', 'Confirm delete order'));
      if (!confirmDelete) {
        hideLoading();
        return;
      }

      const orderItems = Array.isArray(selectedOrder.OrderItems)
        ? selectedOrder.OrderItems.map((item) => item && item.id).filter((id) => id != null)
        : [];

      showLoading();

      try {
        const response = await fetch(`${server}/orderskun/delete/${selectedOrder.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ itemIds: orderItems })
        });

        if (!response.ok) {
          const errorMessage = await parseErrorMessage(response, getText('register_error', 'Register error'));
          throw new Error(errorMessage);
        }

        showDoneMessage(getText('done', 'Done'));
        removeOrderLocally(selectedOrder.id);
        resetSelectionState();
      } catch (error) {
        console.error('Safe delete-order handler failed:', error);
        alert(error.message || getText('register_error', 'Register error'));
      } finally {
        hideLoading();
      }
    }, true);

    button.dataset.webSafeHandlerAttached = 'true';
  }

  function attachDeliveredHandler() {
    const button = document.getElementById(DELIVERED_BUTTON_ID);
    if (!button || button.dataset.webSafeHandlerAttached === 'true') {
      return;
    }

    button.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const selectedOrder = getSelectedOrder();
      if (!selectedOrder || !selectedOrder.id) {
        alert(getText('select_order', 'Select order'));
        return;
      }

      const clientState = typeof clients !== 'undefined' ? clients : null;
      let paymentType = clientState && clientState.paytype ? clientState.paytype : '';
      if (['local', 'order', 'takeout'].includes(selectedOrder.order_type)) {
        if (selectedOrder.payment_method === 'yet' && !paymentType) {
          alert(getText('payment_not_registered', 'Payment not registered'));
          return;
        }
      }

      if (['uber', 'demaekan', 'other'].includes(selectedOrder.order_type)) {
        paymentType = 'other';
      }

      showLoading();

      try {
        const response = await fetch(`${server}/orderskun/updateConfirmd`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            order_id: selectedOrder.id,
            order_status: 'confirmed',
            paymentType: paymentType
          })
        });

        if (!response.ok) {
          const errorMessage = await parseErrorMessage(response, getText('register_error', 'Register error'));
          throw new Error(errorMessage);
        }

        clearPaymentButtonSelection();
        showDoneMessage(getText('done', 'Done'));
        removeOrderLocally(selectedOrder.id);
        resetSelectionState();
      } catch (error) {
        console.error('Safe confirm-ptakes handler failed:', error);
        alert(error.message || getText('register_error', 'Register error'));
      } finally {
        hideLoading();
      }
    }, true);

    button.dataset.webSafeHandlerAttached = 'true';
  }

  function init() {
    watchOrdersList();
    attachDeleteHandler();
    attachDeliveredHandler();
    scheduleEnhancement();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
