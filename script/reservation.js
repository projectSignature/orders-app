const token = window.localStorage.getItem('token');
if (!token) {
   window.location.href = '../index.html';
}
const decodedToken = jwt_decode(token); // jwtDecodeではなくjwt_decodeを使用

const currentTime = document.getElementById('current_time');

console.log(decodedToken)
let userInfo ={
  id:decodedToken.userId, //クライアントid
  language:decodedToken.language,
  table_count: decodedToken.table_count, // Quantidade de mesas
  iat: 1727826129
}

 let currentLang = localStorage.getItem('loacastrogg') || 'pt';






const tableCount = userInfo ? userInfo.table_count : 0;

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');

const japaneseDate = `${year}-${month}-${day}`;

currentTime.textContent = `${t('date_label')} ${japaneseDate}`;


const createReservationBtn = document.getElementById('create-reservation-btn');
const createReservationModal = document.getElementById('create-reservation-modal');
const closeModalButton = document.querySelector('.close');

createReservationBtn.addEventListener('click', () => {
    createReservationModal.style.display = 'block';
});

closeModalButton.addEventListener('click', () => {
    createReservationModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === createReservationModal) {
        createReservationModal.style.display = 'none';
    }
});

function showNotification(message, type = 'success') {
    const notificationContainer = document.getElementById('notification-container');

    const notification = document.createElement('div');
    notification.style.color = type === 'success' ? 'green' : 'red';
    notification.style.padding = '10px';
    notification.style.textAlign = 'center';
    notification.style.fontSize = '16px';
    notification.style.marginTop = '10px';
    notification.textContent = message;
    notificationContainer.style.display = 'block';
    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notificationContainer.removeChild(notification);

        if (notificationContainer.children.length === 0) {
            notificationContainer.style.display = 'none';
        }
    }, 3000);
}

function fillTableWithReservations(reservations) {
    const tableContainer = document.getElementById('mesas-container');
    tableContainer.innerHTML = ''; // Limpa qualquer conteúdo existente
    // Ordena as reservas pelo número da mesa (table_number) em ordem crescente
    // reservations.sort((a, b) => a.table_number - b.table_number);
    if(reservations===undefined){
      console.log('no order')
      return
    }
    reservations.forEach(reservation => {
        const tableElement = document.createElement('div');
        tableElement.classList.add('mesa');

        tableElement.setAttribute('data-id', `mesa${reservation.table_number}`);
        tableElement.setAttribute('data-reservation-id', reservation.id);

        tableElement.innerHTML = `
        <h2>${t('table')} ${reservation.table_number}</h2>

            <div>
                <i class="fa-solid fa-user-group"></i>
                <span class="mesa__pessoas">${reservation.num_people}</span>
            </div>
            <span class="mesa__disponivel">
              ${t('reserved_by')}: ${reservation.reservation_name}
            </span>
        `;

        tableElement.classList.add('reservada');

        tableElement.addEventListener('click', () => openModal(reservation));

        // Adiciona a linha de reserva na tabela
        tableContainer.appendChild(tableElement);
    });
}

function fillReservationsTable(reservations) {
    const tableBody = document.getElementById('reservas-dia-body');
    tableBody.innerHTML = '';

    reservations.forEach(reservation => {
      console.log(reservation)
      const row = document.createElement('tr');
        row.setAttribute('data-reservation-id', reservation.id); // ← 追加

        row.innerHTML = `
        <td>${reservation.id}</td>
        <td>${reservation.reservation_name}</td>
        <td>${reservation.table_number}</td>
        <td>${reservation.num_people}</td>
        <td>${reservation.reservation_start_time}</td>
        <td>${reservation.reservation_end_time}</td>
        `;
        tableBody.appendChild(row);
    });
}

