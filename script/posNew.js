 const token = window.localStorage.getItem('token');

 if (!token) {
    window.location.href = '../index.html';
 }
 const decodedToken = jwt_decode(token); // jwtDecodeではなくjwt_decodeを使用

let selectOrders = ""
let registerFlug = false
const notRegisterInfo = document.getElementById('yet-regit-info')

// モーダルを表示/非表示にするロジック
const modal = document.getElementById("registerModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModal = document.getElementsByClassName("close")[0];
const addOrderBtn = document.getElementById('addOrderBtn');
const menuModal = document.getElementById('menuModal');
const menuList = document.getElementById('menu-list');
const optionList = document.getElementById('option-list');
const categoryFilters = document.getElementById('category-filters');
const orderList = document.getElementById('order-nbefore-list');
const loadingPopup = document.getElementById('loading-popup');
const salesStart = document.getElementById('salesStart');
const salesFinish = document.getElementById('salesFinish');
const serchSales = document.getElementById('serche-sales')
let selectedMenuItem = null;  // 現在選択されているメニューアイテム
let selectCategory = null;   //選択されているカテゴリー
let selectedOptions = [];  // 選択されたオプションを保存する配列
let selectedCard = null;　//選択カード
let selectFecharcaixa = false　//レジクローズのフラグ
 let currentMode = "open";



let ordersList = document.getElementById('orders-list');//未支払い枠エレメント
let orderItems = document.getElementById('order-items');//詳細枠エレメント
let totalAmountElement = document.getElementById('total-amount');//支払い総額エレメント
let depositAmountElement = document.getElementById('deposit-amount');//預入金額エレメント
let changeAmountElement = document.getElementById('change-amount');//お釣りエレメント
let taxIncluidAmountElent = document.getElementById('tax-included-amount');//税金込み総額エレメント

const caixaDate = document.getElementById('registerDate')
caixaDate.valueAsDate = new Date();
console.log(decodedToken)
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
  uber_enabled:decodedToken.uber_enabled,
  tax_use:decodedToken.tax_enabled,
  invoice_number:decodedToken.invoice_number,
  pendingOrders:null,
  receipt_display_name:decodedToken.receipt_display_name,
  receipt_postal_code:decodedToken.receipt_postal_code,
  receipt_address:decodedToken.receipt_address,
  receipt_tel:decodedToken.receipt_tel,
  tax_type:decodedToken.tax_type,
  regiterCaixa:0

}
console.log(clients)

// if(clients.id === 17){
//     window.location.href = '../posNew.html';
// }

if(clients.id===1){
  document.getElementById('print-invoice').style.display='none'
}



