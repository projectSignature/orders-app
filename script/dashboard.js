const token = window.localStorage.getItem('token');
if (!token) {
   window.location.href = '../index.html';
}
const decodedToken = jwt_decode(token); // jwtDecodeではなくjwt_decodeを使用
let nameSpan = document.getElementById('spn-representative')
let userInfo={}
let currentSaleId = ""
// 新しい画像のパスを設定
document.getElementById('logoImage').src = decodedToken.receipt_logo_url;
document.addEventListener("DOMContentLoaded", async () => {

   userInfo.language = decodedToken.language;
   userInfo.id = decodedToken.userId;
   userInfo.representativeName = decodedToken.username;
   userInfo.email = decodedToken.email;
   nameSpan.innerText = decodedToken.username;
   userInfo.current_password = '';
   userInfo.password = '';
   userInfo.confirm_password = '';

   // 今日の日付を取得
   const today = new Date();
   const year = today.getFullYear();
   const month = String(today.getMonth() + 1).padStart(2, '0'); // 月を2桁にする
   const day = String(today.getDate()).padStart(2, '0'); // 日を2桁にする

   // 今月の1日を設定
   document.getElementById('salesStart').value = `${year}-${month}-01`;
   // 今日の日付を設定
   document.getElementById('salesFinish').value = `${year}-${month}-${day}`;

   document.getElementById('serche-sales').addEventListener('click',getOrdersbyPickupTime)

getOrdersbyPickupTime()
  // fetchTotalSales()
  async function getOrdersbyPickupTime() {
      showLoadingPopup();
      const startDate = `${salesStart.value} 00:00:00.000Z`;  // UTC指定のため'Z'を追加
      const endDate = `${salesFinish.value} 23:59:59.999Z`;   // 23:59:59を設定
      try {
          // `await` を `fetch` の前に追加
          const response = await fetch(`${server}/orderskun/pickup-time/range?startDate=${startDate}&endDate=${endDate}&user_id=${decodedToken.restaurant_id}`, {
              method: 'GET',
              headers: {
                  'Content-Type': 'application/json'
              }
          });
          const data = await response.json();
          hideLoadingPopup();
          if (data.length > 0) {
            const dailyTotals = {};
            let totalSum = 0; // 総合計
            data.forEach(order => {
                // pickup_timeを日付形式に変換
                const date = new Date(order.pickup_time).toISOString().slice(0, 10);
                // total_amountを数値に変換して日ごとに集計
                const amount = parseFloat(order.total_amount);
                dailyTotals[date] = (dailyTotals[date] || 0) + amount;
                // 総合計を計算
                totalSum += amount;
                });
                document.getElementById('totalSales').textContent = `¥${parseFloat(totalSum).toLocaleString()}`
                createCrdsBySale(dailyTotals)
                createSalesChart(dailyTotals)
          } else {
              console.log('No orders found for the given pickup time');
          }
      } catch (error) {
          hideLoadingPopup();
          console.error('Error fetching orders by pickup time:', error);
      }
  }
})



function createCrdsBySale(dailyTotals) {
  const cardContainer = document.getElementById('expensesChartContainer');
  cardContainer.innerHTML=""
  // タイトル要素を作成してスタイルを設定
  const title = document.createElement('h3');
  title.textContent = 'Vendas por dia';
  title.style.textAlign = 'center';
  title.style.marginBottom = '20px';
  title.style.color = '#ffffff';
  title.style.fontWeight = 'bold';
  title.style.fontSize = '1.5em';
  title.style.backgroundColor = '#333333';
  title.style.padding = '10px';
  title.style.borderRadius = '8px';
  // タイトルをコンテナに追加
  cardContainer.appendChild(title);
  // 曜日の配列
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  // dailyTotalsオブジェクトを日付ごとにカード生成
  Object.entries(dailyTotals).forEach(([dateString, totalSales]) => {
      const date = new Date(dateString);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekday = weekdays[date.getDay()]; // 曜日を取得
      const formattedDate = `${month}/${day} (${weekday})`;

      // カード要素を作成
      const card = document.createElement('div');
      card.className = 'expense-card';

      // カードの内容を設定
      card.innerHTML = `
          <div class="expense-card-body">
              <h5 class="expense-card-title">${formattedDate}</h5>
              <p class="expense-card-text">¥${totalSales.toLocaleString()}</p>
          </div>
      `;

      // カードをコンテナに追加
      cardContainer.appendChild(card);
  });
}

let salesChart;  // グローバル変数として定義

function createSalesChart(dailyTotals) {
    // 既に存在するグラフがある場合、破棄する
    if (salesChart) {
        salesChart.destroy();
    }

    // 曜日の配列
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

    // 日付ごとのラベルを作成
    const labels = Object.keys(dailyTotals).map(dateString => {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = weekdays[date.getDay()];
        return `${month}/${day} (${weekday})`;  // "MM/DD (曜日)"形式
    });

    // 日付ごとの売上データ
    const salesData = Object.values(dailyTotals).map(totalSales => parseFloat(totalSales));

    // Canvas要素のコンテキストを取得
    const ctx = document.getElementById('salesChart').getContext('2d');

    // グラフを生成し、グローバル変数に格納
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '',  // タイトルを空にして非表示にする
                data: salesData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: true,  // 塗りつぶしを有効にする
                tension: 0.4,  // 曲線を滑らかにする
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false  // 凡例を非表示にする
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false  // X軸のグリッド線を非表示にする
                    },
                    ticks: {
                        display: true  // X軸のラベルは表示
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false  // Y軸のグリッド線を非表示にする
                    },
                    ticks: {
                        display: true  // Y軸のラベルは表示
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 3  // 線の太さを変更
                },
                point: {
                    radius: 4,  // データポイントのサイズを設定
                    backgroundColor: 'rgba(75, 192, 192, 1)',  // データポイントの色を設定
                }
            },
            layout: {
                padding: 10  // グラフ周囲に余白を追加
            }
        }
    });
}


   const analistButton = document.querySelector('.button-container button:nth-child(1)')