function openModal(table) {
    const modal = document.getElementById('mesa-modal');
    const deleteReservationButton = document.getElementById('modal-delete');
    const saveReservationButton = document.getElementById('submit-edit-reservation');
    const closeModalButton = document.querySelector('#close-modal');

    document.getElementById('modal-table-number').value = table.table_number;
    document.getElementById('modal-reservation-name').value = table.reservation_name;
    document.getElementById('modal-num-people').value = table.num_people;
    document.getElementById('modal-phone-number').value = table.phone_number;
    document.getElementById('modal-reservation-date').value = table.reservation_date;
    document.getElementById('modal-start-time').value = table.reservation_start_time;
    document.getElementById('modal-end-time').value = table.reservation_end_time;
    document.getElementById('modal-remarks').value = table.remarks || '';

    modal.style.display = 'block';

    deleteReservationButton.onclick = () => {
        deleteTable(table.id);
    };

    saveReservationButton.onclick = () => {
        editTable(table.id);
    }

    closeModalButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });
}

function hasTimeConflict(newReservation, existingReservations) {
    return existingReservations.some(reservation =>
        reservation.table_number == newReservation.table_number &&
        reservation.reservation_date == newReservation.reservation_date &&
        (
            (newReservation.reservation_start_time >= reservation.reservation_start_time &&
             newReservation.reservation_start_time < reservation.reservation_end_time) ||
            (newReservation.reservation_end_time > reservation.reservation_start_time &&
             newReservation.reservation_end_time <= reservation.reservation_end_time) ||
            (newReservation.reservation_start_time <= reservation.reservation_start_time &&
             newReservation.reservation_end_time >= reservation.reservation_end_time)
        )
    );
}