document.addEventListener('DOMContentLoaded', async  () => {
  showLoadingPopup()
  daysSet()
  //メニュー、カテゴリー、オープション表示
  const MainData = await makerequest(`${server}/orders/getBasedata?user_id=${clients.id}`)
  let pendingOrders = await fetchPendingOrders(clients.id);
  const registerData = await getRegisters(clients.id);
   // await getOrdersbyPickupTime()
   openModalBtn.onclick = function() {
     openCaixaModal()
       setCashMode('open')
   }
  // if(clients.registe)

  clients.pendingOrders = pendingOrders
  if(pendingOrders.length===0){
    loadingPopup.style="display:none"
    showCustomAlert(t('no_pending_order'));
    hideLoadingPopup();
    return
  }else{
    createDependentePedidos()
  }

  function createDependentePedidos(){
    ordersList.innerHTML = ''
    //未支払いオーダーカードを作成
        clients.pendingOrders.forEach(order => {
          console.log(order)
          let tableDisplay =order.table_no
          let status = "Pronto"
          let styleColer ="background-color:#90EE90"
          let icon=""
          let displayText = (order.order_type === 'local' && order.table_no !== '9999')
            ? ` ${t('table_label')}:${order.table_no}`
            : '';

          tableDisplay = `${displayText}<br>${order.order_name}`;

          if(order.order_status === 'pending') {
            status = t('status_pending');
            styleColer = 'background-color:#FFCCCB';
            icon = '<img src="../imagen/pending.jpg">';
          } else if(order.order_status === 'prepared') {
            status = t('status_prepared');
            icon = '<img src="../imagen/prepared.jpg">';
          }

          if(order.payment_method!="yet"){
            icon+='<img src="../imagen/payed.jpg">'
          }
          let orderCard = document.createElement('div');
          orderCard.classList.add('order-card');
          orderCard.style=styleColer
          orderCard.setAttribute('data-id', order.id); // data-id 属性を設定
          orderCard.id = order.id
          orderCard.innerHTML = `<div class="order-card-main-div">
             <div class="order-leftdiv"><h3>${tableDisplay}<br>${status}</h3></div>
             <div class="order-rightdiv">
              ${icon}
             </div>
           </div>`;
          orderCard.addEventListener('click', () => {
              if (selectedCard) {
                  selectedCard.classList.remove('selected-card');
              }
              orderCard.classList.add('selected-card');
              selectedCard = orderCard;
              selectOrders=order
               document.getElementById('deposit-amount').value=''

               displayOrderDetails(order, {
                 MainData,
                 clients,
                 currentLang,
                 orderItems,
                 totalAmountElement,
                 t,
                 updateChange
               });
          });
          ordersList.appendChild(orderCard);
           hideLoadingPopup();
      });
  }


  document.getElementById('deposit-amount').addEventListener('input', (e) => {
    // 全角/半角の￥やカンマ、空白を全部消す
    const raw = e.target.value.replace(/[¥￥,，\s]/g, '');
    const paymentAmount = parseFloat(raw) || 0;

    console.log("入力値:", e.target.value, "→ 数字だけ:", raw, "→ 数値:", paymentAmount);

    const channel = new BroadcastChannel('customer-display');
    channel.postMessage({
      type: 'update',
      order_id: clients.selectedOrder,
      totalWithTax: clients.receiptData.totalWithTax,
      items: clients.receiptData.items,
      paymentAmount: paymentAmount
    });
  });





    // depositAmountElement.addEventListener('input', updateChange);
    function updateChange() {

      let depositAmountElement = document.getElementById('deposit-amount'); // 預入金額
      let changeAmountElement = document.getElementById('change-amount'); // 釣り
      let taxIncludedAmountElement = document.getElementById('tax-included-amount'); // 総額

      let deposit = parseInt(depositAmountElement.value.replace(/[^\d]/g, '')) || 0;
      let total = parseInt(taxIncludedAmountElement.textContent.replace(/[^\d]/g, '')) || 0;
      let change = deposit - total;

      changeAmountElement.value = change >= 0 ? `¥${change.toLocaleString()}` : "¥0";
    }
    // Confirm Payment Button Logic
    document.getElementById('confirm-payment').addEventListener('click', async () => {
      const channel = new BroadcastChannel('customer-display');
      channel.postMessage({
        type: 'reset'   // ← 待機に戻すトリガー
      });
    registeConfirm()
});
document.getElementById('confirm-ptakes').addEventListener('click',async ()=>{
  entregueConfirm()
})

document.getElementById('merge-confirm').addEventListener('click', async () => {
  const checked = [...document.querySelectorAll('.merge-order:checked')].map(el => el.value);
  const mainOrderRadio = document.querySelector('input[name="main-order"]:checked');

  if (!mainOrderRadio) {
    alert(t('select_base_order'));
    return;
  }

  const baseOrderId = mainOrderRadio.value;

  if (checked.length < 2) {
    alert(t('select_two_orders'));
    return;
  }


  // baseOrderId が checked に含まれてなければ追加
  if (!checked.includes(baseOrderId)) {
    checked.push(baseOrderId);
  }

  showLoadingPopup();

  fetch(`${server}/orderskun/merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderIds: checked, baseOrderId })
  })
  .then(res => res.json())
  .then(async result => {
    const pendingOrders = await fetchPendingOrders(clients.id);
    clients.pendingOrders = pendingOrders;
    console.log(clients.pendingOrders)
    hideLoadingPopup();
    document.getElementById('mergeModal').style.display = 'none';
    createDependentePedidos();
    showToast(t('done'))

    document.getElementById('mergeModal').style.display = 'none';
  });
});

function daysSet(){
    const now = new Date();
    // 開始日時: 今日の00:00:00
    const startOfDay = new Date(now.setHours(0, 0, 0, 0) + (9 * 60 * 60 * 1000)).toISOString().slice(0, 16);
    salesStart.value = startOfDay;
    // 終了日時: 今日の23:59:59
    const endOfDay = new Date(now.setHours(23, 59, 59, 999) + (9 * 60 * 60 * 1000)).toISOString().slice(0, 16);
    salesFinish.value = endOfDay;
}

function showCustomAlert(message) {
    const alertBox = document.getElementById('custom-alert');
    alertBox.querySelector('p').textContent = message;
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 1000); // 1秒間表示
}

const cashPaymentButton = document.getElementById('cash-payment');
const creditPaymentButton = document.getElementById('credit-payment');
const otherPaymentButton = document.getElementById('other-payment');
const paymentButtons = [cashPaymentButton, creditPaymentButton, otherPaymentButton];

// Update the paytype in the clients object
function updatePayType(type,btn) {
  if(selectedCard){
    clients.paytype = type;
        btn.classList.add('selected');
  }else{
if (!validateOrderState(clients, t)) return;
  }
}

paymentButtons.forEach(button => {
button.addEventListener('click', () => {
    paymentButtons.forEach(btn => btn.classList.remove('selected'));
    // Update the paytype based on the selected button
    if (button === cashPaymentButton) {
      // ￥やカンマを除去して数値化
      const raw = depositAmountElement.value.replace(/[¥￥,，\s]/g, '');
      const paymentAmount = parseFloat(raw) || 0;
      // 現金決済の処理
      updatePayType('cash', button);
      // 対面モニターへ送信
      const channel = new BroadcastChannel('customer-display');
      channel.postMessage({
        type: 'update',
        order_id: clients.selectedOrder,
        totalWithTax: clients.receiptData.totalWithTax,
        items: clients.receiptData.items,
        paymentAmount: paymentAmount
      });
    } else if (button === creditPaymentButton) {
        updatePayType('credit',button);
        const rawText = taxIncluidAmountElent.innerText;
        document.getElementById('deposit-amount').value = rawText
    } else if (button === otherPaymentButton) {
        updatePayType('other',button);
    }
});
});

 let addBeforeOrder = null
 let selctedCard = null
 let selectedOrderBackup = null;
    // プラスボタンをクリックしたらモーダルを表示
    addOrderBtn.addEventListener('click', () => {
      orderList.innerHTML=""
        if (selectedCard!=null) {
            // data-id 属性を取得
            const orderId = selectedCard.getAttribute('data-id');
            selctedCard =orderId
            const selectedOrder = pendingOrders.find(order => order.id === orderId-0);
            selectedOrderBackup = JSON.parse(JSON.stringify(selectedOrder));  // バックアップを作成
            addBeforeOrder = selectedOrder;
            menuModal.style.display = 'block';
            displayCategoryFilters();  // カテゴリーフィルターを表示
            displayOrderItems(selectedOrder)
            // displayMenuItems('all');   // 初期表示ですべてのメニューを表示
        } else {
          if (!validateOrderState(clients, t)) return;
        }
    });

    // モーダルの閉じるボタンをクリックで非表示
    closeModal.addEventListener('click', () => {
        menuModal.style.display = 'none';
        optionList.innerHTML = '';  // オプションリストをクリア
    });

    // カテゴリーフィルターを表示する関数
    function displayCategoryFilters() {
        categoryFilters.innerHTML = '';  // フィルターリストをクリア
        const allButton = document.createElement('button');
        allButton.textContent = t('all');
        allButton.addEventListener('click', () => displayMenuItems('all'));
        categoryFilters.appendChild(allButton);
        MainData.categories.forEach(category => {
            const categoryButton = document.createElement('button');
            categoryButton.textContent = category.admin_item_name;  // 日本語で表示
            categoryButton.addEventListener('click', () => {
              if (selectCategory) {
                  selectCategory.classList.remove('selected');
              }
              categoryButton.classList.add('selected');
              selectCategory = categoryButton;
              displayMenuItems(category.id)
            });
            categoryFilters.appendChild(categoryButton);
        });
    }

    // let selectCategory = null;
    // let selectOption = null
let adicionarItem = null
    // メニューを表示する関数
    function displayMenuItems(categoryId) {
        menuList.innerHTML = '';  // メニューリストをクリア
        const filteredItems = MainData.menus.filter(menu => categoryId === 'all' || menu.category_id === categoryId);
        filteredItems.forEach(menu => {
          console.log(menu)
            const menuItemDiv = document.createElement('button');
            menuItemDiv.textContent = `${menu.admin_item_name}￥${menu.price.split('.00')[0]}`;  // 管理名で表示
            menuItemDiv.classList.add('menu-item');
            menuList.appendChild(menuItemDiv);
            // メニューアイテムをクリックしたらオプションを表示
            menuItemDiv.addEventListener('click', () => {
              adicionarItem= []
                  // 以前の選択をクリア
                  if (selectedMenuItem) {
                      selectedMenuItem.classList.remove('selected');
                  }
                  adicionarItem = {
                    kubun: 'add',
                    id: null,
                    order_id: selctedCard,
                    menu_id: menu.id,
                    menu_name: menu.admin_item_name,
                    total_price: menu.price,
                    menu: {
                      is_takeout: menu.is_takeout // ← こうしておけば OK！
                    }
                  }
                  // 新しい選択を適用
                  menuItemDiv.classList.add('selected');
                  selectedMenuItem = menuItemDiv;  // 現在の選択を保存
                  displayMenuOptions(menu.id);  // オプションを表示

              });
        });
    }

    // 初期設定と変更イベント
    document.getElementById('language-select').addEventListener('change', async (e) => {
      const lang = e.target.value;
      localStorage.setItem('loacastrogg', lang);
      currentLang=lang
      applyTranslation(lang);
      createDependentePedidosRetry({
        MainData,
        clients,
        currentLang,
        orderItems,
        totalAmountElement,
        t,
        updateChange
      });
    });

    let addNewOption = [];  // 選択したオプションの情報を格納する配列
    // オプションを表示する関数
    function displayMenuOptions(menuId) {
        optionList.innerHTML = '';  // オプションリストをクリア
        const filteredOptions = MainData.options.filter(option => option.menu_id === menuId);
        if (filteredOptions.length === 0) {
            // optionList.innerHTML = 'オプションはありません';
        } else {
            filteredOptions.forEach(option => {
                const optionItemDiv = document.createElement('button');
                optionItemDiv.textContent = option.option_name_pt;  // ポルトガル語のオプション名で表示
                optionItemDiv.classList.add('option-item');
                optionList.appendChild(optionItemDiv);
                // オプションアイテムをクリックした時の処理
                optionItemDiv.addEventListener('click', () => {
                    // ボタンに 'selected' クラスが既に付いているか確認
                    if (optionItemDiv.classList.contains('selected')) {
                        // 'selected' クラスが付いていた場合はクラスを削除
                        optionItemDiv.classList.remove('selected');
                        // addNewOption 配列から該当するオプションを削除
                        addNewOption = addNewOption.filter(opt => opt.menu_id !== option.menu_id);
                    } else {
                        // 'selected' クラスを追加して選択状態にする
                        optionItemDiv.classList.add('selected');
                        // addNewOption 配列にオプション情報を追加
                        addNewOption.push({
                          option_id:option.id,
                            menu_id: option.menu_id,
                            option_name: option.option_name_pt,
                            additional_price: option.additional_price
                        });
                    }
                    console.log('Selected options:', addNewOption);  // 選択されたオプションを表示（デバッグ用）
                });
            });
        }
    }

    document.getElementById('add-for-new-list').addEventListener('click', () => {
      console.log(adicionarItem)
        if (!adicionarItem) {
          alert(t('select_item'));

            return;
        }
        // 数量選択フィールドを表示
        const quantityInputDiv = document.getElementById('quantity-input');
        quantityInputDiv.style.display = 'block';
        const quantityButtons = document.querySelectorAll('.quantity-btn');
        const quantityInput = document.getElementById('item-quantity');
        // 数量ボタンをクリックした時の処理
        quantityButtons.forEach(button => {
            button.addEventListener('click', () => {
                quantityButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const value = button.getAttribute('data-value');
                quantityInput.value = value;
            });
        });
        // 確定ボタンのイベントハンドラ
        document.getElementById('confirm-quantity-btn').addEventListener('click', async() => {
            const quantity = parseInt(document.getElementById('item-quantity').value, 10);
            if (isNaN(quantity) || quantity <= 0) {
              alert(t('enter_valid_quantity'));

                return;
            }

            // オプションの合計金額を計算
            const totalPrice = addNewOption.reduce((acc, option) => {
                return acc + parseFloat(option.additional_price);
            }, 0);

            // オプションを新しい形式に変換
            const formattedOptions = addNewOption.map(option => ({
                id: option.option_id.toString(),
                name: option.option_name,
                additional_price: parseFloat(option.additional_price)
            }));
            // JSON形式に変換
            const jsonOptions = JSON.stringify(formattedOptions);
            // アイテムの価格を数量に応じて更新
            let itemPrice = (parseFloat(adicionarItem.total_price) + totalPrice) * quantity;
            adicionarItem.total_price = itemPrice;
            adicionarItem.item_price = itemPrice;
            adicionarItem.quantity = quantity;
            adicionarItem.options = jsonOptions;

            // アイテムが既に存在しないか確認してから追加
            if (!addBeforeOrder.OrderItems.includes(adicionarItem)) {
                addBeforeOrder.OrderItems.push(adicionarItem);
            }
            // 合計金額を更新
            const allTotalPrice = parseFloat(addBeforeOrder.total_amount) + itemPrice;
            addBeforeOrder.total_amount = allTotalPrice;
            // オーダーアイテムを再描画
            displayOrderItems(addBeforeOrder);
            // 状態をリセット
            addNewOption = [];
            adicionarItem = null; // ここを `null` に設定して重複を防ぐ
            selectedMenuItem.classList.remove('selected');
            optionList.innerHTML = "";
            quantityInputDiv.style.display = 'none'; // 数量選択フィールドを非表示
        }, { once: true }); // ボタンのイベントリスナーが複数回登録されるのを防ぐために `once: true` を追加
    });

    function formatPrice(value) {
    const parsedValue = parseFloat(value);
    return parsedValue % 1 === 0 ? parsedValue.toFixed(0) : parsedValue.toFixed(2);



}

    // リストを表示する関数
    async function displayOrderItems(selectedOrder) {
      let total_amount = 0
      const totalQuantity = selectedOrder.OrderItems.reduce((acc, item) => {
        if(item.kubun!='delete'){
          total_amount += (item.total_price-0)
          return acc + item.quantity
        }else{
          return acc
        }
      }, 0);
      const totalsAmount = formatPrice(total_amount);
      document.getElementById('total-alter-order-count').innerText = `${totalQuantity} ${t('items')}`;
      document.getElementById('total-alter-order-amount').innerText = `${t('total_amount')} ￥${parseFloat(totalsAmount).toLocaleString()}`;

        orderList.innerHTML = ''; // リストをクリア
        selectedOrder.OrderItems.forEach((item, index) => {
          let deleteMenu = false
          let addNewFlug = false
            // メニューアイテムの表示
            const menuItemDiv = document.createElement('div');
            menuItemDiv.style.display = 'flex';
            menuItemDiv.style.justifyContent = 'space-between'; // アイテムと削除ボタンを左右に分ける

            // アイテム名と金額
            const itemDetailsDiv = document.createElement('div');
            const removeItemBtn = document.createElement('button');
            removeItemBtn.dataset.itemIndex = index; // アイテムのインデックスを保持
            removeItemBtn.textContent = '🗑️';
            removeItemBtn.classList.add('remove-item')
            if(item.kubun==='add'){
              itemDetailsDiv.classList.add('adicionar-menu-novo')

              addNewFlug=true
            }else if(item.kubun==='delete'){
              deleteMenu = true
              itemDetailsDiv.classList.add('deletar-menu-da-lista')
              removeItemBtn.textContent = '🔙';
              removeItemBtn.classList.add('undo-remove-item');
            }
            itemDetailsDiv.innerHTML = `
                <strong>${item.menu_name}</strong>-✕${item.quantity} ￥${parseFloat(item.item_price).toLocaleString()}
            `;

            // アイテム削除ボタンのロジック


  // removeItemBtn.classList.add('remove-item');


  // アイテム削除の処理
  removeItemBtn.addEventListener('click', () => {
      if (selectedOrder.OrderItems[index].kubun === 'delete') {
          // 既に削除フラグが立っている場合は削除を取り消す
          if(selectedOrder.OrderItems[index].id!=null){
            selectedOrder.OrderItems[index].kubun = null;
          }else{
            selectedOrder.OrderItems[index].kubun = 'add';
          }
          // itemDetailsDiv.classList.remove('deletar-menu-da-lista');
          // // ボタンを元に戻す
          // removeItemBtn.textContent = '🗑️';
          // removeItemBtn.classList.remove('undo-remove-item');
      } else {
          // 削除フラグを立てる
          selectedOrder.OrderItems[index].kubun = 'delete';
          itemDetailsDiv.classList.add('deletar-menu-da-lista');

          // ボタンを「削除取り消し」に変更
          // removeItemBtn.textContent = '🔙';
          // removeItemBtn.classList.add('undo-remove-item');
      }
      displayOrderItems(selectedOrder)

  });
            // アイテムの詳細表示エリアに削除ボタンを追加
            itemDetailsDiv.appendChild(removeItemBtn);
            // メニューアイテムの行にアイテム名と削除ボタンを追加
            menuItemDiv.appendChild(itemDetailsDiv);
            menuItemDiv.appendChild(removeItemBtn);
            orderList.appendChild(menuItemDiv);
            // オプションの表示
            const options = JSON.parse(item.options);
            options.forEach((option, optionIndex) => {
                const optionDiv = document.createElement('div');
                if(deleteMenu){
                  // console.log('adcionar claa nobo')
                  optionDiv.classList.add('deletar-menu-da-lista')
                }else if(addNewFlug){
                  optionDiv.classList.add('adicionar-menu-novo')
                }
                optionDiv.style.display = 'flex';
                optionDiv.style.justifyContent = 'space-between'; // オプションと削除ボタンを左右に分ける
                optionDiv.style.marginLeft = '20px'; // オプションを少し右にオフセット

                // オプションの詳細
                const optionDetailsDiv = document.createElement('div');
                optionDetailsDiv.innerHTML = `
                    (${option.name} - ￥${parseFloat(option.additional_price).toLocaleString()})
                `;
                // オプションの行にオプション名と削除ボタンを追加
                optionDiv.appendChild(optionDetailsDiv);
                // optionDiv.appendChild(removeOptionBtn);
                orderList.appendChild(optionDiv);
            });
        });
    }
// オプションを削除する関数
function removeOption(itemIndex, optionIndex) {
    const options = JSON.parse(order.OrderItems[itemIndex].options);
    options.splice(optionIndex, 1); // オプションを削除
    order.OrderItems[itemIndex].options = JSON.stringify(options); // 更新
    displayOrderItems(); // リストを再表示
}
// オプション削除ボタンのイベントリスナー
document.addEventListener('click', (event) => {

  // select クリック時はスキップ
  if (event.target.tagName === 'SELECT' || event.target.closest('select')) return;

  if (event.target.classList.contains('remove-option')) {
    const itemIndex = event.target.getAttribute('data-item-index');
    const optionIndex = event.target.getAttribute('data-option-index');
    removeOption(itemIndex, optionIndex);
  }
});

// オーダーを追加するボタンのイベント
document.getElementById('save-add-menu').addEventListener('click', async () => {
  // showLoadingPopup()
  console.log(addBeforeOrder)
  showLoadingPopup()
  try {
    console.log('Updated Order:', addBeforeOrder);
    // サーバーに更新を送信
    const response = await fetch(`${server}/orderskun/update/order/admin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            newOrder: addBeforeOrder
        })
    });

    if (response.ok) {
      const responseData = await response.json();  // サーバーからのレスポンスデータを取得
      // レスポンスデータをpendingOrdersに反映
      const orderIndex = pendingOrders.findIndex(order => order.id === responseData.id);
      if (orderIndex !== -1) {
          pendingOrders[orderIndex] = responseData;  // pendingOrdersをサーバーの最新情報で更新
      } else {
          pendingOrders.push(responseData);  // もし新規オーダーなら追加
      }
  showToast(t('done'))
      // モーダルを閉じる
      selctedCard = null;
      document.getElementById('menuModal').style.display = "none";
      console.log(responseData)
      // 最新のオーダー情報を画面に反映（必要に応じて更新されたオーダー詳細を表示）
      displayOrderDetails(order, {
        MainData,
        clients,
        currentLang,
        orderItems,
        totalAmountElement,
        t,
        updateChange
      });

    } else {
      alert(t('register_error'));
    }
    hideLoadingPopup()
  } catch (e) {
    console.log(e);
    hideLoadingPopup()
  }
});