//    const salesButton = document.querySelector('.button-container button:nth-child(2)')
//    const registerButton = document.querySelector('.button-container button:nth-child(3)')
   const settingsButton = document.querySelector('.button-container button:nth-child(2)');
   const settingsList = document.getElementById('settingsList');
//    const salesChartContainer = document.getElementById('salesChartContainer');
   const expensesChartContainer = document.getElementById('expensesChartContainer');
//    const registerFilter = document.getElementById('registerFilter');
//    const registerHistory = document.getElementById('registerHistory');
   const totalincome = document.getElementById('card_income')
   const totalexpense = document.getElementById('card_expense')
   const salesContainer = document.getElementById('registerSalesHistory')
   const settingsModal = document.getElementById('settingsModal');
   const modalTitle = document.getElementById('modalTitle');
   const modalBody = document.getElementById('modalBody');
   const closeModal = document.querySelector('.modal .close');
   const saveButton = document.getElementById('saveButton');
   const personalSettings = document.getElementById('personalSettingsForm');
   const rangeDatasToAnalize = document.getElementById('range-serch-datas');
//    // 今日の日付を取得
//     const today = new Date();
//     const yyyy = today.getFullYear();
//     const mm = String(today.getMonth() + 1).padStart(2, '0'); // 月は0から始まるので+1する
//     const dd = String(today.getDate()).padStart(2, '0');
//     // 今月の初日を設定
//     const firstDayOfMonth = `${yyyy}-${mm}-01`;
//     const todayFormatted = `${yyyy}-${mm}-${dd}`;
//
//     // デフォルト値として初日と今日の日付を設定
//     document.getElementById('startDate').value = firstDayOfMonth;
//     document.getElementById('endDate').value = todayFormatted;
//
    // 分析ボタンのイベントリスナー
    analistButton.addEventListener('click', async() =>{
        toggleDisplay(
            [salesChartContainer, expensesChartContainer, totalincome,rangeDatasToAnalize], // 表示する要素
            [salesContainer, registerFilter, registerHistory, settingsList] // 非表示にする要素
        );
    });
//
    // 売上ボタンのイベントリスナー
    // salesButton.addEventListener('click', async()=>{
    //   loadingIndicator.style.display = 'block';
    //     toggleDisplay(
    //         [registerFilter, registerHistory], // 表示する要素
    //         [salesChartContainer, expensesChartContainer, totalincome, settingsList] // 非表示にする要素
    //     );
    //
    //     // デフォルト日付でレジ履歴を自動的に表示
    //     await fetchAndDisplaySalesHistory(firstDayOfMonth, todayFormatted);
    //     loadingIndicator.style.display = 'none';
    // });
//
//     // レジ履歴ボタンのイベントリスナー
//     registerButton.addEventListener('click', async() => {
//       loadingIndicator.style.display = 'block';
//         toggleDisplay(
//             [registerFilter, registerHistory], // 表示する要素
//             [salesChartContainer, expensesChartContainer, totalincome, salesContainer, settingsList] // 非表示にする要素
//         );
//         await fetchAndDisplayRegisterHistory(firstDayOfMonth, todayFormatted);
//           loadingIndicator.style.display = 'none';
//     });
//
    // 設定ボタンのイベントリスナー
    settingsButton.addEventListener('click', function () {
        // 設定リストの表示/非表示を切り替える
        if (settingsList.style.display === 'none') {
            toggleDisplay([settingsList], [salesChartContainer, expensesChartContainer, totalincome, salesContainer, registerFilter, registerHistory,rangeDatasToAnalize]);
        } else {
            settingsList.style.display = 'none';
        }
    });
//
    settingsList.querySelector('li:first-child').addEventListener('click', function () {
        settingsList.style.display = 'none';
        // personalSettings.style.display = 'block';
    });
//
//
function toggleDisplay(showElements, hideElements) {
    showElements.forEach(element => {
        console.log(element);

        if (element.id === 'expensesChartContainer') {
            // 一度 display を none にし、少し遅延を加えて flex に戻す
            element.style.display = 'none';
            setTimeout(() => {
                element.style.display = 'flex';
                element.style.justifyContent = 'center';
                element.style.alignItems = 'center';
            }, 10); // 適切な遅延時間を設定
        }else if(element.id==='card_income'){
          document.getElementById('card_income').style.display = 'flex';
          document.getElementById('card_income').style.alignItems = 'center'; // 中央揃え
          document.getElementById('card_income').style.gap = '10px'; // h2とpの間隔を調整)
        }else {
            element.style.display = 'block';
        }
    });

    hideElements.forEach(element => {
        element.style.display = 'none';
    });
}

