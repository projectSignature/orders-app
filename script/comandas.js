const token = window.localStorage.getItem('token');



if (!token) {
  console.log('kokokni')
   window.location.href = '../index.html';
}

const decodedToken = jwt_decode(token); // jwtDecodeではなくjwt_decodeを使用

let currentLang = localStorage.getItem('loacastrogg') || 'pt';

let clients ={
  id:decodedToken.userId, //クライアントid
  language:decodedToken.language, //クライアント言語
  paytype:'',　//ユーザー支払い方法
  selectedOrder:"",　//選択オーダー
  printInfo:"",　//？？
  taxtType:""　//税金区分
}

let selectedCard = null;
let MainData = null; // グローバルな変数として宣言

document.addEventListener('DOMContentLoaded', async () => {
    const orderContainer = document.getElementById('order-list-comanda');



    const updateData = async () => {
        // メニュー、カテゴリー、オープション表示
        showLoadingPopup();
        MainData = await makerequest(`${server}/orders/getBasedata?user_id=${clients.id}`); // MainDataにデータを格納

        let pendingOrders = await fetchPendingOrders(clients.id);
        pendingOrders.sort((a, b) => {
            return new Date(a.pickup_time) - new Date(b.pickup_time);
        });

        orderContainer.innerHTML = ''; // 前の注文カードをクリア
        pendingOrders.forEach(async order => {

          const {color,message} = await timeGet(order.pickup_time)
          const pickupTime = new Date(order.pickup_time);
          const hours = pickupTime.getUTCHours(); // UTC時間で時間を取得
          const minutes = pickupTime.getUTCMinutes(); // UTC時間で分を取得
            playAlarmIfEnabled(order.alarm_enabled, order.id);

            let tableDisplay = '';

            if(order.order_type==='uber'){
              tableDisplay = `uber<br>№:${order.order_name}`
            }else if(order.order_type==='demaekan'){
              tableDisplay = `demaekan<br>№:${order.order_name}`
            }else if(order.order_type==='local'){
              tableDisplay = `mesa:${order.table_no}<br> nome:${order.order_name}`
            }else if(order.order_type==='outros'){
              tableDisplay = `outros<br>${order.order_name}`
            }else if(order.order_type==='takeout'){
              tableDisplay = `take out<br>nome:${order.order_name}`
            }
            const orderCard = document.createElement('div');
            orderCard.classList.add('order-card-comanda');
            orderCard.innerHTML = `
                <h3>${tableDisplay}</h3>
                <div class="order-time-div" style="background-color: ${color} !important;">
                  <span>${t('pickup_time')} ${hours}:${minutes}</span>
                </div>
                <div class="order-time-div" style="background-color: ${color} !important;"><span>${message}</span></div>
                <p class="valor-p">Valor: ${formatPrice(order.total_amount)}</p>
                <div class="order-items"></div>
            `;

            const orderItemsContainer = orderCard.querySelector('.order-items');
            order.OrderItems.forEach(item => {
              const menuItemName = MainData.menus.filter(items => items.id === item.menu_id)[0];

              const options = JSON.parse(item.options).map(opt => {
                const optionName = getOptionNameById(opt.id);
                return `${optionName}`;
              }).join(', ');

              const itemElement = document.createElement('div');
              itemElement.classList.add('order-item');

              const statusClass = item.serve_status === 'pending' ? 'pending' : 'served';
              const statusText = item.serve_status === 'pending' ? '✕' : '〇';
              console.log(menuItemName)
                 console.log(menuItemName.imagem_string)
                 const safeRecipe = (menuItemName.recipe || '')
                   .replace(/"/g, '&quot;')  // ダブルクォート対策
                   .replace(/\n/g, '\\n');   // 改行を文字列として保持

                 itemElement.innerHTML = `
                   <div class="left-div">
                     <div class="item-name-div item-clickable"
                          data-img="${menuItemName.imagem_string}"
                          data-recipe="${safeRecipe}">
                       ${menuItemName.admin_item_name}✕${item.quantity}
                     </div>
                     <div class="option-div">
                       <span>${options.length > 0 ? options : ''}</span>
                     </div>
                   </div>
                   <div class="right-div">
                     <div class="serve-status ${statusClass}" data-item-id="${item.id}">${statusText}</div>
                   </div>
                 `;


              // クリックイベント追加
              itemElement.addEventListener('click', e => {
                const nameDiv = e.target.closest('.item-name-div');
                console.log(e.target)
                if (!nameDiv) return;
                const img = nameDiv.dataset.img;
                let recipe = nameDiv.dataset.recipe;

                try {
                  recipe = JSON.parse(recipe); // 文字列→実データに変換
                } catch (e) {
                  // そのまま使う
                }

                document.getElementById('modal-description').innerHTML = recipe.replace(/\n/g, '<br>');
                document.getElementById('order-image').src = img || '';
                document.getElementById('image-modal').classList.remove('hidden');
              });


              document.getElementById('modal-close').addEventListener('click', () => {
                document.getElementById('image-modal').classList.add('hidden');
              });


              orderItemsContainer.appendChild(itemElement);
            });

            // モーダル閉じる処理
            // document.getElementById('modal-close').addEventListener('click', () => {
            //   document.getElementById('image-modal').classList.add('hidden');
            // });

            // カードをスライダー内に追加
            orderContainer.appendChild(orderCard);
            hideLoadingPopup();
        });
    };

    function t(key) {
     return translation[currentLang][key] || key;
    }


      function applyTranslation(lang) {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
          const key = el.getAttribute('data-i18n');
          const translated = translation[lang][key] || key;
          updateData()
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
       });

       applyTranslation(currentLang)
        document.getElementById('language-select').value = currentLang;

    // イベントデリゲーションを使って、親要素にイベントリスナーを追加
    orderContainer.addEventListener('click', function (event) {
        if (event.target.classList.contains('serve-status')) {
            const statusDiv = event.target;
            const itemId = statusDiv.getAttribute('data-item-id');
            const currentStatus = statusDiv.textContent.trim();
            const newStatus = currentStatus === '✕' ? '〇' : '✕';
            statusDiv.textContent = newStatus;
            const newClass = newStatus === '✕' ? 'pending' : 'served';
            statusDiv.classList.remove('pending', 'served');
            statusDiv.classList.add(newClass);
            updateStatus(itemId, newStatus);
        }
    });

    // 最初のデータ更新を実行
    await updateData();
    // 30秒ごとにデータ更新を実行
    setInterval(updateData, 30000);



    function formatPrice(amount) {
        return `¥${parseFloat(amount).toLocaleString()}`;
    }

    function timeGet(time) {
        // ISOフォーマットの時間をそのまま日本時間として解釈するため、'Z'を除去
        const pickupTime = new Date(time.replace('Z', ''));  // 'Z'を削除してそのまま日本時間として扱う
        // 現在の日本時間を取得
        const now = new Date();
        // 時間差を計算
        const timeDifferenceMs = pickupTime.getTime() - now.getTime();
        // ミリ秒を時間、分、秒に変換
        const hoursDiff = Math.floor(Math.abs(timeDifferenceMs) / (1000 * 60 * 60)).toString().padStart(2, '0');
        const minutesDiff = Math.floor((Math.abs(timeDifferenceMs) % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const secondsDiff = Math.floor((Math.abs(timeDifferenceMs) % (1000 * 60)) / 1000).toString().padStart(2, '0');
        // 未来の場合と過去の場合で出力を分ける
        if (timeDifferenceMs > 0) {
            return {
              color: '#ADD8E6',
              message: `${t('time_left')}: ${hoursDiff}:${minutesDiff}:${secondsDiff}`
            };
          } else {
            return {
              color: '#FF7F7F',
              message: `${t('time_passed')}: ${hoursDiff}:${minutesDiff}:${secondsDiff}`
            };
          }

    }

    function getOptionNameById(optionId) {
        const optionDetail = MainData.options.find(option => option.id - 0 === optionId - 0);
        const dbLang = currentLang === 'jp' ? 'ja' : currentLang;
        return optionDetail ? optionDetail[`option_name_${dbLang}`] : t('unknown_option');

    }

    function updateStatus(itemId, newStatus) {
        const statusToUpdate = newStatus === '〇' ? 'served' : 'pending';
        fetch(`${server}/orderskun/update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderItemId: itemId,
                newStatus: statusToUpdate
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Status updated:', data);
        })
        .catch(error => {
            console.error('Error updating status:', error);
        });
    }

    function playAlarmIfEnabled(alarmFlug, id) {
        updateAlarmStatus(id, false);
        if (alarmFlug) {
            const alarmSound = document.getElementById('alarmSound');
            alarmSound.play().catch(error => {
                console.error('Error playing sound:', error);
            });
        }
    }
});

async function fetchPendingOrders() {
    try {
        const response = await fetch(`${server}/orderskun/pending`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ client_id: clients.id })
        });
        if (!response.ok) {
            throw new Error('Failed to fetch pending orders');
        }
        const pendingOrders = await response.json();
          hideLoadingPopup();
        console.log('Pending Orders:', pendingOrders);
        return pendingOrders;
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        return null;
    }
}
function updateAlarmStatus(orderId, alarmStatus) {
    // サーバーにPOSTリクエストを送信して、alarm_enabled を true または false に更新
    fetch(`${server}/orderskun/update-alarm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId: orderId, alarmStatus: alarmStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log('Alarm status updated:', data.message);
        } else {
            console.error('Error updating alarm status');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