document.getElementById('close-menuModal').addEventListener('click', ()=>{
  document.getElementById('menuModal').style.display = "none";
  addBeforeOrder = null
  selctedCard = null
  if (selectedOrderBackup) {
        // 元に戻す
        const orderIndex = pendingOrders.findIndex(order => order.id === selectedOrderBackup.id);
        pendingOrders[orderIndex] = JSON.parse(JSON.stringify(selectedOrderBackup));  // 元に戻す
    }
})


})
// });


async function registeConfirm(){
  console.log(clients.printInfo)
  console.log(clients)
  const loadingPopup = document.getElementById('loading-popup');
  if (!clients.selectedOrder) {
      if (!validateOrderState(clients, t)) return;
      return;
  }
  if(clients.paytype===""||clients.paytype==="yet"){
    alert(t('select_payment_method'));

    return
  }

  const target = clients.pendingOrders.find(o => o.id === clients.selectedOrder);
  if (target) {
    target.payment_method = clients.paytype; // 例えば 'cash' に変更
  }


  try {
showLoadingPopup()
      const response = await fetch(`${server}/orderskun/updatePayment`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              order_id: clients.selectedOrder,
              payment_method: clients.paytype,  // The selected payment method from clients object
              order_status: 'pending'  // Update the status to 'confirmed'
          })
      });
      console.log(response.status)
      if (response.status===200) {
          showToast(t('done'))
          // clearOrderDetails();
          hideLoadingPopup()
      } else {
          alert(t('register_error'));
          hideLoadingPopup()
      }
  } catch (error) {
      hideLoadingPopup()
      console.error('Error confirming payment:', error);
      alert('Erro no registro.');
  }

}

async function entregueConfirm(){
if (!validateOrderState(clients, t)) return;

if(clients.printInfo.order_type==='local'||clients.printInfo.order_type==='order'||clients.printInfo.order_type==='takeout'){
  if(clients.printInfo.payment_method==='yet'&&clients.paytype===""){
    alert(t('payment_not_registered'));
    return
  }
}
if(clients.printInfo.order_type==='uber'||clients.printInfo.order_type==='demaekan'||clients.printInfo.order_type==='other'){
  clients.paytype='other'
}
  // // Update the order in the database
  //
  // console.log(`clients.selectedOrder`,clients.selectedOrder)
  // console.log(`clients.paytype`,clients.paytype)

console.log(`clients.pendingOrders`,clients.pendingOrders)
  // return
  try {
    showLoadingPopup()
      const response = await fetch(`${server}/orderskun/updateConfirmd`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              order_id: clients.selectedOrder,
              order_status: 'confirmed',  // Update the status to 'confirmed'
              paymentType: clients.paytype
          })
      });
      if (response.status===200) {
           hideLoadingPopup()
           removeOrderById(clients.selectedOrder)
           showToast(t('done'))
          const cashPaymentButton = document.getElementById('cash-payment');
          const creditPaymentButton = document.getElementById('credit-payment');
          const otherPaymentButton = document.getElementById('other-payment');
          const paymentButtons = [cashPaymentButton, creditPaymentButton, otherPaymentButton];
          paymentButtons.forEach(button => {
           button.classList.remove("selected")
          })
          // Remove the order card from the UI
          const orderCard = document.querySelector(`.selected-card[data-id="${clients.selectedOrder}"]`);
          if (orderCard) {
              orderCard.remove();
          }
          selectedCard=null
          // Optionally, you can clear the order details or reset the UI
          clearOrderDetails();
      } else {
            alert(t('register_error'));
      }
  } catch (error) {
    hideLoadingPopup()
    console.error('Error confirming payment:', error);
      alert(t('register_error'));
  }
  loadingPopup.style="display:none"
}