//      // フィルターボタンをクリックしたときの動作
//      document.getElementById('filterButton').addEventListener('click', async () => {
//          const startDate = document.getElementById('startDate').value;
//          const endDate = document.getElementById('endDate').value;
//
//          if (!startDate || !endDate) {
//              alert('開始日と終了日を選択してください。');
//              return;
//          }
//
//          await fetchAndDisplayRegisterHistory(startDate, endDate);
//      });
//
//      // レジ履歴データを取得し、表示する関数
//      async function fetchAndDisplayRegisterHistory(startDate, endDate) {
//          try {
//            loadingIndicator.style.display = 'block';
//              const response = await fetch(`${server}/pos/register-history?start_date=${startDate}&end_date=${endDate}`, {
//                  method: 'GET',
//                  headers: {
//                      'Authorization': `Bearer ${token}`,  // トークンをヘッダーに含める
//                      'Content-Type': 'application/json'
//                  }
//              });
//
//              if (!response.ok) {
//                loadingIndicator.style.display = 'none';
//                  throw new Error('データ取得に失敗しました');
//              }
//              const data = await response.json();
//              // レジ履歴を表示
//              let historyHtml = '';
//              data.forEach(record => {
//                 historyHtml += `
//                 <div class="register-card">
//                     <div class="register-card-header">
//                         <h3><i class="fas fa-cash-register"></i>caixa: ${record.register_id}</h3>
//                         <p class="time-info"><i class="fas fa-clock"></i> ${new Date(record.open_time).toLocaleString()} 〜 ${record.close_time ? new Date(record.close_time).toLocaleString() : '未閉店'}</p>
//                     </div>
//                     <div class="register-card-body">
//                         <div class="balance-info">
//                             <div>
//                                 <span><i class="fas fa-hand-holding-usd"></i>Saldo inicial(dinheiro):</span>
//                                 <span class="amount">¥${parseFloat(record.cash_opening_balance).toLocaleString()}</span>
//                             </div>
//                             <div>
//                                 <span><i class="fas fa-wallet"></i>Saldo inicial(outros):</span>
//                                 <span class="amount">¥${parseFloat(record.other_opening_balance).toLocaleString()}</span>
//                             </div>
//                             <div>
//                                 <span><i class="fas fa-hand-holding-usd"></i>Saldo final(dinheiro):</span>
//                                 <span class="amount">¥${parseFloat(record.cash_closing_balance).toLocaleString()}</span>
//                             </div>
//                             <div>
//                                 <span><i class="fas fa-wallet"></i>Saldo final(outros):</span>
//                                 <span class="amount">¥${parseFloat(record.other_closing_balance).toLocaleString()}</span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>`;
//             });
//              registerHistory.innerHTML = historyHtml;
//          } catch (error) {
//            loadingIndicator.style.display = 'none';
//              // console.error('Error fetching register history:', error);
//              alert('レジ履歴の取得中にエラーが発生しました');
//          }
//
//    };
//
   const listItems = settingsList.querySelectorAll('li');
   listItems.forEach(item => {
       item.addEventListener('click', async function () {
         loadingIndicator.style.display = 'none';
           const rawSettingName = this.textContent.trim();
           const settingKey = settingMap[rawSettingName];

           if (settingKey === 'menu') {
               try {
                   const response = await fetch(`${server}/pos/getmenu`, {
                       method: 'GET',
                       headers: {
                           'Authorization': `Bearer ${token}`,
                           'Content-Type': 'application/json'
                       }
                   });
                   if (!response.ok) {
                     loadingIndicator.style.display = 'none';
                       throw new Error('Erro no sistema');
                   }
                   const menuItems = await response.json();
                   displayMenuItems(menuItems);
               } catch (error) {
                   console.error('メニュー取得エラー: ', error);
               }
               return; // 以降の処理をスキップ
           }

           if (settingKey) {
               modalTitle.textContent = rawSettingName;
               modalBody.innerHTML = generateModalContent(settingKey);
               settingsModal.style.display = 'block';

           } else {
               console.error('未対応の設定名: ' + rawSettingName);
           }
       });
   });