function createReservation() {
  showLoadingPopup();

  const tableNumber = document.getElementById('create-table-number').value;

  if (tableNumber > tableCount) {
    hideLoadingPopup();
    alert(`${t('table_number_limit')} ${tableCount}`, 'error');
    return;
  }

  const reservationData = {
    user_id: userInfo.id,
    reservation_date: document.getElementById('create-reservation-date').value,
    reservation_start_time: document.getElementById('create-start-time').value,
    reservation_end_time: document.getElementById('create-end-time').value,
    table_number: tableNumber,
    reservation_name: document.getElementById('create-reservation-name').value,
    phone_number: document.getElementById('create-phone-number').value,
    num_people: document.getElementById('create-num-people').value,
    remarks: document.getElementById('create-remarks').value || null
  };

  // ✅ クライアント側バリデーション（remarks以外）
  const missingFields = [];
  if (!reservationData.user_id) missingFields.push('user_id');
  if (!reservationData.reservation_date) missingFields.push('reservation_date');
  if (!reservationData.reservation_start_time) missingFields.push('reservation_start_time');
  if (!reservationData.reservation_end_time) missingFields.push('reservation_end_time');
  if (!reservationData.table_number) missingFields.push('table_number');
  if (!reservationData.reservation_name) missingFields.push('reservation_name');
  if (!reservationData.phone_number) missingFields.push('phone_number');
  if (!reservationData.num_people) missingFields.push('num_people');

  if (missingFields.length > 0) {
    hideLoadingPopup();

    const translated = missingFields.map(key => translation[currentLang]?.[key] || key);

    alert(`⚠️ ${currentLang === 'jp' ? '未入力項目があります：' : currentLang === 'pt' ? 'Campos ausentes:' : 'Missing fields:'}\n\n${translated.join(', ')}`);
    return;
  }


  fetch(`${server}/reservations/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reservationData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao criar a reserva');
      }
      return response.json();
    })
    .then(data => {
      hideLoadingPopup();
      if (data.success) {
        showNotification(data.message, 'success');
        document.getElementById('create-reservation-modal').style.display = 'none';
        getTableData();
      } else {
        showNotification(data.message, 'error');
      }
    })
    .catch(error => {
      hideLoadingPopup();
      showNotification(error.message, 'error');
      console.error('Erro ao criar a reserva:', error);
    });
}


const submitCreateReservationBtn = document.getElementById('submit-create-reservation');
submitCreateReservationBtn.addEventListener('click', createReservation);

function deleteTable(reservationId) {
    showLoadingPopup();
    const url = `${server}/reservations/delete/${reservationId}`;
    fetch(url, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao deletar a reserva');
        }
        return response.json();
    })
    .then(data => {
        hideLoadingPopup();
        if (data.success) {
            showNotification(data.message, 'success')
            const tableElement = document.querySelector(`.mesa[data-reservation-id="${reservationId}"]`);
            console.log(tableElement)
            const tableRow = document.querySelector(`tr[data-reservation-id="${reservationId}"]`);
            if (tableRow) tableRow.remove();

            if (tableElement) {
                tableElement.remove();
            }
            document.getElementById('mesa-modal').style.display = 'none';
            getTableData();
        }
    })
    .catch(error => {
        showNotification(error.message, 'error');
        hideLoadingPopup();
        console.error("Erro ao deletar a reserva:", error);
    });
}

function editTable(reservationId) {
    showLoadingPopup();
    const url = `${server}/reservations/update/${reservationId}`;
    const tableNumber = document.getElementById('modal-table-number').value;
    if (tableNumber > tableCount) {
        hideLoadingPopup();
        alert(`${t('table_number_limit')} ${tableCount}`, 'error');
        return;
    }
    const updatedData = {
        user_id: userInfo.id,
        reservation_date: document.getElementById('modal-reservation-date').value,
        reservation_start_time: document.getElementById('modal-start-time').value,
        reservation_end_time: document.getElementById('modal-end-time').value,
        table_number: document.getElementById('modal-table-number').value,
        reservation_name: document.getElementById('modal-reservation-name').value,
        phone_number: document.getElementById('modal-phone-number').value,
        num_people: document.getElementById('modal-num-people').value,
        remarks: document.getElementById('modal-remarks').value || null
    };

    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao editar a reserva');
        }
        return response.json();
    })
    .then(data => {
        hideLoadingPopup();
        if (data.success) {
            showNotification(data.message, 'success');
            document.getElementById('mesa-modal').style.display = 'none';
            getTableData();
        } else {
            showNotification(data.message, 'error');
        }
    })
    .catch(error => {
        showNotification(error.message, 'error');
        hideLoadingPopup();
        console.error('Erro ao editar a reserva:', error);
    });
}

function getTableData() {
    showLoadingPopup();
    console.log(`${server}/reservations?user_id=${userInfo.id}&reservation_date=${japaneseDate}`)
    const url = `${server}/reservations?user_id=${userInfo.id}&reservation_date=${japaneseDate}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar os dados das mesas');
            }
            return response.json();
        })
        .then(data => {
            hideLoadingPopup();
            if (data.success && data.data.length > 0) {
                userInfo.resarvations = data.data
                fillTableWithReservations(data.data);
                fillReservationsTable(data.data);
            }
        })
        .catch(error => {
            hideLoadingPopup();
            console.error('Erro ao buscar os dados:', error);
        });
}

document.addEventListener('DOMContentLoaded', function() {
    getTableData();
});

function t(key) {
 return translation[currentLang][key] || key;
}


  function applyTranslation(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = translation[lang][key] || key;

      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = translation[currentLang][key] || key;
      });

      fillTableWithReservations(userInfo.resarvations)

      if (el.querySelector('button')) {
        const button = el.querySelector('button');
        el.childNodes[0].nodeValue = translated + ' ';
        el.appendChild(button);
      } else {
        el.innerHTML = translated;
      }
    });
  }



   // 初期設定と変更イベント
   document.getElementById('language-select').addEventListener('change', async (e) => {
     const lang = e.target.value;
     localStorage.setItem('loacastrogg', lang);
     currentLang = lang
     applyTranslation(lang);
     if (window.currentItemForDetails) {
    document.querySelectorAll('.item-details').forEach(el => el.remove());
    displayItemDetails(window.currentItemForDetails);
  }
   });

   document.getElementById('language-select').value = currentLang;
   applyTranslation(currentLang);