function showToast(message, type = 'success') {

  console.log(`toast`)

  const container = document.getElementById('ok-toast-container');
  container.classList.remove('hidden')

  const toast = document.createElement('div');
  toast.className = `ok-toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // アニメーション表示
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // 2秒後に消える
  setTimeout(() => {
    console.log(`show`)
    toast.classList.remove('show');

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2000);
}

function removeOrderById(id) {
  clients.pendingOrders = clients.pendingOrders.filter(
    order => order.id !== id
  );
}

// Function to clear the order details from the UI
function clearOrderDetails() {
    // 注文詳細のリセット
    document.getElementById('order-items').innerHTML = '';
    document.getElementById('total-amount').textContent = '¥0';
    document.getElementById('deposit-amount').value = '¥0';
    document.getElementById('change-amount').value = '¥0';
    document.getElementById('tax-included-amount').textContent = '¥0';
    document.getElementById('tax-total').textContent = '¥0';

    // クライアントオブジェクトのリセット
    clients.paytype = '';
    clients.depositAmount = '';
    clients.selectedOrder = '';
    clients.taxtType = '';
    clients.receiptData = '';
    selectedOrder = null;

}



function showCustomAlert(message) {
    const alertBox = document.getElementById('custom-alert');
    alertBox.querySelector('p').textContent = message;
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 1000); // 1秒間表示
}


async function fetchPendingOrders() {
    try {
        const response = await fetch(`${server}/orderskun/get-by-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ client_id: clients.id,status:'confirmed' })
        });
        if (!response.ok) {
            throw new Error('Failed to fetch pending orders');
        }
        const pendingOrders = await response.json();
        return pendingOrders;
    } catch (error) {
        return null;
    }

}
document.addEventListener('DOMContentLoaded', function() {

    function updateChange() {
      let depositAmountElement = document.getElementById('deposit-amount'); // 預入金額
      let changeAmountElement = document.getElementById('change-amount'); // 釣り
      let taxIncludedAmountElement = document.getElementById('tax-included-amount'); // 総額

      let deposit = parseInt(depositAmountElement.value.replace(/[^\d]/g, '')) || 0;
      let total = parseInt(taxIncludedAmountElement.textContent.replace(/[^\d]/g, '')) || 0;
      let change = deposit - total;

      changeAmountElement.value = change >= 0 ? `¥${change.toLocaleString()}` : "¥0";
    }
});

const inputElement = document.getElementById('deposit-amount');
let isComposing = false; // IME入力中判定

// **✅ クリック時に空白にする**
inputElement.addEventListener('focus', function () {
    if (this.value === "¥0") {
        this.value = "";
    }
});

// **✅ フォーカス外れたら ¥0 に戻す**
inputElement.addEventListener('blur', function () {
    if (this.value === "") {
        this.value = "¥0";
        updateChange(); // 金額が ¥0 になったときも釣り計算
    }
});

// **✅ IME入力開始**
inputElement.addEventListener('compositionstart', () => {
    isComposing = true;
});

// **✅ IME入力確定**
inputElement.addEventListener('compositionend', () => {
    isComposing = false;
    formatInput();
});

// **✅ 通常の入力イベント**
inputElement.addEventListener('input', function () {
    if (!isComposing) {
        formatInput();
    }
});

// **🔥 フォーマット関数**
function formatInput() {
    let rawValue = inputElement.value.replace(/[^\d]/g, ''); // 数字以外削除
    if (rawValue === "") {
        inputElement.value = "¥0"; // 空なら ¥0 に戻す
    } else {
        inputElement.value = `¥${Number(rawValue).toLocaleString()}`;
    }
    updateChange(); // ✅ 金額変更時に釣りを計算
}

function updateChange() {
  let depositAmountElement = document.getElementById('deposit-amount'); // 預入金額
  let changeAmountElement = document.getElementById('change-amount'); // 釣り
  let taxIncludedAmountElement = document.getElementById('tax-included-amount'); // 総額

  let deposit = parseInt(depositAmountElement.value.replace(/[^\d]/g, '')) || 0;
  let total = parseInt(taxIncludedAmountElement.textContent.replace(/[^\d]/g, '')) || 0;
  let change = deposit - total;

  changeAmountElement.value = change >= 0 ? `¥${change.toLocaleString()}` : "¥0";
}



// selectTaxButton関数を修正
function selectTaxButton(selectedButtonId) {
    // すべての税ボタンから active-tax クラスを削除
    const taxButtons = document.querySelectorAll('.tax-button');
    taxButtons.forEach(button => {
        button.classList.remove('active-tax');
    });

    // クリックされたボタンに active-tax クラスを追加
    const selectedButton = document.getElementById(selectedButtonId);
    if (selectedButton) {
        selectedButton.classList.add('active-tax');
    }
}
let originalAmount = null; // 元の金額を保存する変数

// 既存の applyTax 関数
function applyTax(taxRate) {
    const totalAmountElement = document.getElementById('total-amount');

        const totalAmountText = selectOrders.total_amount
        originalAmount = parseFloat(totalAmountText);
    // 税額を計算
    const taxAmount = originalAmount * (taxRate / 100);
    const totalWithTax = Math.floor(originalAmount + taxAmount);
    // 手動でカンマ区切りを適用
    const finalFormattedTotalWithTax = totalWithTax.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // // 整数値を表示
    document.getElementById('tax-included-amount').textContent = `¥${totalWithTax.toLocaleString()}`;
    clients.receiptData.taxInclued = totalWithTax
    // 整数値を表示
    // document.getElementById('tax-included-amount').textContent = `${totalAmountElement.textContent}`;
}

// 税率が適用される前の状態に戻すためのリセット関数
function resetOriginalAmount() {
    const totalAmountElement = document.getElementById('total-amount');
    totalAmountElement.textContent = originalAmount.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
    originalAmount = null; // 初期化
}

// document.getElementById('menu-btn').addEventListener('click', () => {
//     console.log('Menu button clicked');
// });
//
// document.getElementById('history-btn').addEventListener('click', () => {
//     // Handle history button click
//     console.log('History button clicked');
// });
//
// document.getElementById('logout-btn').addEventListener('click', () => {
//     // Handle logout button click
//     console.log('Logout button clicked');
//     // Perform logout actions
// });

document.getElementById('print-receipt').addEventListener('click', () => {
  recite();
});

document.getElementById('delete-order').addEventListener('click', () => {

  console.log('botann ckick')

if (!validateOrderState(clients, t,false)) return;
    // 選択されたオーダーのIDと、オーダー内のアイテムIDを取得
    const selectedOrderId = clients.selectedOrder;
    const orderItems = clients.printInfo.OrderItems.map(item => item.id); // アイテムIDの配列を取得

    // 削除確認のダイアログを表示
    const confirmDelete = confirm(t('confirm_delete_order'));
    if (!confirmDelete) return;

    showLoadingPopup()

    // 削除リクエストを送信（オーダーIDとアイテムIDを一緒に送信）
    fetch(`${server}/orderskun/delete/${selectedOrderId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds: orderItems }) // アイテムIDもリクエストに含める
    })
    .then(response => {
        if (response.ok) {
            showToast(t('done'))
            // 必要に応じて注文リストを更新
            removeOrderFromList(selectedOrderId);
            clients.selectedOrder=""
            document.getElementById('total-amount').innerText=0
            document.getElementById('order-items').innerHTML = ''
            hideLoadingPopup()
        } else {
            return response.json().then(data => {
              hideLoadingPopup()
                throw new Error(data.message || 'Tivemos um erro');
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(t('register_error'));
    });
});

// // 削除後に画面から該当オーダーを消す処理（必要に応じてカスタマイズ）
function removeOrderFromList(orderId) {
    const orderElement = document.getElementById(`${orderId}`);
    if (orderElement) {
        orderElement.remove(); // 画面から削除
    }
}

//レシートの発行
async function recite(nb, reciteAmount) {
if (!validateOrderState(clients, t)) return;
  const depositInput = document.getElementById('deposit-amount').value;
  if (depositInput === "" || parseFloat(depositInput) === 0) {
    return alert(t('enter_received_amount'));
  }

  const totalWithTax = clients.receiptData.totalWithTax;

  const cleanDeposit = depositInput.replace(/[¥,]/g, '');
  if (parseFloat(cleanDeposit) < totalWithTax) {
    return alert(t('received_less_than_total'));
  }


  const troco = document.getElementById('change-amount').value;
  const recebido = depositInput;
  const valorINclusoTax = totalWithTax;
  const valorSemTax = clients.receiptData.totalAmount;

  // データ補完
  clients.receiptData.tax_type = clients.tax_type;
  clients.receiptData.depositAmount = recebido;
  clients.receiptData.changeAmount = troco;
  clients.receiptData.paytype = clients.paytype


  // BUONISSIMO専用処理
  if (clients.id === 1) {
    reciteBuonissimoOnly();
    return;
  }

try{
  showLoadingPopup()
  const response = await fetch(`http://localhost:3001/print/receipt`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body:
          JSON.stringify(clients.receiptData)
        })
        hideLoadingPopup()
}catch(e){
  hideLoadingPopup()

}

}

async function reciteBuonissimoOnly() {
    // 例: clients が適切に定義されていると仮定
    const receiptData = clients.receiptData; // 必要に応じて正しいスコープで定義
    // フェッチ処理
    const response = await fetch(`http://localhost:3100/orders/PrintRecite`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiptData }) // 正しい構造に修正
    });

    // レスポンス確認
    if (!response.ok) {
    } else {
        const data = await response.json();

    }
}

async function ryousyushoBuonissimoOnly() {
    // 例: clients が適切に定義されていると仮定

    const receiptData = clients.receiptData; // 必要に応じて正しいスコープで定義

    // フェッチ処理
    const response = await fetch(`http://localhost:3100/orders/printRyousyusho`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiptData }) // 正しい構造に修正
    });

    // レスポンス確認
    if (!response.ok) {
        console.error('Error in request:', response.statusText);
    } else {
        const data = await response.json();
        console.log('Response:', data);
    }
}