//
//    // メニュー一覧を表示する関数
//    // メニュー一覧を表示する関数
//    function displayMenuItems(menuItems) {
//        modalTitle.textContent = 'Lista de menu';
//        modalBody.innerHTML = ''; // モーダルの内容をクリア
//
//        // 新規作成ボタンを追加
//        const createButton = document.createElement('button');
//        createButton.textContent = 'Adicionar';
//        createButton.classList.add('create-button');
//        createButton.addEventListener('click', () => {
//            openCreateMenuModal();
//        });
//        modalBody.appendChild(createButton);
//
//        // メニューアイテムをカード形式で表示
//        menuItems.forEach(item => {
//            const price = parseFloat(item.price); // 価格を数値に変換
//
//            const card = document.createElement('div');
//            card.classList.add('menu-card');
//            card.innerHTML = `
//                <h3>${item.item_name} (${item.item_name_jp || 'N/A'})</h3>
//                <p>Categoria: ${item.category || 'N/A'} (${item.category_jp || 'N/A'})</p>
//                <p>Valor: ¥${price.toFixed(2)}</p> <!-- 数値に変換された価格を表示 -->
//                <p>Tipo: ${item.unit}</p>
//                <p>Discrição${item.description || ''}</p>
//                <button class="edit-button">Alterar</button>
//                <button class="delete-button">Deletar</button>
//            `;
//
//            // 変更ボタンのクリックイベント
//            card.querySelector('.edit-button').addEventListener('click', () => {
//                openEditMenuModal(item);
//            });
//
//            // 削除ボタンのクリックイベント
//            card.querySelector('.delete-button').addEventListener('click', () => {
//                deleteMenuItem(item.id);
//            });
//
//            modalBody.appendChild(card);
//        });
//
//        settingsModal.style.display = 'block';
//    }
//
//    // 新規メニュー作成フォームを生成する関数
//    function generateCreateMenuForm() {
//        return `
//            <form id="createMenuForm">
//                <label for="menuId">Código na balança:</label>
//                <input type="text" id="menuId" name="menuId" pattern="\\d{5}" required title="5 dígitos"><br>
//
//                <label for="itemName">Nome(pt):</label>
//                <input type="text" id="itemName" name="itemName" required><br>
//
//                <label for="itemNameJp">Nome(jp):</label>
//                <input type="text" id="itemNameJp" name="itemNameJp"><br>
//
//                <label for="category">Categoria(pt):</label>
//                <input type="text" id="category" name="category" required><br>
//
//                <label for="categoryJp">Categoria(jp):</label>
//                <input type="text" id="categoryJp" name="categoryJp"><br>
//
//                <label for="price">Preço:</label>
//                <input type="number" id="price" name="price" step="0.01" required><br>
//
//                <label for="unit">kg ou peça?:</label>
//                <select id="unit" name="unit" required>
//                    <option value="kg">kg</option>
//                    <option value="peça">peça</option>
//                </select><br>
//
//                <label for="description">descrição:</label>
//                <textarea id="description" name="description"></textarea><br>
//
//                <label for="available">Estoque:</label>
//                <input type="checkbox" id="available" name="available" checked><br>
//
//                <label for="isVisible">Mostrar na tela:</label>
//                <input type="checkbox" id="isVisible" name="isVisible" checked><br>
//
//                <button type="submit">Registrar</button>
//            </form>
//        `;
//    }
//
//
//
// // 新規作成モーダルを開く関数
// function openCreateMenuModal() {
//     modalTitle.textContent = 'Adicionar menu';
//     modalBody.innerHTML = generateCreateMenuForm(); // 新規作成フォームを生成
//     settingsModal.style.display = 'block';
//     const btnSaveModal = document.getElementById('savebtn-form')
//     btnSaveModal.style="display:none"
//
//     // フォーム送信イベントの設定
//     const createMenuForm = document.getElementById('createMenuForm');
//     createMenuForm.addEventListener('submit', async function (e) {
//         e.preventDefault();
//         await createNewMenu();
//     });
// }
//
// // 新規メニューを作成する関数
// async function createNewMenu() {
// loadingIndicator.style.display = 'block';
//     const itemName = document.getElementById('itemName').value;
//     const itemNameJp = document.getElementById('itemNameJp').value;
//     const category = document.getElementById('category').value;
//     const categoryJp = document.getElementById('categoryJp').value;
//     const price = parseFloat(document.getElementById('price').value);
//     const unit = document.getElementById('unit').value;
//     const description = document.getElementById('description').value;
//     const available = document.getElementById('available').checked;
//     const isVisible = document.getElementById('isVisible').checked;
//     const menu_id  = document.getElementById('menuId').value
//
//     const newMenuItem = {
//       menu_id:menu_id,
//         item_name: itemName,
//         item_name_jp: itemNameJp,
//         category: category,
//         category_jp: categoryJp,
//         price: price,
//         unit: unit,
//         description: description,
//         available: available,
//         isVisible: isVisible
//     };
//
//     try {
//         const response = await fetch(`${server}/pos/createmenuaddcolomun`, {
//             method: 'POST',
//             headers: {
//               'Authorization': `Bearer ${token}`,
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(newMenuItem)
//         });
//
//         if (!response.ok) {
//           loadingIndicator.style.display = 'none';
//            const errorData = await response.json();
//            if (response.status === 400 && errorData.message.includes('Menu ID is already in use')) {
//                alert('O código da balança já existe, verifique por favor。');
//            } else {
//                throw new Error(errorData.message || 'Tivemos erros');
//            }
//            return;
//        }
//         alert('Adicionado');
//         settingsModal.style.display = 'none';
//     } catch (error) {
//       loadingIndicator.style.display = 'none';
//         console.error('erro: ', error);
//         alert('Tivemos erro, tente novamente');
//     }
// }
//
//
//
// // // 新規作成モーダルを開く関数
// // function openCreateMenuModal() {
// //     modalTitle.textContent = 'Adicionar　menu';
// //     modalBody.innerHTML = generateCreateMenuForm(); // 新規作成フォームを生成
// //     settingsModal.style.display = 'block';
// //     const btnSaveModal = document.getElementById('savebtn-form')
// //     btnSaveModal.style="display:none"
// // }
//
// // メニュー編集モーダルを開く関数
// // function openEditMenuModal(item) {
// //     modalTitle.textContent = 'メニュー編集';
// //     modalBody.innerHTML = generateEditMenuForm(item); // 編集フォームを生成
// //     settingsModal.style.display = 'block';
// // }
//
// // メニューを削除する関数
// async function deleteMenuItem(id) {
//     if (!confirm('Deseja deletar？')) return;
//
//     try {
//       loadingIndicator.style.display = 'block';
//         const response = await fetch(`${server}/pos/deletemenu/${id}`, {
//             method: 'DELETE',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//         if (!response.ok) {
//
//             throw new Error('Tivemos erro no sistema');
//         }
//         alert('TIvemos erro no sistema');
//         // 削除後にメニューを再取得して更新
//         const updatedMenuResponse = await fetch(`${server}/pos/getmenu`, {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             }
//         });
//         const updatedMenuItems = await updatedMenuResponse.json();
//         displayMenuItems(updatedMenuItems);
//         loadingIndicator.style.display = 'none';
//     } catch (error) {
//       loadingIndicator.style.display = 'none';
//         console.error('削除エラー: ', error);
//     }
// }
//
//
       closeModal.addEventListener('click', function () {
           settingsModal.style.display = 'none';
       });
