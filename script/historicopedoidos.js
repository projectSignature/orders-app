const token = window.localStorage.getItem('token');

if (!token) {
   window.location.href = '../index.html';
}
const decodedToken = jwt_decode(token); // jwtDecodeではなくjwt_decodeを使用


let clients ={
  id:decodedToken.userId, //クライアントid
  language:decodedToken.language, //クライアント言語
  paytype:'',　//ユーザー支払い方法
  selectedOrder:"",　//選択オーダー
  printInfo:"",　//？？
  taxtType:"",　//税金区分
  registerInfo:"",
  salesInfo:"", //セールデータ
  kubun:decodedToken.role,　//admin or operator
  table_count:decodedToken.table_count,
  takeout_enabled:decodedToken.takeout_enabled,
  uber_enabled:decodedToken.uber_enabled
}

let currentLang = localStorage.getItem('loacastrogg') || 'pt';

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

      // 特例：中に要素がある場合（ボタン付きタイトルなど）
      if (el.querySelector('button')) {
        const button = el.querySelector('button');
        el.childNodes[0].nodeValue = translated + ' '; // テキストだけ置換
        el.appendChild(button); // ボタンを再追加（念のため）
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

document.addEventListener('DOMContentLoaded', () => {
    let allOrdes = []; // Armazenar todas as reservas localmente
    const itemsPerPage = 10; // Limite de 10 itens por página
    const maxDateRange = 30; // Limitar o intervalo de dias para evitar sobrecarga

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() - 7);
    const startdate = sevenDaysLater.toISOString().split('T')[0];

    const dateInputs = document.querySelectorAll('.date-range input[type="date"]');
    if (dateInputs.length === 2) {
        const todayDateInput = dateInputs[1];
        const startDateInput = dateInputs[0];
        todayDateInput.value = today;
        startDateInput.value = startdate;
        fetchPedidos(startdate,today);
        document.querySelector('.search').addEventListener('click', () => {
            const startDate = startDateInput.value;
            const endDate = todayDateInput.value;
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            const timeDiff = Math.abs(endDateObj - startDateObj);
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            if (daysDiff > maxDateRange) {
                alert(`Por favor, selecione um intervalo de no máximo ${maxDateRange} dias.`);
                return;
            }

            fetchPedidos(startDate, endDate);
        });
    } else {
        console.error('Os inputs de data não foram encontrados ou são insuficientes.');
    }

    function fetchPedidos(startDate, endDate) {
        showLoadingPopup();
        const apiUrl = `${server}/orderkuns/historico/pedidos/daterange?startDate=${startDate}&endDate=${endDate}&user_id=${clients.id}`;

        fetch(apiUrl)
            .then(response => {
                // レスポンスが成功 (status 200) かどうか確認
                if (response.ok) {
                    // JSON 形式のデータを返す
                    return response.json();
                } else {
                    hideLoadingPopup(); // エラー時にポップアップを閉じる
                    console.error(`Error: ${response.status}`);
                    return Promise.reject(`HTTPエラー: ${response.status}`);
                }
            })
            .then(data => {
                hideLoadingPopup();
                data
                .sort((a, b) => new Date(b.pickup_time) - new Date(a.pickup_time))
                    allOrdes = data; // データをローカルに保存
                    renderPage(1); // Renderizar a primeira página
                    renderPagination(Math.ceil(allOrdes.length / itemsPerPage), 1);

            })
            .catch(error => {
                hideLoadingPopup(); // エラー時にポップアップを閉じる
                console.error('エラー:', error);
            });
    }


    function renderPage(page) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const reservationsToShow = allOrdes.slice(start, end);

        renderReservations(reservationsToShow);
    }

    function renderReservations(orders) {
        const tbody = document.querySelector('.reservation-table tbody');
        tbody.innerHTML = ''; // テーブルをクリア
        orders.forEach(order => {
            const orderDate = new Date(order.pickup_time);
            const formattedDate = orderDate.toLocaleDateString('ja-JP');
            const tr = document.createElement('tr');
            const statusMapping = {
              pending: t('pending'),
              prepared: t('prepared'),
              confirmed: t('delivered'),
            };
            const orderStatus = statusMapping[order.order_status] || t('delivered');

            const paymentText = order.payment_method === 'yet' ? t('not_paid') : t(order.payment_method);
            const orderTypeText = t(order.order_type);

            tr.innerHTML = `
              <td>${order.id}</td>
              <td>${formattedDate}</td>
              <td>${orderTypeText}</td>
              <td>${order.order_name}</td>
              <td>${order.order_type === 'local' ? order.table_no : '-'}</td>
              <td>${orderStatus}</td>
              <td>${paymentText}</td>
              <td>${order.total_amount}</td>
              <td><button class="check-btn" data-i18n="check">${t('check')}</button></td>
              <td><button class="alterar-btn" data-i18n="edit">${t('edit')}</button></td>
              <td><button class="delete-btn" data-i18n="delete">${t('delete')}</button></td>
            `;

            tbody.appendChild(tr);

            // Checkボタンの処理
            const checkBtn = tr.querySelector('.check-btn');
            checkBtn.addEventListener('click', () => {
              const orderItems = order.OrderItems.map(item => {
      // optionsが文字列で保存されているため、JSONとしてパース
      let optionsList = '';
      if (item.options) {
          try {
              const parsedOptions = JSON.parse(item.options);  // JSONに変換
              optionsList = parsedOptions.map(option => {
                  return `<li>Option: ${option.name}, valor: ¥${option.additional_price}</li>`;
              }).join('');  // 各オプションをリスト形式で結合
          } catch (error) {
              console.error('オプションのパースに失敗しました:', error);
          }
      }
    console.log(item)
      return `
      <li>${t('name')}: ${item.menu.admin_item_name}, ${t('quantity')}: ${item.quantity}, ${t('value')}: ¥${item.item_price}</li>
          ${optionsList ? `<ul>${optionsList}</ul>` : ''}  <!-- オプションがある場合はリストを表示 -->
      `;
  }).join('');
                const modalContent = `
                <p>${t('name')}: ${order.order_name}</p>
                <p>${t('table_number')} ${order.table_no}</p>
                <p>${t('total_amount')} ¥${order.total_amount}</p>
                <p>${t('status')}: ${t(order.order_status)}</p>
                <p>${t('payment_method')}: ${t(order.payment_method)}</p>
                <h3>${t('items')}</h3>
                <ul>${orderItems}</ul>
                `;
                openModal(t('order_details'), modalContent);
                document.getElementById('modal-save-btn').innerText = 'OK'
            });

            const alterarBtn = tr.querySelector('.alterar-btn');
              alterarBtn.addEventListener('click', () => {
                const modalContent = `
                  <form id="orderUpdateForm">
                    <label for="orderStatus">${t('status')}:</label>
                    <select id="orderStatus" name="orderStatus">
                      <option value="confirmed" ${order.order_status === 'entregue' ? 'selected' : ''}>${t('delivered')}</option>
                      <option value="prepared" ${order.order_status === 'prepared' ? 'selected' : ''}>${t('prepared')}</option>
                      <option value="pending" ${order.order_status === 'pending' ? 'selected' : ''}>${t('pending')}</option>
                    </select>
                    <br/>
                    <label for="paymentMethod">${t('payment_method')}:</label>
                    <select id="paymentMethod" name="paymentMethod">
                      <option value="cash" ${order.payment_method === 'dinheiro' ? 'selected' : ''}>${t('cash')}</option>
                      <option value="credit" ${order.payment_method === 'credit' ? 'selected' : ''}>${t('card')}</option>
                      <option value="other" ${order.payment_method === 'other' ? 'selected' : ''}>${t('other')}</option>
                      <option value="yet" ${order.payment_method === 'yet' ? 'selected' : ''}>${t('not_paid')}</option>
                    </select>
                    <br/>
                    <label for="orderType">${t('order_type')}:</label>
                    <select id="orderType" name="orderType">
                      <option value="local" ${order.order_type === 'local' ? 'selected' : ''}>${t('local')}</option>
                      <option value="uber" ${order.order_type === 'uber' ? 'selected' : ''}>Uber</option>
                      <option value="demaekan" ${order.order_type === 'demaekan' ? 'selected' : ''}>Demaekan</option>
                      <option value="other" ${order.order_type === 'other' ? 'selected' : ''}>${t('other')}</option>
                      <option value="takeout" ${order.order_type === 'takeout' ? 'selected' : ''}>${t('takeout')}</option>
                    </select>
                  </form>
                `;


                openModal(t('order_details'), modalContent);
    // 保存ボタンの処理
    const saveBtn = document.getElementById('modal-save-btn');
    saveBtn.onclick = function() {
      try{

        showLoadingPopup();
        const updatedOrderStatus = document.getElementById('orderStatus').value;
        const updatedPaymentMethod = document.getElementById('paymentMethod').value;
        const updatedOrderType = document.getElementById('orderType').value;
        // APIに送信するデータ
        const updateData = {
            order_status: updatedOrderStatus,
            payment_method: updatedPaymentMethod,
            order_type: updatedOrderType
        };
        // APIにデータを送信
        fetch(`${server}/orderskun/update/${order.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        })
        .then(response => response.json())
        .then(data => {
          hideLoadingPopup();
            if (data.success) {
                alert('Feito com sucesso');
                location.reload(); // ページをリロードして更新
            } else {
                alert('Tivemos um erro');
            }
        })
        .catch(error => {
            console.error('エラーが発生しました:', error);
            alert('Tivemos um erro');
        });

        modal.style.display = 'none'; // モーダルを閉じる

    }catch (e){
      hideLoadingPopup();
    }
  }
});
const deleteBtn = tr.querySelector('.delete-btn');
deleteBtn.addEventListener('click', () => {
    // 確認ダイアログを表示
    const confirmDelete = confirm(`${t('confirm_delete_id')} : ${order.id}`);

    if (confirmDelete) {
        // 削除処理を実行
        const itemIds = order.OrderItems.map(item => item.id); // OrderItems の itemIds を取得
        console.log(itemIds)
        deleteOrder(order.id, itemIds);
    }
});

})

}
    function deleteOrder(orderId,itemIds) {
      // 削除リクエストを送信（オーダーIDとアイテムIDを一緒に送信）
      showLoadingPopup();
      fetch(`${server}/orderskun/delete/${orderId}`, {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ itemIds: itemIds }) // アイテムIDもリクエストに含める
      })
      .then(response => {
        hideLoadingPopup();
          if (response.ok) {
              alert('Comanda deletada com sucesso.');
              location.reload()
          } else {
              return response.json().then(data => {
                hideLoadingPopup()
                  throw new Error(data.message || 'Tivemos um erro');
              });
          }
      })
      .catch(error => {
        hideLoadingPopup();
          console.error('Error:', error);
          alert('Tivemos um erros ');
      });
    }
    // モーダルを開く関数
    function openModal(title, bodyContent) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyContent;
        modal.style.display = 'block'; // モーダルを表示
        // モーダルを閉じるロジック
        const closeModalBtn = document.querySelector('.close');
        closeModalBtn.onclick = function() {
            modal.style.display = 'none'; // モーダルを閉じる
        }
        // モーダル外をクリックしたときに閉じる
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
        // 保存ボタンの処理 (必要であればここで処理)
        const saveBtn = document.getElementById('modal-save-btn');
        saveBtn.onclick = function() {
            modal.style.display = 'none'; // モーダルを閉じる
        }
    }
    function renderPagination(totalPages, currentPage) {
        const paginationContainer = document.querySelector('.pagination');
        paginationContainer.innerHTML = '';
        if (totalPages <= 1) return;
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => {
                renderPage(i);
                renderPagination(totalPages, i);
            });

            paginationContainer.appendChild(pageButton);
        }
    }
});