function getCurrentDateTime() {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();

            // ゼロ埋めして二桁にする
            const formattedMonth = month < 10 ? '0' + month : month;
            const formattedDay = day < 10 ? '0' + day : day;
            const formattedHours = hours < 10 ? '0' + hours : hours;
            const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
            const formattedSeconds = seconds < 10 ? '0' + seconds : seconds;

            return year + '-' + formattedMonth + '-' + formattedDay + ' ' +
                                                formattedHours + ':' + formattedMinutes + ':' + formattedSeconds;
        }

        // レシート用データをHTML形式に変換する関数
        function generateReceiptItemsHTML() {
            if (!clients.receiptData || !clients.receiptData.items) {
                return ''; // レシートデータが存在しない場合は空文字を返す
            }

            let receiptHTML = '';
            clients.receiptData.items.forEach(item => {
                receiptHTML += `
                    <div class="item-entry">
                        <div class="items-name">${item.menu_name} x${item.quantity} - ¥${item.item_price.toLocaleString()}</div>
                        ${item.option_names ? `<div class="details-iten">${item.option_names}</div>` : ''}
                    </div>
                `;
            });

            return receiptHTML;
        }

        // レシート用データをHTML形式に変換する関数
        function generateCupomItemsHTML() {
            if (!clients.receiptData || !clients.receiptData.items) {
                return ''; // レシートデータが存在しない場合は空文字を返す
            }

            let receiptHTML = '';
            clients.receiptData.items.forEach(item => {
                receiptHTML += `
                    <div class="item-entry">
                        <div class="items-name">${item.menu_name} x ${item.quantity} }</div>
                        ${item.option_names ? `<div class="details-iten">${item.option_names}</div>` : ''}
                    </div>
                `;
            });

            return receiptHTML;
        }

       document.getElementById('print-cupom').addEventListener('click',cupom)


        async function cupom() {

          if (!validateOrderState(clients, t)) return;

         try{
           showLoadingPopup()
                     console.log(clients.receiptData);
                     clients.receiptData.paytype = clients.paytype
                     const response = await fetch(`http://localhost:3001/print/cupom`, {
                         method: 'POST',
                         headers: {
                             'Content-Type': 'application/json'
                         },
                         body:
                             JSON.stringify(clients.receiptData)
                           })
                           hideLoadingPopup()
　　　　　　}catch(e){
          hideLoadingPopup()

          }
　　　　　

        }

     document.getElementById('print-invoice').addEventListener('click',ryousyuso)
        async function ryousyuso() {
        if (!validateOrderState(clients, t)) return;

          const depositInput = document.getElementById('deposit-amount').value;
          if (depositInput === "" || parseFloat(depositInput) === 0) {
            return alert(t('enter_received_amount'));
          }

          const totalWithTax = clients.receiptData.totalWithTax;
          const cleanDeposit = depositInput.replace(/[¥,]/g, '');
          if (parseFloat(cleanDeposit) < totalWithTax) {
            return alert(t('received_less_than_total'));
          }

          const troco = document.getElementById('change-amount').value;
          const recebido = depositInput;
          const valorINclusoTax = totalWithTax;
          const valorSemTax = clients.receiptData.totalAmount;

          // データ補完
          clients.receiptData.tax_type = clients.tax_type;
          clients.receiptData.depositAmount = recebido;
          clients.receiptData.changeAmount = troco;
          clients.receiptData.paytype = clients.paytype


          console.log(clients.receiptData);

        if(clients.id===1){
          clients.receiptData.taxtTypes=clients.taxtType
          clients.receiptData.depositAmount = recebido
          clients.receiptData.changeAmount=troco
        ryousyushoBuonissimoOnly()
      }else{
        try{
          showLoadingPopup()
          const response = await fetch(`http://localhost:3001/print/invoice`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body:
                  JSON.stringify(clients.receiptData)
                })
                hideLoadingPopup()
        }catch(e){
          hideLoadingPopup()
        }


      }
    }

    function validateOrderState(clients, t, checkPayment = true) {

      console.log(clients)
      console.log(t)

      if (!clients.receiptData) {
        showToast(t('select_order'), 'error');
        return false;
      }

      if (!clients.selectedOrder) {
        showToast(t('select_order'), 'error');
        return false;
      }

      if (checkPayment && !clients.paytype) {
        showToast(t('select_payment_method'), 'error');
        return false;
      }

      return true;
    }

 async function openCaixaModal(){
   console.log(clients)
   modal.style.display = "block";

    console.log(clients.registerInfo.length)
   if(clients.registerInfo.length!=0){
      createStatuscaixa('open')
     // document.getElementById('registerBtn').style.display='none'
     const inputs = document.querySelectorAll('#coins-mother-div input, #bill-mother-div input, #total-caixa-input input');
      // すべての input 要素に readonly を設定
      inputs.forEach(input => {
          input.setAttribute('readonly', true);
      });
   }else{
     document.getElementById('bill10000').value = ''
     document.getElementById('bill5000').value = ''
     document.getElementById('bill1000').value = ''
     document.getElementById('coin500').value = ''
     document.getElementById('coin100').value = ''
     document.getElementById('coin50').value = ''
     document.getElementById('coin10').value = ''
     document.getElementById('coin5').value = ''
     document.getElementById('coin1').value = ''
     document.getElementById('totalAmount').value = ''
             inputs.forEach(input => {
            input.removeAttribute('readonly');
        });
     // document.getElementById('registerBtn').style.display='block'
   }
   if(clients.salesInfo){
    // calculationSales()
   }

 }

 closeModal.onclick = function() {
   modal.style.display = "none";
 }

 window.onclick = function(event) {
   if (event.target == modal) {
     modal.style.display = "none";
   }
 }



 function createStatuscaixa(mode){
   console.log('in')
   console.log(clients.registerInfo.length)

   const filteredMapped = clients.registerInfo
     .filter(item => item.status === mode) // ← 条件に合うものだけ抽出

     console.log(filteredMapped)



   const tgtDate = clients.registerInfo
     .filter(item => item.status === currentMode)
     .sort((a, b) => new Date(b.open_time) - new Date(a.open_time));

     if(tgtDate.length!=0){
       document.getElementById('bill10000').value = tgtDate[0].bill_10000
       document.getElementById('bill5000').value = tgtDate[0].bill_5000
       document.getElementById('bill1000').value = tgtDate[0].bill_1000
       document.getElementById('coin500').value = tgtDate[0].coin_500
       document.getElementById('coin100').value = tgtDate[0].coin_100
       document.getElementById('coin50').value = tgtDate[0].coin_50
       document.getElementById('coin10').value = tgtDate[0].coin_10
       document.getElementById('coin5').value = tgtDate[0].coin_5
       document.getElementById('coin1').value = tgtDate[0].coin_1
       inputs.forEach(input => {
           input.setAttribute('readonly', true);
       });
       calculateTotal()
     }else{
       inputs.forEach(input => {
           input.setAttribute('readonly', true);
       });
       document.getElementById('bill10000').value =  ''
      document.getElementById('bill5000').value = ''
      document.getElementById('bill1000').value = ''
      document.getElementById('coin500').value = ''
      document.getElementById('coin100').value = ''
      document.getElementById('coin50').value = ''
      document.getElementById('coin10').value = ''
      document.getElementById('coin5').value = ''
      document.getElementById('coin1').value = ''
      document.getElementById('totalAmount').value = ''
              inputs.forEach(input => {
             input.removeAttribute('readonly');
         });
     }

     console.log(tgtDate)

 }

 // 合計金額を算出する関数
 function calculateTotal() {
   console.log('kokonihairu')
   const bill10000 = parseInt(document.getElementById('bill10000').value) || 0;
   const bill5000 = parseInt(document.getElementById('bill5000').value) || 0;
   const bill1000 = parseInt(document.getElementById('bill1000').value) || 0;
   const coin500 = parseInt(document.getElementById('coin500').value) || 0;
   const coin100 = parseInt(document.getElementById('coin100').value) || 0;
   const coin50 = parseInt(document.getElementById('coin50').value) || 0;
   const coin10 = parseInt(document.getElementById('coin10').value) || 0;
   const coin5 = parseInt(document.getElementById('coin5').value) || 0;
   const coin1 = parseInt(document.getElementById('coin1').value) || 0;

   // 各金額を計算
   const total = (bill10000 * 10000) + (bill5000 * 5000) + (bill1000 * 1000) +
                 (coin500 * 500) + (coin100 * 100) + (coin50 * 50) +
                 (coin10 * 10) + (coin5 * 5) + (coin1 * 1);

   document.getElementById('totalAmount').value = '￥' + total.toLocaleString() ;
   console.log(total.toLocaleString())
   console.log(total)
   if(currentMode==='open'){
        clients.regiterCaixa = total
   }
   getOrdersbyPickupTime()
 }

 // 入力フィールドが変更されたら合計を再計算
 const inputs = document.querySelectorAll('#bill10000, #bill5000, #bill1000, #coin500, #coin100, #coin50, #coin10, #coin5, #coin1');
 inputs.forEach(input => {
   input.addEventListener('input', calculateTotal);
 });

 setInterval(() => {
    const closeButton = document.querySelector('.close');
    if (closeButton && getComputedStyle(closeButton).opacity === '0') {
        closeButton.style.opacity = '1';  // 強制的に再表示
    }
}, 500);  // 500ミリ秒ごとに確認