//
//        window.addEventListener('click', function (event) {
//            if (event.target == settingsModal) {
//                settingsModal.style.display = 'none';
//            }
//        });
//
       function generateModalContent(settingKey) {
           switch (settingKey) {
               case 'personal_settings':
                   return `
                       <form id="personalSettingsForm">
                           <h2>mude o campo que deseja</h2>
                           <div class="form-group">
                               <label for="currentPassword">Senha atual:</label>
                               <input type="password" id="currentPassword" name="current_password" value="">
                           </div>
                           <div class="form-group">
                               <label for="password">Nova senha:</label>
                               <input type="password" id="password" name="password" value="">
                           </div>
                           <div class="form-group">
                               <label for="confirmPassword">Confirmar senha:</label>
                               <input type="password" id="confirmPassword" name="confirm_password" value="">
                           </div>
                           <div class="form-group">
                               <label for="email_form">email:</label>
                               <input type="text" id="form_email" name="email" value="${userInfo.email}">
                           </div>
                           <div class="form-group">
                               <label for="representativeName">Nome do representante:</label>
                               <input type="text" id="representativeName" name="representativeName" value="${nameSpan.innerText}">
                           </div>
                           <div class="form-group">
                               <label for="language">Idioma:</label>
                               <select id="language" name="language">
                                   <option value="pt" ${userInfo.language==='pt'?'selected':''}>Português</option>
                                   <option value="en" ${userInfo.language==='en'?'selected':''}>Inglês</option>
                                   <option value="ja" ${userInfo.language==='ja'?'selected':''}>Japonês</option>
                               </select>
                           </div>
                       </form>
                   `;
               case 'register_number':
                   return '<p>Formulário para Número do Caixa</p>';
               case 'cashier':
                   return '<p>Formulário para Responsável pelo Caixa</p>';
               default:
                   return '<p>Por favor, selecione uma opção de configuração.</p>';
           }
       }