async function getRegisters(id) {
    showLoadingPopup();
    const selectDay = caixaDate.value; // 選択された日付を取得
    // const selectDay = '2025/06/29'
    const url = `${server}/orderskun/registers?date=${selectDay}&clientsId=${clients.id}`;
    console.log(url)

    try {
        // await を fetch に追加し、fetch の完了を待つ
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log(data)
        console.log(clients.registerInfo.length)

        clients.registerInfo = data;
        registerFlug = true;

        if (clients.registerInfo.length === 0) {
          clients.registerInfo =''
            notRegisterInfo.style.display = "block";
            return
        }

        console.log('通貨')



        hideLoadingPopup(); // ローディングを隠す
        return;
    } catch (error) {
        hideLoadingPopup();
        console.error('Error:', error);
    }
}

// イベントリスナー内のコード
caixaDate.addEventListener('change', async () => {
    await getRegisters(clients.id); // getRegisters の完了を待機
    await openCaixaModal(); // getRegisters 完了後に openCaixaModal を実行
});



  function openCaixaNer(){
    const nowUTC = new Date();
    // 日本時間に変換 (UTC+9)
    const nowJST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000));
    const registerDT = document.getElementById('registerDate').value
    const data = {
      user_id: clients.id,  // ユーザーIDを指定
      bill_10000: parseInt(document.getElementById('bill10000').value) || 0,
      bill_5000: parseInt(document.getElementById('bill5000').value) || 0,
      bill_1000: parseInt(document.getElementById('bill1000').value) || 0,
      coin_500: parseInt(document.getElementById('coin500').value) || 0,
      coin_100: parseInt(document.getElementById('coin100').value) || 0,
      coin_50: parseInt(document.getElementById('coin50').value) || 0,
      coin_10: parseInt(document.getElementById('coin10').value) || 0,
      coin_1: parseInt(document.getElementById('coin1').value) || 0,
      open_time: nowJST.toISOString(),
      registerDT:registerDT
  };
  // 合計金額の計算
  const totalAmount = (data.bill_10000 * 10000) +
                      (data.bill_5000 * 5000) +
                      (data.bill_1000 * 1000) +
                      (data.coin_500 * 500) +
                      (data.coin_100 * 100) +
                      (data.coin_50 * 50) +
                      (data.coin_10 * 10) +
                      (data.coin_1 * 1);

  // 合計金額が0ならアラートを表示して処理を中断
  if (totalAmount === 0) {
    alert(t('total_zero_error'));
      return;
  }
  // 合計金額をオープン金額として追加
  data.totalAmount = totalAmount;
  // サーバーにデータを送信
  showLoadingPopup()
  fetch(`${server}/orderskun/registers/open`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    hideLoadingPopup()

  })
  .catch(error => {
    hideLoadingPopup()

  });
  }



document.getElementById('closeRegisterBtn').addEventListener('click', function() {
  if (currentMode === "open"){
openCaixaNer()
  return
  }
  const nowUTC = new Date();
  // 日本時間に変換 (UTC+9)
  const nowJST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000));
  console.log(caixaDate.value)

  const data = {
    user_id: clients.id,  // ユーザーIDを指定
    bill_10000: parseInt(document.getElementById('bill10000').value) || 0,
    bill_5000: parseInt(document.getElementById('bill5000').value) || 0,
    bill_1000: parseInt(document.getElementById('bill1000').value) || 0,
    coin_500: parseInt(document.getElementById('coin500').value) || 0,
    coin_100: parseInt(document.getElementById('coin100').value) || 0,
    coin_50: parseInt(document.getElementById('coin50').value) || 0,
    coin_10: parseInt(document.getElementById('coin10').value) || 0,
    coin_1: parseInt(document.getElementById('coin1').value) || 0,
    open_time: nowJST.toISOString(),
    update_day:caixaDate.value
};
// 合計金額の計算
const totalAmount = (data.bill_5000 * 5000) +
                    (data.bill_10000 * 10000) +
                    (data.bill_1000 * 1000) +
                    (data.coin_500 * 500) +
                    (data.coin_100 * 100) +
                    (data.coin_50 * 50) +
                    (data.coin_10 * 10) +
                    (data.coin_1 * 1);

// 合計金額が0ならアラートを表示して処理を中断
if (totalAmount === 0) {
      alert(t('total_zero_error'));
    return;
}
// 合計金額をオープン金額として追加
data.totalAmount = totalAmount;


// サーバーにデータを送信
showLoadingPopup()
fetch(`${server}/orderskun/registers/close`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  console.log('売り上げ登録開始')
  const cashSales8Text = document.getElementById('cashSales8').innerHTML
  const cashSales10Text = document.getElementById('cashSales10').innerHTML

  const cashSales8Amount = Number(
      cashSales8Text.split('<br>')[0].replace(/[￥,]/g, '')
    );
    const cashSales10Amount = Number(
        cashSales10Text.split('<br>')[0].replace(/[￥,]/g, '')
      );
      console.log(cashSales10Amount)
      console.log(cashSales8Amount)

if(cashSales10Amount!=0){
postCashExpense(512, cashSales10Amount, '現金売上　消費税10％対象',caixaDate.value)
}

if(cashSales8Amount!=0){
postCashExpense(511, cashSales8Amount, '現金売上　消費税8％対象',caixaDate.value)
}
    showToast(t('done'))
  return response.json();
})
.then(data => {

  hideLoadingPopup();
})
.catch(error => {
  hideLoadingPopup();
  console.error('エラー:', error);
  alert(`エラーが発生しました: ${error.message}`);
});
getRegisters()
});

async function nextDayfinshTimeGFet(){
  // 現在のUTC時間を取得
  const nowUTC = new Date();
  // 日本時間に変換 (UTC+9)
  const nowJST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000));
  // 翌日の午前5時を設定
  const nextDay5AMJST = new Date(nowJST);
  nextDay5AMJST.setDate(nowJST.getDate() + 1);  // 翌日
  // 年・月・日・時刻をフォーマットして日本時間の文字列を作成
  const formattedDate = nextDay5AMJST.getFullYear() + '-' +
                        ('0' + (nextDay5AMJST.getMonth() + 1)).slice(-2) + '-' +
                        ('0' + nextDay5AMJST.getDate()).slice(-2) + 'T' +
                        ('0' + nextDay5AMJST.getHours()).slice(-2) + ':' +
                        ('0' + nextDay5AMJST.getMinutes()).slice(-2) + ':' +
                        ('0' + nextDay5AMJST.getSeconds()).slice(-2);
     console.log(formattedDate)
                        return formattedDate
}

let isLoadingOrders = false;

async function getOrdersbyPickupTime() {
  if (isLoadingOrders) {
    console.warn("⚠️ getOrdersbyPickupTime() is already running. Skipping.");
    return;
  }
  isLoadingOrders = true;
    showLoadingPopup();
    const startDate = `${salesStart.value}:00.000Z`;  // UTC指定のため'Z'を追加
    const endDate = `${salesFinish.value}:59.999Z`;   // 23:59:59を設定
    const orderCardContainer = document.getElementById("order-card-under");

      // 初期化（前の結果を消す）
      orderCardContainer.innerHTML = "";
    try {
        // `await` を `fetch` の前に追加
        // const startDate = '2025-06-29 00:00:00.000Z'
        const response = await fetch(`${server}/orderskun/pickup-time/range?startDate=${startDate}&endDate=${endDate}&user_id=${clients.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log(data)
        hideLoadingPopup();
        if (data.length > 0) {
          const paymentSummary = {
            cash10: { total_amount: 0, count: 0, items: [] },
            card10: { total_amount: 0, count: 0, items: [] },
            cash8:  { total_amount: 0, count: 0, items: [] },
            card8:  { total_amount: 0, count: 0, items: [] },
            uber:   { total_amount: 0, count: 0, orders: [] },
            unconfirmed: { total_amount: 0, count: 0, orders: [] }  // 🆕
          };

          data.forEach(order => {
            const method = order.payment_method;
            const type = order.order_type;
            if (order.order_status === "confirmed") {
              // ✅ 既存のロジックをそのまま実行
              if (type === "uber") {
                const amount = parseFloat(order.total_amount);
                paymentSummary.uber.orders.push(order);
                paymentSummary.uber.total_amount += amount;
                paymentSummary.uber.count += 1;

                const card = document.createElement("div");
                card.className = "order-card-under uber-card";
                card.innerHTML = `
                  <div><strong >ID #${order.id}</strong></div>
                  <div>${order.order_name}</div>
                  <div>${order.order_type}</div>
                  <div>${order.payment_method}</div>
                  <div>￥${Number(order.total_amount).toLocaleString()}</div>
                `;
                orderCardContainer.appendChild(card);
              } else {
                let orderTotal = 0;
                let itemCount = 0;
                let countedInSummary = false;
                order.OrderItems.forEach(item => {
                  const menuData = item.menu || item.Menu;
                  const isTakeout = menuData?.is_takeout;
                  const price = parseFloat(item.item_price || 0);
                  if (!isNaN(price)) {
                    orderTotal += price;
                    itemCount += 1;
                  }
                  if (isNaN(price)) return;
                  const key = (method === "cash"
                    ? (isTakeout ? "cash8" : "cash10")
                    : (isTakeout ? "card8" : "card10")
                  );

                  paymentSummary[key].total_amount += price;
                  paymentSummary[key].items.push(item);

                  if (!countedInSummary) {
                    paymentSummary[key].count += 1;
                    countedInSummary = true;
                  }
                });
                const card = document.createElement("div");
                card.className = "order-card-under";
                card.innerHTML = `
                  <div><strong >ID #${order.id}</strong></div>
                  <div>${order.order_name}</div>
                  <div>${order.order_type}</div>
                  <div>${order.payment_method}</div>
                  <div>￥${Number(order.total_amount).toLocaleString()}</div>
                `;
                orderCardContainer.appendChild(card);
              }
            } else {
              const unconfirmedLabel = getUnconfirmedLabel(clients.language);
              // 合計に追加
              const amount = parseFloat(order.total_amount || 0);
              if (!isNaN(amount)) {
                paymentSummary.unconfirmed.total_amount += amount;
                paymentSummary.unconfirmed.count += 1;
                paymentSummary.unconfirmed.orders.push(order);
              }
              // カード作成
              const card = document.createElement("div");
              card.className = "order-card-under unconfirmed-card";
              card.innerHTML = `
                <div><strong>ID #${order.id}</strong> ${unconfirmedLabel}</div>
                <div>${order.order_name}</div>
                <div>${order.order_type}</div>
                <div>${order.payment_method}</div>
                <div>￥${Number(order.total_amount).toLocaleString()}</div>
              `;
              orderCardContainer.appendChild(card);
            }
          });

          clients.salesInfo = paymentSummary;
          renderSalesSummaryToUI(clients.salesInfo)
          applyTranslation(clients.language)
        }else {
            console.log('No orders found for the given pickup time');
        }
    } catch (error) {
        hideLoadingPopup();
        console.error('Error fetching orders by pickup time:', error);
    }　finally {
    isLoadingOrders = false;
  }
}


function renderSalesSummaryToUI(salesInfo) {
  const format = (val, count) =>
    `￥${Number(val || 0).toLocaleString()}<br>（${count || 0}）`;

  // 各支払種別に反映
  document.getElementById('cashSales8').innerHTML = format(salesInfo.cash8.total_amount, salesInfo.cash8.count);
  document.getElementById('cashSales10').innerHTML = format(salesInfo.cash10.total_amount, salesInfo.cash10.count);
  document.getElementById('creditSales8').innerHTML = format(salesInfo.card8.total_amount, salesInfo.card8.count);
  document.getElementById('creditSales10').innerHTML = format(salesInfo.card10.total_amount, salesInfo.card10.count);

  const uberEl = document.getElementById('uberSales');
  uberEl.innerHTML = format(salesInfo.uber.total_amount, salesInfo.uber.count);

  // 🔻 未確定注文を表示（存在すれば）
  if (salesInfo.unconfirmed) {
    const uncEl = document.getElementById('unconfirmedSales');
    if (uncEl) {
      uncEl.innerHTML = format(salesInfo.unconfirmed.total_amount, salesInfo.unconfirmed.count);
    }
  }

  // 🔻 総合計の表示要素がなければ作る（初回だけ）
  let totalEl = document.getElementById('sales-total-summary');
  if (!totalEl) {
    totalEl = document.createElement('div');
    totalEl.id = 'sales-total-summary';
    totalEl.style = 'margin-top: 12px; font-weight: bold; color: #00796b;';
    document.querySelector('.receitas-por-tipo').appendChild(totalEl);
  }

  // 🔢 総合計の計算（未確定注文も含める！）
  const totalAmount =
    salesInfo.cash8.total_amount +
    salesInfo.cash10.total_amount +
    salesInfo.card8.total_amount +
    salesInfo.card10.total_amount +
    salesInfo.uber.total_amount +
    (salesInfo.unconfirmed?.total_amount || 0);  // 🆕

  const totalCount =
    salesInfo.cash8.count +
    salesInfo.cash10.count +
    salesInfo.card8.count +
    salesInfo.card10.count +
    salesInfo.uber.count +
    (salesInfo.unconfirmed?.count || 0); // 🆕

  document.getElementById('total-vendas').value = `￥${totalAmount.toLocaleString()}`;
  const saldo = salesInfo.cash10.total_amount + salesInfo.cash8.total_amount;
  console.log(clients.regiterCaixa);
  document.getElementById('totalBalance').innerText = `￥${(saldo + clients.regiterCaixa).toLocaleString()}`;
}


function getUnconfirmedLabel(lang) {
  switch (lang) {
    case 'ja': return '🚧 未確定';
    case 'en': return '🚧 Unconfirmed';
    case 'pt': return '🚧 Não confirmado';
    default:   return '🚧 Unconfirmed';
  }
}


async function postCashExpense(categoryId, amount, memo,registerDate) {

  const datetimeValue = document.getElementById('salesStart').value;
// → "2025-07-15T13:45" のような文字列が返る

const dateOnly = datetimeValue.split('T')[0];
console.log(dateOnly); // "2025-07-15"

  const data = {
    userId:26,
    date: dateOnly,
    method:'cash',
    supplier:'9999',
    amount: String(amount),
    memo: `${memo}`,
    category: categoryId,
    kubun:1
  };

  console.log(data)

  try {
    const response = await fetch(`${server}/keirikun/data/upsert/expenses/by/orderskun`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    const resJson = await response.json();

    if (response.ok) {
  // ✅ 売上確定したら財布も更新
  await updateWalletBalanceAPI(amount);
}

  } catch (error) {
console.error('登録エラー', error);
  }
}

async function updateWalletBalanceAPI(addAmount) {
  try {
    // 現在の残高取得
    const res = await fetch(`${server}/wallet/get-balance?user_id=26`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.localStorage.getItem('token')}`
      }
    });

    const data = await res.json();
    if (!res.ok) throw new Error('残高取得失敗');

    const currentBalance = parseFloat(data.balance) || 0;
    const newBalance = currentBalance + parseFloat(addAmount);

    // 更新API
    const updateRes = await fetch(`${server}/wallet/update-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        user_id: 26,
        balance: newBalance
      })
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok) throw new Error('残高更新失敗');

  } catch (err) {
    console.error('wallet update error:', err);
  }
}

const inputField = document.getElementById('anotacoes');
// クリック時にサイズを拡張
inputField.addEventListener('focus', function() {
  inputField.classList.add('expanded');
});
// フォーカスが外れたら元のサイズに戻す
inputField.addEventListener('blur', function() {
  inputField.classList.remove('expanded');
});

caixaDate.addEventListener('change', async ()=>{
await getRegisters(clients.id)
await openCaixaModal()
})

 const buttons = document.querySelectorAll('.tenkey-btn');
 const depositInput = document.getElementById('deposit-amount')

 buttons.forEach(btn => {
   btn.addEventListener('click', () => {
     const value = btn.textContent;
     console.log(value)
     console.log(btn.id)

     if (btn.id === 'tenkey-clear') {
       depositInput.value = '';
     } else if (btn.id === 'tenkey-del') {
       depositInput.value = depositInput.value.slice(0, -1);

     } else {

       depositInput.value += value;

     }
formatInput()
     // updateChange();
   });
 });

 document.getElementById('juntar-comandas').addEventListener('click', () => {
   const list = clients.pendingOrders.map(o => `
     <div style="margin-bottom: 10px;">
       <label style="margin-right: 10px;">
         <input type="radio" name="main-order" value="${o.id}" />
         <strong data-i18n="merge_here">← Juntar neste pedido</strong>
       </label>
       <label>
         <input type="checkbox" class="merge-order" value="${o.id}" />
         #${o.id} - ¥${parseInt(o.total_amount).toLocaleString()}（${o.order_name}）
       </label>
     </div>
   `).join('');

   document.getElementById('order-list').innerHTML = list;
   document.getElementById('mergeModal').style.display = 'block';
 });


 function createDependentePedidosRetry(context){

   const {
     MainData,
     clients,
     currentLang,
     orderItems,
     totalAmountElement,
     t,
     updateChange
   } = context;

   ordersList.innerHTML = '';

   clients.pendingOrders.forEach(order => {

     let tableDisplay = order.table_no;
     let status = "Pronto";
     let styleColer ="background-color:#90EE90";
     let icon="";

     let displayText = (order.order_type === 'local' && order.table_no !== '9999')
       ? ` ${t('table_label')}:${order.table_no}`
       : '';

     tableDisplay = `${displayText}<br>${order.order_name}`;

     if(order.order_status === 'pending') {
       status = t('status_pending');
       styleColer = 'background-color:#FFCCCB';
       icon = '<img src="../imagen/pending.jpg">';
     } else if(order.order_status === 'prepared') {
       status = t('status_prepared');
       icon = '<img src="../imagen/prepared.jpg">';
     }

     if(order.payment_method!="yet"){
       icon+='<img src="../imagen/payed.jpg">';
     }

     let orderCard = document.createElement('div');
     orderCard.classList.add('order-card');
     orderCard.style = styleColer;
     orderCard.setAttribute('data-id', order.id);
     orderCard.id = order.id;

     orderCard.innerHTML = `
       <div class="order-card-main-div">
         <div class="order-leftdiv"><h3>${tableDisplay}<br>${status}</h3></div>
         <div class="order-rightdiv">${icon}</div>
       </div>
     `;

     orderCard.addEventListener('click', () => {

       if (selectedCard) {
         selectedCard.classList.remove('selected-card');
       }

       orderCard.classList.add('selected-card');
       selectedCard = orderCard;
       selectOrders = order;

       document.getElementById('deposit-amount').value='';

       displayOrderDetails(order, context); // ←ここシンプルになる🔥
     });

     ordersList.appendChild(orderCard);
     hideLoadingPopup();
   });
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

    // 特例：中に要素がある場合（ボタン付きタイトルなど）
    if (el.tagName === 'INPUT') {
      if (el.hasAttribute('placeholder')) {
        el.placeholder = translated;
      } else {
        el.value = translated;
      }
    } else if (el.querySelector('button')) {
      const button = el.querySelector('button');
      el.childNodes[0].nodeValue = translated + ' ';
      el.appendChild(button);
    } else {
      el.innerHTML = translated;
    }
  });
}


 document.getElementById('language-select').value = currentLang;
 applyTranslation(currentLang);

 //2025/06/29


function setCashMode(mode) {
  currentMode = mode;

  // ラベルの切り替え
  const label = document.getElementById("cashModeLabel");
  console.log(clients.language)
  if (mode === "open") {
    label.textContent = clients.language === 'ja' ? "🟢 OPENモード" : "🟢 Modo para brir caixa";
    label.className = "mode-label mode-open";

  } else {
    label.textContent = clients.language === 'ja' ? "🔴 CLOSEモード" : "🔴 Modo para fechar caixa";
    label.className = "mode-label mode-close";
  }

  createStatuscaixa(currentMode)

  // ボタンの見た目切り替え
  document.getElementById("openModeBtn").classList.toggle("active", mode === "open");
  document.getElementById("closeModeBtn").classList.toggle("active", mode === "close");

  // ボタン文言などもここで切り替え可（例: registerボタンなど）
  const actionBtn = document.getElementById("closeRegisterBtn");
  if (actionBtn) {
    const lang = navigator.language.startsWith("ja") ? "ja" : "pt";

    if (mode === "open") {
      actionBtn.textContent = clients.language === "ja" ? "▶ レジを開ける" : "▶ Abrir o caixa";
    } else {
      actionBtn.textContent = clients.language === "ja" ? "💴 レジを締める" : "💴 Fechar o caixa";

    }
  }

  // createStatuscaixa()

}

// 初期設定
document.getElementById("openModeBtn").addEventListener("click", () => setCashMode("open"));
document.getElementById("closeModeBtn").addEventListener("click", () => setCashMode("close"));


//2025/06/29

let currentEditingOrderId = null;

// モーダルを開く関数
function openEditOrderModal(orderId, currentOrderType, currentPaymentMethod) {
  currentEditingOrderId = orderId;

  // 現在の値をモーダルにセット
  document.getElementById('edit-order-type').value = currentOrderType;
  document.getElementById('edit-payment-method').value = currentPaymentMethod;

  // モーダル表示
  document.getElementById('edit-order-modal').classList.remove('hidden');
}

// モーダルを閉じる関数
function closeEditOrderModal() {
  document.getElementById('edit-order-modal').classList.add('hidden');
  currentEditingOrderId = null;
}

// 保存ボタン
document.getElementById('save-order-edit').addEventListener('click', () => {
  const newType = document.getElementById('edit-order-type').value;
  const newPayment = document.getElementById('edit-payment-method').value;

  if (currentEditingOrderId) {
    // 対象のカードを取得（idのルール例: order-card-123）
    const card = document.getElementById(`order-card-${currentEditingOrderId}`);
    if (card) {
      // 表示内容を更新（i18n対応してるなら translatePage() 再実行でもOK）
      card.querySelector('[data-field="order_type"]').innerText = newType;
      card.querySelector('[data-field="payment_method"]').innerText = newPayment;
    }

    // 必要ならバックエンドにも送信
    // updateOrder(currentEditingOrderId, { order_type: newType, payment_method: newPayment });
  }

  closeEditOrderModal();
});

// キャンセルボタン
document.getElementById('cancel-order-edit').addEventListener('click', closeEditOrderModal);

async function sendSquareCheckout(){
  const loadingModal = document.getElementById('loadingModal');

  try {
    const rawText = taxIncluidAmountElent.innerText;
    const amountStr = rawText.replace(/[^\d]/g, '');
    const amount = parseInt(amountStr, 10);

    const confirmed = window.confirm(`この金額でチェックアウトしますか？\n${rawText}`);
    if (!confirmed) return;

    // ✅ 処理中モーダル表示
    loadingModal.style.display = 'flex';

    console.log('チェックアウト開始');

    const checkoutRes = await fetch('http://localhost:3001/checkout-terminal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        note: "POSからの会計"
      })
    });

    const result = await checkoutRes.json();
    console.log(result.data.checkout.id);

    const checkoutId = result.data.checkout.id;
    const start = Date.now();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/checkout-status?id=${checkoutId}`);
        const data = await res.json();

        const status = data.status;
        console.log(`📡 ステータス: ${status}`);

        if (status === 'COMPLETED') {
          clearInterval(interval);
          loadingModal.style.display = 'none'; // ✅ 完了で非表示
          alert('✅ 支払い完了！');
        } else if (status === 'CANCELED' || status === 'FAILED') {
          clearInterval(interval);
          loadingModal.style.display = 'none'; // ✅ 異常終了で非表示
          alert('❌ 支払いが失敗またはキャンセル');
        }

        if (Date.now() - start > 90000) {
          clearInterval(interval);
          loadingModal.style.display = 'none'; // ✅ タイムアウトでも非表示
          alert('⚠ タイムアウト');
        }

      } catch (err) {
        clearInterval(interval);
        loadingModal.style.display = 'none'; // ✅ エラーでも非表示
        alert('⚠ ステータス確認失敗');
        console.error(err);
      }
    }, 3000);

  } catch (err) {
    loadingModal.style.display = 'none'; // ✅ 例外発生でも非表示
    console.error('❌ チェックアウトエラー:', err);
    alert('会計処理に失敗しました');
  }
}