//個人情報の変更エレメント
       const saveButtonForm = document.getElementById('saveButton');
       saveButtonForm.addEventListener('click', async function() {
           event.preventDefault();
// 現在表示されているフォームを動的に取得
    const currentForm = document.querySelector('form');
    if (!currentForm) {
        alert('Erro no sistema');
        return;
    }
 // フォームのデータを取得
    const formData = new FormData(currentForm);
  // データをJSON形式に変換し、変更があったフィールドのみ追加
  const data = {};
  for (let [key, value] of formData.entries()) {
// 変更があったかどうかをチェック (userInfo[key] が存在するか確認)
      if (userInfo[key] !== undefined && userInfo[key] !== value) {
        console.log(key)
        console.log(userInfo[key])
        console.log(value)
// パスワード関連のフィールドかどうかをチェック
          if (['current_password', 'password', 'confirm_password'].includes(key)) {
              const currentPass = document.getElementById('currentPassword').value.trim();
              const newPass = document.getElementById('password').value.trim();
              const confirmPass = document.getElementById('confirmPassword').value.trim();
// パスワード関連のフィールドのチェック
              if (currentPass === "" || newPass === "" || confirmPass === "") {
                  alert('Todos os campos de senha devem estar preenchidos.');
                  break;  // ループを抜ける
              } else if (newPass !== confirmPass) {
                  alert('A senha nova deve ser igual à confirmação.');
                  break;  // ループを抜ける
              }
          }
          data[key] = value;
      }
  }
//配列に変化が合ったか確認する
  if (Object.keys(data).length === 0) {
      alert('Nenhuma alteração foi feita.');
      return;  // 処理を終了
  }
    // user_id を userInfo.id から追加
    if (userInfo && userInfo.id) {
        data.id = userInfo.id;
    } else {
        alert('User ID não encontrado');
        return;
    }
    updateInformations(data)
    settingsModal.style.display = 'none';
});
//
async function updateInformations(dataobject){
  try {
    console.log(dataobject)
      // APIエンドポイントにPOSTリクエストを送信
      const response = await fetch(`${server}/orderskun/updateSettings`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataobject)
      });

      if (response.status===200) {
        nameSpan.innerText = document.getElementById('representativeName').value
        userInfo.representativeName = document.getElementById('representativeName').value
        userInfo.email = document.getElementById('form_email').value
        userInfo.current_password = document.getElementById('currentPassword').value
        userInfo.password = document.getElementById('password').value
        userInfo.confirm_password = document.getElementById('confirmPassword').value
          const result = await response.json();
          console.log('保存成功:', result);
          alert('Feito com sucesso');
      }else if(response.status===401){
        alert('Senha atual incorreta');
      } else {
          console.error('保存失敗:', response.status);
          alert('Tivemos erro no registro');
      }
  } catch (error) {
      console.error('エラー発生:', error);
      alert('Tivemos erro no registro');
  }

}
//
//    async function fetchAndDisplaySalesHistory(startDate, endDate) {
//      loadingIndicator.style.display = 'block';
//        try {
//            const response = await fetch(`${server}/pos/sales-history?start_date=${startDate}&end_date=${endDate}`, {
//                method: 'GET',
//                headers: {
//                    'Authorization': `Bearer ${token}`,  // トークンをヘッダーに含める
//                    'Content-Type': 'application/json'
//                }
//            });
//
//            if (!response.ok) {
//                throw new Error('Tivemos erro no sistema');
//            }
//            const data = await response.json();
//            data.sort((a,b)=>{
//              return a.sale_id - b.sale_id
//            })
//
//            registerHistory.innerHTML = ''; // 既存の内容をクリア
//            data.forEach(sale => {
//                registerHistory.innerHTML += createSaleCard(sale);
//            });
//         } catch (error) {
//            console.error('Error fetching register history:', error);
//            alert('Tivemos erro no sistema');
//        }
//  loadingIndicator.style.display = 'none';
//  };
//
//  function createSaleCard(sale) {
//      const card = `
//          <div class="custom-sale-card" style="margin-bottom: 20px;" data-sale-id="${sale.sale_id}">
//              <div class="custom-sale-card-body">
//                  <h5 class="custom-sale-card-title">Número de registro: ${sale.sale_id}</h5>
//                  <p class="custom-sale-card-text">
//                      <strong>Valor:</strong> ¥${parseFloat(sale.total_price).toLocaleString()}<br>
//                      <strong>Data:</strong> ${new Date(sale.transaction_time).toLocaleString()}<br>
//                      <strong>Pagamento:</strong> ${sale.pay_type}
//                  </p>
//                  <div class="moda-btn-update-modal">
//                    <button class="custom-sale-btn custom-sale-btn-info" onclick='showItemDetails(${JSON.stringify(sale.item_details)})'>
//                 <i class="fas fa-eye"></i>
//               </button>
//               <button class="custom-sale-btn custom-sale-btn-primary" onclick='showUpdateModal(${JSON.stringify(sale)})'>
//                 <i class="fas fa-edit"></i>
//               </button>
//
//               <button class="custom-sale-btn custom-sale-btn-danger" onclick="deleteSale(${sale.sale_id})">
//                 <i class="fas fa-trash-alt"></i>
//               </button>
//               </div>
//              </div>
//          </div>
//      `;
//      return card;
//  }
//
//    // フィルターボタンをクリックしたときの動作
//    document.getElementById('filterButton').addEventListener('click', async () => {
//      console.log('koko')
//        const startDate = document.getElementById('startDate').value;
//        const endDate = document.getElementById('endDate').value;
//        if (!startDate || !endDate) {
//            alert('Selecione os dias');
//            return;
//        }
//
//        fetchAndDisplayRegisterHistory(startDate,endDate)
//        loadingIndicator.style.display = 'none';
//
//    });
//
// })
//
// function showItemDetails(itemDetails) {
//     const detailsHTML = itemDetails.map(item => `
//         <li>
//             <strong>Nome:</strong> ${item.item_name}<br>
//             <strong>Quantidade:</strong> ${item.quantity}<br>
//             <strong>Valor:</strong> ¥${parseFloat(item.total_price).toLocaleString()}
//         </li>
//     `).join('');
//
//     const popupContent = `
//         <div class="popup-overlay">
//             <div class="popup-content">
//                 <h3>Lista da venda</h3>
//                 <ul>${detailsHTML}</ul>
//                 <button class="custom-sale-btn custom-sale-btn-close" onclick="closePopup()">Voltar</button>
//             </div>
//         </div>
//     `;
//
//     document.body.insertAdjacentHTML('beforeend', popupContent);
// }
//
// function closePopup() {
//     const popupOverlay = document.querySelector('.popup-overlay');
//     if (popupOverlay) {
//         popupOverlay.remove();
//     }
// }
//
// function deleteSale(sale_id) {
//     if (confirm('Deseja deletar o registro？')) {
//         fetch(`${server}/pos/delete/sale`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ sale_id: sale_id })
//         })
//         .then(response => {
//             if (response.ok) {
//                 showToast('Deletado');  // スタイリッシュなトーストメッセージを表示
//                 // 削除されたカードを画面から削除
//                 removeSaleCard(sale_id);
//             } else {
//                 response.json().then(data => {
//                     alert(`Erro: ${data.message}`);
//                 });
//             }
//         })
//         .catch(error => {
//             console.error('削除リクエスト中にエラーが発生しました:', error);
//             alert('Tivemos um erro no sistema');
//         });
//     }
// }
//
// function updateSale(totalPrice, menu, saleId) {
//
//   // 配列をオブジェクト形式に変換し、キーを1から始める
//   const itemDetails = {};
//   menu.forEach((item, index) => {
//     itemDetails[(index + 1).toString()] = {
//       register_id: item.register_id.toString(),
//       cashier_id: item.cashier_id.toString(),
//       menu_id: item.menu_id.toString(),
//       quantity: parseInt(item.quantity, 10),    // 数値に変換
//       total_price: parseFloat(item.total_price),  // 数値に変換
//       pay_type: item.pay_type,
//       tax_rate: parseFloat(item.tax_rate).toFixed(2)  // 小数点2桁に固定
//     };
//   });
//
//   // そのままのJSON文字列を生成
//   const itemDetailsString = JSON.stringify(itemDetails);
//   // console.log('正しい形式の item_details:', itemDetailsString);
//
//   // 更新リクエストを送信する
//   fetch(`${server}/pos/update/sale`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       sale_id: saleId,           // sale_id を送信
//       item_details: itemDetailsString  // 正しいJSON文字列を送信
//     })
//   })
//   .then(response => response.json())
//   .then(data => {
//     if (data.success) {
//       console.log(data)
//       updateSaleCard(data,saleId)
//       showToast('Feito');  // スタイリッシュなトーストメッセージを表示
//       // console.log('販売データが正常に更新されました:', data.message);
//     } else {
//       alert(`Erro: ${data.message}`);
//       // console.error('販売データの更新中にエラーが発生しました:', data.message);
//     }
//   })
//   .catch(error => {
//     alert('Tivemos um erro no sistema');
//     console.error('通信エラーが発生しました:', error);
//   });
// }
//
// // 削除されたカードを画面から削除する関数
// function removeSaleCard(sale_id) {
//     const cardElement = document.querySelector(`[data-sale-id="${sale_id}"]`);
//     if (cardElement) {
//         cardElement.remove();
//     }
// }
//
// async function updateSaleCard(datas,sale_id){
//   try{
//   const cardElement = document.querySelector(`[data-sale-id="${datas.data.sale_id}"]`);
//   cardElement.remove();
//   registerHistory.innerHTML += await createNewSaleCard(datas.data);
//   // 親要素を取得
//   const parentElement = document.querySelector('#registerHistory'); // 親要素のセレクタを指定
//   // 親要素内の data-sale-id 属性を持つすべての子要素を取得
//   const cardElements = Array.from(parentElement.querySelectorAll('[data-sale-id]'));
//   // data-sale-id を基準に要素を昇順で並び替え
//   cardElements.sort((a, b) => {
//     // data-sale-id の値を数値に変換して比較
//     return parseInt(a.getAttribute('data-sale-id')) - parseInt(b.getAttribute('data-sale-id'));
//   });
//   // 並び替えた順番で親要素に再挿入
//   cardElements.forEach(card => {
//     parentElement.appendChild(card);
//   });
//
//   }catch(e){
//    alert('Tivemos um erro no sistema');
//   }
//
// }
//
// function createNewSaleCard(sale) {
//
//     const card = `
//         <div class="custom-sale-card" style="margin-bottom: 20px;" data-sale-id="${sale.sale_id}">
//             <div class="custom-sale-card-body">
//                 <h5 class="custom-sale-card-title">Número de registro: ${sale.sale_id}</h5>
//                 <p class="custom-sale-card-text">
//                     <strong>Valor:</strong> ¥${parseFloat(sale.total_price).toLocaleString()}<br>
//                     <strong>Data:</strong> ${new Date(sale.transaction_time).toLocaleString()}<br>
//                     <strong>Pagamento:</strong> ${sale.pay_type}
//                 </p>
//                 <div class="moda-btn-update-modal">
//                   <button class="custom-sale-btn custom-sale-btn-info" onclick='showItemDetails(${JSON.stringify(sale.item_details)})'>
//                <i class="fas fa-eye"></i>
//              </button>
//              <button class="custom-sale-btn custom-sale-btn-primary" onclick='showUpdateModal(${JSON.stringify(sale)})'>
//                <i class="fas fa-edit"></i>
//              </button>
//
//              <button class="custom-sale-btn custom-sale-btn-danger" onclick="deleteSale(${sale.sale_id})">
//                <i class="fas fa-trash-alt"></i>
//              </button>
//              </div>
//             </div>
//         </div>
//     `;
//     return card;
// }
//
// // メニュー編集フォームを生成する関数
// function generateEditMenuForm(item) {
//     return `
//         <form id="editMenuForm">
//             <label for="menuId">Menu ID (5桁):</label>
//             <input type="text" id="menuId" name="menuId" value="${item.menu_id}" pattern="\\d{5}" required title="5桁の数字を入力してください" disabled><br>
//
//             <label for="itemName">Nome(pt):</label>
//             <input type="text" id="itemName" name="itemName" value="${item.item_name}" required><br>
//
//             <label for="itemNameJp">Nome(jp):</label>
//             <input type="text" id="itemNameJp" name="itemNameJp" value="${item.item_name_jp || ''}"><br>
//
//             <label for="category">Categoria(pt):</label>
//             <input type="text" id="category" name="category" value="${item.category}" required><br>
//
//             <label for="categoryJp">Categoria(jp):</label>
//             <input type="text" id="categoryJp" name="categoryJp" value="${item.category_jp || ''}"><br>
//
//             <label for="price">Preço:</label>
//             <input type="number" id="price" name="price" step="0.01" value="${item.price}" required><br>
//
//             <label for="unit">kg ou peça?:</label>
//             <select id="unit" name="unit" required>
//                 <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>kg</option>
//                 <option value="peça" ${item.unit === 'peça' ? 'selected' : ''}>peça</option>
//             </select><br>
//
//             <label for="description">descrição:</label>
//             <textarea id="description" name="description">${item.description || ''}</textarea><br>
//
//             <label for="available">Estoque:</label>
//             <input type="checkbox" id="available" name="available" ${item.available ? 'checked' : ''}><br>
//
//             <label for="isVisible">Mostrar na tela:</label>
//             <input type="checkbox" id="isVisible" name="isVisible" ${item.isVisible ? 'checked' : ''}><br>
//
//             <button type="submit">Alterar</button>
//         </form>
//     `;
// }
//
// // メニュー編集モーダルを開く関数
// function openEditMenuModal(item) {
//
//     modalTitle.textContent = 'Alterar menu';
//     modalBody.innerHTML = generateEditMenuForm(item); // 編集フォームを生成
//     settingsModal.style.display = 'block';
//
//     // フォーム送信イベントの設定
//     const editMenuForm = document.getElementById('editMenuForm');
//     document.getElementById('savebtn-form').style.display="none"
//     editMenuForm.addEventListener('submit', async function (e) {
//         e.preventDefault();
//         await updateMenuItem(item.id);
//     });
// }
//
// // メニューアイテムを更新する関数
// async function updateMenuItem(id) {
//     const itemName = document.getElementById('itemName').value;
//     const itemNameJp = document.getElementById('itemNameJp').value;
//     const category = document.getElementById('category').value;
//     const categoryJp = document.getElementById('categoryJp').value;
//     const price = parseFloat(document.getElementById('price').value);
//     const unit = document.getElementById('unit').value;
//     const description = document.getElementById('description').value;
//     const available = document.getElementById('available').checked;
//     const isVisible = document.getElementById('isVisible').checked;
//     const updatedMenuItem = {
//         item_name: itemName,
//         item_name_jp: itemNameJp,
//         category: category,
//         category_jp: categoryJp,
//         price: price,
//         unit: unit,
//         description: description,
//         available: available,
//         isVisible: isVisible
//     };
//
//     try {
//         const response = await fetch(`${server}/pos/updatemenucolumnAdd/${id}`, {
//             method: 'PUT',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(updatedMenuItem)
//         });
//
//         if (!response.ok) {
//             throw new Error('Falha no sistema');
//         }
//
//         alert('Feito com sucesso');
//         settingsModal.style.display = 'none';
//     } catch (error) {
//         console.error('更新エラー: ', error);
//         alert('Falha no sistema');
//     }
// }
//
//
// function showToast(message) {
//     const toast = document.createElement('div');
//     toast.className = 'toast';
//     toast.innerText = message;
//     document.body.appendChild(toast);
//
//     // トーストメッセージを表示
//     setTimeout(() => {
//         toast.className = 'toast show';
//     }, 100);
//
//     // 1秒後に自動で消す
//     setTimeout(() => {
//         toast.className = 'toast';
//         // 完全に消えた後でDOMから削除
//         setTimeout(() => {
//             toast.remove();
//         }, 500);
//     }, 1500);
// }
//
//
// let currentSale = null;
//
// function showUpdateModal(sale) {
//   currentSale = sale;
//   currentSaleId = currentSale.sale_id
//   const itemDetailsContainer = document.getElementById('itemDetailsContainer');
//   itemDetailsContainer.innerHTML = ''; // コンテナをクリア
//   sale.item_details.forEach((item, index) => {
//     console.log(index)
//     const priceWithoutDecimals = parseFloat(item.total_price).toFixed(0); // .00 を省く処理
//
//     const itemHtml = `
//       <div class="item-detail" data-index="${index}">
//         <h3>${item.item_name}</h3>
//
//         <div class="input-group">
//           <label>Qua.</label>
//           <div class="quantity-control">
//             <button class="quantity-btn" onclick="decreaseQuantity(${index})">-</button>
//             <input type="number" id="quantity_${index}" name="quantity" value="${item.quantity}" readonly>
//             <button class="quantity-btn" onclick="increaseQuantity(${index})">+</button>
//           </div>
//         </div>
//
//         <div class="input-group">
//           <label for="price_${index}">Valor:</label>
//           <input type="number" id="price_${index}" name="price" value="${priceWithoutDecimals}">
//         </div>
//
//         <button class="custom-sale-btn custom-sale-btn-danger" onclick="deleteItem(${index})">Deletar</button>
//       </div>
//       <hr>
//     `;
//     itemDetailsContainer.innerHTML += itemHtml;
//   });
//
//   document.getElementById('updateModal').style.display = "block";
// }
//
// function increaseQuantity(index) {
//   const quantityInput = document.getElementById(`quantity_${index}`);
//   quantityInput.value = parseInt(quantityInput.value) + 1;
// }
//
// function decreaseQuantity(index) {
//   const quantityInput = document.getElementById(`quantity_${index}`);
//   if (parseInt(quantityInput.value) > 0) {
//     quantityInput.value = parseInt(quantityInput.value) - 1;
//   }
// }
//
//

//
// function saveChanges() {
//   loadingIndicator.style.display = 'block';
//   // updatedItemsのリストを作成
//   const updatedItems = currentSale.item_details.map((item, index) => {
//     const updatedQuantity = document.getElementById(`quantity_${index}`).value;
//     const updatedPrice = document.getElementById(`price_${index}`).value;
//     return {
//       ...item,
//       quantity: updatedQuantity,
//       total_price: parseFloat(updatedPrice)
//     };
//   });
//
//   // アイテムがすべて空白であれば、削除確認メッセージを表示
//   if (updatedItems.length === 0 || updatedItems.every(item => item.quantity === '' || item.total_price === '')) {
//     deleteSale(currentSaleId)
//     closeModal()
//     return
//   }else{
//     const totalAmount = updatedItems.reduce((sum, item) => {
//       return sum + (isNaN(item.total_price) ? 0 : item.total_price); // total_priceがNaNでない場合に合計
//     }, 0);
//     updateSale(totalAmount,updatedItems,currentSaleId)
//     // console.log('合計金額:', totalAmount);
//   }
//   closeModal();
// loadingIndicator.style.display = "none"
// }
//
// function deleteItem(index) {
//   // アイテムを削除する
//   currentSale.item_details.splice(index, 1);
//
//   // 再度モーダルを表示して、変更を反映
//   showUpdateModal(currentSale);
//   loadingIndicator.style.display = 'none';
// }
//
// // 設定項目を言語ごとにマッピング
const settingMap = {
    'Configurações pessoais': 'personal_settings', // ポルトガル語
//     'Número do caixa': 'register_number',          // ポルトガル語
//     'Responsável pelo caixa': 'cashier',           // ポルトガル語
//     'Menu':'menu',
//     '個人設定': 'personal_settings',               // 日本語
//     'レジ番号': 'register_number',                // 日本語
//     'レジ担当者': 'cashier',               // 日本語
//     'メニュー':'menu'
};