document.getElementById("refreshBtn").addEventListener("click", () => {
  location.reload();
});

//ここから修正品
function displayOrderDetails(order, context) {

  const {
    MainData,
    clients,
    currentLang,
    orderItems,
    totalAmountElement,
    t,
    updateChange
  } = context;

  console.log(order);

  // 支払いボタン初期化
  const paymentButtons = [
    document.getElementById('cash-payment'),
    document.getElementById('credit-payment'),
    document.getElementById('other-payment')
  ];

  paymentButtons.forEach(button => button.classList.remove("selected"));
  clients.paytype = '';

  if (order.payment_method === 'cash') {
    document.getElementById('cash-payment').classList.add('selected');
    clients.paytype = 'cash';
  }
  if (order.payment_method === 'credit') {
    document.getElementById('credit-payment').classList.add('selected');
    clients.paytype = 'credit';
  }
  if (order.payment_method === 'other') {
    document.getElementById('other-payment').classList.add('selected');
    clients.paytype = 'other';
  }

  clients.printInfo = order;
  clients.selectedOrder = order.id;
  orderItems.innerHTML = '';

  clients.tax_use = true;
  const isExclusive = clients.tax_type === 'exclusive';

  let receiptData = {
    items: [],
    totalAmount: 0,
    tax_8: 0,
    tax_10: 0,
    taxTotal: 0,
    totalWithTax: 0,
    tax_type: clients.tax_type,
    tax_use: clients.tax_use,
    order_id: order.id,
    nomedaComanda: order.order_name,
    receipt_display_name: clients.receipt_display_name,
    receipt_postal_code: clients.receipt_postal_code,
    receipt_address: clients.receipt_address,
    receipt_tel: clients.receipt_tel,
    invoice_number: clients.invoice_number
  };

  let subtotal = 0;
  let tax_8 = 0;
  let tax_10 = 0;

  order.OrderItems.forEach(item => {
    const menuGt = MainData.menus.find(menu => menu.id === item.menu_id);
    const dbLang = currentLang === 'jp' ? 'ja' : currentLang;

    item.menu_name = menuGt
      ? menuGt[`menu_name_${dbLang}`]
      : t('menu_not_found');

    const isTakeout = menuGt?.is_takeout;
    const taxRate = isTakeout ? 0.08 : 0.10;
    const taxLabel = isTakeout ? '8%' : '10%';
    const taxColor = isTakeout ? 'green' : 'red';
    const price = parseFloat(item.total_price);

    const options = JSON.parse(item.options || '[]');
    const optionNames = options.map(opt => {
      const optData = MainData.options.find(o => o.id === parseInt(opt.id));
      return optData ? optData[`option_name_${dbLang}`] : '';
    }).filter(Boolean).join(', ');

    item.option_names = optionNames;

    if (isExclusive) {
      subtotal += price;
      if (taxRate === 0.08) tax_8 += price * 0.08;
      else tax_10 += price * 0.10;
    } else {
      const rate = taxRate === 0.08 ? 1.08 : 1.10;
      const noTax = Math.round(price / rate);
      const tax = price - noTax;

      subtotal += noTax;
      if (taxRate === 0.08) tax_8 += tax;
      else tax_10 += tax;
    }

    const li = document.createElement('li');
    li.innerHTML = `
      ${item.menu_name} x${item.quantity} - ¥${price.toLocaleString()}
      <span style="color:${taxColor};font-weight:bold;">${taxLabel}</span><br>
      ${item.option_names || ''}
    `;
    orderItems.appendChild(li);

    receiptData.items.push({
      menu_name: item.menu_name,
      quantity: item.quantity,
      item_price: price,
      option_names: item.option_names,
      tax: taxLabel
    });
  });

  receiptData.tax_8 = Math.floor(tax_8);
  receiptData.tax_10 = Math.floor(tax_10);
  receiptData.taxTotal = receiptData.tax_8 + receiptData.tax_10;
  receiptData.totalAmount = Math.floor(subtotal);
  receiptData.totalWithTax = isExclusive
    ? receiptData.totalAmount + receiptData.taxTotal
    : Math.floor(subtotal + receiptData.taxTotal);

  totalAmountElement.textContent = `￥${receiptData.totalAmount.toLocaleString()}`;
  document.getElementById('tax-total').textContent = `￥${receiptData.taxTotal.toLocaleString()}`;
  document.getElementById('tax-included-amount').textContent = `￥${receiptData.totalWithTax.toLocaleString()}`;

  updateChange();
  clients.receiptData = receiptData;

  const channel = new BroadcastChannel('customer-display');
  channel.postMessage({
    type: 'update',
    order_id: order.id,
    totalWithTax: receiptData.totalWithTax,
    items: receiptData.items,
    paymentAmount: null
  });
}

document.getElementById('merge-close-btn').addEventListener('click', () => {
  document.getElementById('mergeModal').style.display = 'none';
});
