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
  tax_type:decodedToken.tax_type

}
console.log(clients)

if(clients.id === 17){
    window.location.href = '../pages/posNew.html';
}

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
   await getOrdersbyPickupTime()
   openModalBtn.onclick = function() {
     openCaixaModal()
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

              displayOrderDetails(order);
          });
          ordersList.appendChild(orderCard);
           hideLoadingPopup();
      });
  }

  function displayOrderDetails(order) {
    console.log(order);

       const locale = navigator.language.startsWith('pt') ? 'pt-BR' : 'ja-JP';

    // 支払いボタン初期化
    const paymentButtons = [cashPaymentButton, creditPaymentButton, otherPaymentButton];
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
    orderItems.innerHTML = ''; // アイテムエリア初期化

    // 税区分（設定から取得）
    clients.tax_use = true;
    const isExclusive = clients.tax_type === 'exclusive';　　　
    console.log(isExclusive)
    console.log(clients.tax_type)
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
      item.menu_name = menuGt ? menuGt[`menu_name_${dbLang}`] : t('menu_not_found');


      const isTakeout = menuGt?.is_takeout;
      const taxRate = isTakeout ? 0.08 : 0.10;
      const taxLabel = isTakeout ? '8%' : '10%';
      const taxColor = isTakeout ? 'green' : 'red';
      const price = parseFloat(item.total_price);

      // オプション名取得
      const options = JSON.parse(item.options || '[]');
      const optionNames = options.map(opt => {
        const dbLang = currentLang === 'jp' ? 'ja' : currentLang;
        const optData = MainData.options.find(o => o.id === parseInt(opt.id));
        return optData ? optData[`option_name_${dbLang}`] : '';

      }).filter(name => name).join(', ');
      item.option_names = optionNames;

      // 税計算（内税か外税で処理を分ける）
      if (isExclusive) {
        subtotal += price;
        if (taxRate === 0.08) tax_8 += price * 0.08;
        else tax_10 += price * 0.10;
      } else {
        if (taxRate === 0.08) {
          const noTax = Math.round(price / 1.08);
          const tax = price - noTax;
          subtotal += noTax;
          tax_8 += tax;
        } else {
          const noTax = Math.round(price / 1.10);
          const tax = price - noTax;
          subtotal += noTax;
          tax_10 += tax;
        }
      }


      // 表示
      const li = document.createElement('li');
      li.innerHTML = `
        ${item.menu_name} x${item.quantity} - ¥${price.toLocaleString()}
        <span style="color: ${taxColor}; font-weight: bold;">${taxLabel}</span><br>
        ${item.option_names || ''}
      `;
      orderItems.appendChild(li);

      // レシートデータ追加
      receiptData.items.push({
        menu_name: item.menu_name,
        quantity: item.quantity,
        item_price: price,
        option_names: item.option_names,
        tax: isTakeout ? '8%' : '10%'
      });
    });

    receiptData.tax_8 = Math.floor(tax_8);
    receiptData.tax_10 = Math.floor(tax_10);
    receiptData.taxTotal = receiptData.tax_8 + receiptData.tax_10;
    receiptData.totalAmount = Math.floor(subtotal);
    receiptData.totalWithTax = isExclusive
      ? receiptData.totalAmount + receiptData.taxTotal
      : Math.floor(subtotal + receiptData.taxTotal);

    // 表示更新

       totalAmountElement.textContent = receiptData.totalAmount.toLocaleString(locale, { style: 'currency', currency: 'JPY' });
    document.getElementById('tax-total').textContent = receiptData.taxTotal.toLocaleString(locale, { style: 'currency', currency: 'JPY' });
    document.getElementById('tax-included-amount').textContent = receiptData.totalWithTax.toLocaleString(locale, { style: 'currency', currency: 'JPY' });
    // totalAmountElement.textContent = `￥${receiptData.totalAmount.toLocaleString()}`;
    // document.getElementById('tax-total').textContent = `￥${receiptData.taxTotal.toLocaleString()}`;
    // document.getElementById('tax-included-amount').textContent = `￥${receiptData.totalWithTax.toLocaleString()}`;

    updateChange();
    clients.receiptData = receiptData;
  }


    // depositAmountElement.addEventListener('input', updateChange);
    // function updateChange() {

    //   let depositAmountElement = document.getElementById('deposit-amount'); // 預入金額
    //   let changeAmountElement = document.getElementById('change-amount'); // 釣り
    //   let taxIncludedAmountElement = document.getElementById('tax-included-amount'); // 総額

    //   let deposit = parseInt(depositAmountElement.value.replace(/[^\d]/g, '')) || 0;
    //   let total = parseInt(taxIncludedAmountElement.textContent.replace(/[^\d]/g, '')) || 0;
    //   let change = deposit - total;

    //   changeAmountElement.value = change >= 0 ? `¥${change.toLocaleString()}` : "¥0";
    // }

function updateChange() {
  let depositAmountElement = document.getElementById('deposit-amount'); // 預入金額
  let changeAmountElement = document.getElementById('change-amount'); // 釣り
  let taxIncludedAmountElement = document.getElementById('tax-included-amount'); // 総額

  // ← 修正ポイント（parseLocalizedNumberで正規化）
  let deposit = parseLocalizedNumber(depositAmountElement.value);
  let total = parseLocalizedNumber(taxIncludedAmountElement.textContent);

  let change = deposit - total;

  // 通貨表記は現在のブラウザ言語にあわせる
  const locale = navigator.language.startsWith('pt') ? 'pt-BR' : 'ja-JP';
  changeAmountElement.value = change >= 0
    ? change.toLocaleString(locale, { style: 'currency', currency: 'JPY' })
    : "¥0";
}


 
    // Confirm Payment Button Logic
    document.getElementById('confirm-payment').addEventListener('click', async () => {
    // Assuming you have a selectedOrder variable that stores the current order
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
    alert(t('done'));

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
    alert(t('select_order'));
  }
}

paymentButtons.forEach(button => {
button.addEventListener('click', () => {
    paymentButtons.forEach(btn => btn.classList.remove('selected'));
    // Update the paytype based on the selected button
    if (button === cashPaymentButton) {
        updatePayType('cash',button);
    } else if (button === creditPaymentButton) {
        updatePayType('credit',button);
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
          alert(t('select_order'));
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
    alert(t('done'));
      // モーダルを閉じる
      selctedCard = null;
      document.getElementById('menuModal').style.display = "none";
      console.log(responseData)
      // 最新のオーダー情報を画面に反映（必要に応じて更新されたオーダー詳細を表示）
      displayOrderDetails(responseData);  // 関数にデータを渡して画面に反映
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
      alert(t('select_order'));
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
          alert(t('done'));
          clearOrderDetails();
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
  if(!selectedCard){
    alert(t('select_order'));
    return
  }

if(clients.printInfo.order_type==='local'||clients.printInfo.order_type==='order'||clients.printInfo.order_type==='takeout'){
  if(clients.printInfo.payment_method==='yet'&&clients.paytype===""){
    alert(t('payment_not_registered'));
    return
  }
}
if(clients.printInfo.order_type==='uber'||clients.printInfo.order_type==='demaekan'||clients.printInfo.order_type==='other'){
  clients.paytype='other'
}
  // Update the order in the database
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
          alert(t('done'));
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
    // 初期設定: ボタンのクリックイベントを追加
    // document.getElementById('tax-8').addEventListener('click', function() {
    //   if(!selectedCard){
    //     alert('selecione o pedido')
    //     return
    //   }
    //   console.log(clients.tax_use)
    //   if(!clients.tax_use){
    //     selectTaxButton('tax-8');
    //     return
    //   }
    //     applyTax(8);
    //     selectTaxButton('tax-8');
    //     clients.taxtType = 8;
    //     updateChange()
    //     // updateChangeAmount();
    // });

    // document.getElementById('tax-10').addEventListener('click', function() {
    //   if(!selectedCard){
    //     alert('selecione o pedido')
    //     return
    //   }
    //   if(!clients.tax_use){
    //     selectTaxButton('tax-10');
    //     return
    //   }
    //     applyTax(10);
    //     selectTaxButton('tax-10');
    //     clients.taxtType = 10;
    //     updateChange()
    //     // updateChangeAmount();
    // });
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
  showLoadingPopup()
    if (!clients.selectedOrder) {
        alert(t('select_order'));
        hideLoadingPopup()
        return;
    }
    // 選択されたオーダーのIDと、オーダー内のアイテムIDを取得
    const selectedOrderId = clients.selectedOrder;
    const orderItems = clients.printInfo.OrderItems.map(item => item.id); // アイテムIDの配列を取得

    // 削除確認のダイアログを表示
    const confirmDelete = confirm(t('confirm_delete_order'));
    if (!confirmDelete) return;

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
            alert(t('done'));
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
// async function recite(nb, reciteAmount) {
//   if (!clients.receiptData) {
//       alert("Selecione uma comanda");
//       return;
//   }
//
//   if (!clients.selectedOrder) {
//       alert('Seleciona uma comanda');
//       return;
//   }
//   // if(clients.tax_use&&clients.taxtType===""){
//   //   alert("Selecione o imposto")
//   //   return
//   // }
//   // if(clients.depositAmount===""){
//   //   alert("Insira o vlor recebido")
//   //   return
//   // }
//   if(clients.paytype===""){
//     alert("Selecione a forma de pagamento")
//     return
//   }
//
//   if(document.getElementById('deposit-amount').value===""||document.getElementById('deposit-amount').value-0===0){
//     alert("Insira o valor recebido")
//     return
//   }
//   if((document.getElementById('deposit-amount').value-0)<clients.receiptData.taxInclued){
//     alert('O valor recebido está menor do que o valor com imposto')
//     return
//   }
//
//   const troco = document.getElementById('change-amount').value
//   const recebido = document.getElementById('deposit-amount').value
//   const valorcomTax = document.getElementById('tax-included-amount').innerText
//   let valorINclusoTax = ''
//   if(clients.tax_use){
//     valorINclusoTax =clients.receiptData.taxInclued
//   }else{
//     valorINclusoTax =valorcomTax.split('￥')[1]
//   }
//   let valorSemTax = selectOrders.total_amount
//   if (valorSemTax.endsWith(".00")) {
//     valorSemTax = valorSemTax.slice(0, -3);
// }
//
// console.log(clients.receiptData)
//
// if(clients.id===1){
//   clients.receiptData.taxtTypes=clients.taxtType
//   clients.receiptData.depositAmount = recebido
//   clients.receiptData.changeAmount=troco
// reciteBuonissimoOnly()
// }else{
//   let row = `<div id="contentToPrint" class="print-content">
//     <div class="img-dicvs">
//       ${decodedToken.receipt_logo_url ? `<img src="${decodedToken.receipt_logo_url}" width="100" class="setting-right-button" />` : ''}
//   </div>
//     <div class="adress-div">
//       <p>${decodedToken.receipt_display_name} <br>${decodedToken.receipt_postal_code} <br>${decodedToken.receipt_address}<br>${decodedToken.receipt_tel}</p>
//     </div>
//     ${decodedToken.invoice_number && decodedToken.invoice_number!='' ? `
//     <div class="display-center-div">
//      <p>登録番号：${decodedToken.invoice_number}</p>
//     </div>`
//     :''}
//     <div class='display-center-div'>
//       <p>${await getCurrentDateTime()} #${clients.receiptData.order_id}</p>
//     </div>
//
//     <div class="contents-div">
//     ${await generateReceiptItemsHTML()}
//     </div>
//     <div class="dotted-line"></div>
//     <div class="total-qt">
//       <div class="azukari-amount-div">
//         <div>御買上げ点数　　</div>
//         <div>${clients.receiptData.items.length}点</div>
//       </div>
//       <div class="azukari-amount-div">
//         <div>小計</div>
//         <div>￥${clients.receiptData.totalAmount.toLocaleString()}</div>
//       </div>
//       ${decodedToken.tax_enabled ? `
//       <div class="azukari-amount-div">
//         <div>(${clients.taxtType}%対象：${valorSemTax}</div>
//         <div>消費税：${valorINclusoTax-valorSemTax})</div>
//       </div>`
//       :''}
//
//     </div>
//     <div class="dotted-line"></div>
//     <div class="total-amount-div">
//       <div>合計</div>
//       <div>￥${valorINclusoTax.toLocaleString()}</div>
//     </div>
//     <div class="total-amount-div">
//       <div>お預り</div>
//     <div>${recebido.toLocaleString()}</div>
//     </div>
//     <div class="total-amount-div">
//       <div>お釣り</div>
//       <div>${troco.toLocaleString()}</div>
//     </div>
//     <div class="dotted-line"></div>
//   </div>`;
//
//   var printWindow = window.open('', '_blank');
//
//   // ウィンドウが正常に開けているか確認
//   if (!printWindow) {
//     alert('A página foi bloqueata, verifique a configuração do google');
//     return; // 処理を終了します
//   }
//
//   // 新しいウィンドウにコンテンツを書き込む
//   printWindow.document.write(`
//     <html>
//     <head>
//       <title id="title-print"></title>
//       <style>
//         @media print {
//           #body-testes {
//             width: 80mm;
//             height: 100mm !important;
//             margin: 0;
//             padding: 0;
//             overflow: hidden;
//             background-color: red !important;
//           }
//           .adress-div {
//             width: 100%;
//             height: 7rem;
//             background-color: black;
//             -webkit-print-color-adjust: exact;
//             color: white;
//             padding-left:10px
//           }
//           .img-dicvs {
//             display: flex;
//             justify-content: center;
//           }
//           .display-center-div {
//             display: flex;
//             justify-content: center;
//           }
//           .contents-div {
//             width: 100%;
//           }
//           .items-name {
//             text-align: left;
//           }
//           .details-iten {
//             width: 80%;
//             text-align: right;
//             margin-right: 1rem;
//           }
//           .dotted-line::before {
//             content: '';
//             display: block;
//             width: 100%;
//             height: 1px;
//             background-color: black;
//             background-image: repeating-linear-gradient(90deg, black, black 2px, transparent 2px, transparent 4px);
//             -webkit-print-color-adjust: exact;
//           }
//           .total-amount-div {
//             width: 100%;
//             display: flex;
//             justify-content: space-between;
//             font-size: 3vh;
//           }
//           .azukari-amount-div {
//             width: 100%;
//             display: flex;
//             justify-content: space-between;
//           }
//           .total-qt {
//             margin-top: 1rem;
//           }
//         }
//       </style>
//     </head>
//     <body id="body-testes">
//       ${row}
//     </body>
//     </html>
//   `);
//
//   // // 画像が正しく読み込まれるまで待機
//   // if (decodedToken.receipt_logo_url) {
//   //   await new Promise(resolve => {
//   //     const img = new Image();
//   //     img.onload = resolve;
//   //     img.src = decodedToken.receipt_logo_url;
//   //   });
//   // } else {
//   //   console.log("No image URL provided, skipping image load.");
//   // }
//   // printWindow.print();
//   // printWindow.close();
// }
//
//
// }

//レシートの発行
async function recite(nb, reciteAmount) {
  if (!clients.receiptData) return alert("select_order");
  if (!clients.selectedOrder) return alert("select_order");
  if (clients.paytype === "") return alert("select_payment_method");
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
          if (!clients.receiptData) return alert("Selecione uma comanda");
          if (!clients.selectedOrder) return alert("Seleciona uma comanda");
          if (clients.paytype === "") return alert("Selecione a forma de pagamento");

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

 async function openCaixaModal(){
  
if(clients.id===1){
  const password = prompt("🔐Digite a senha");
if(password !== "Nina0204"){  // ← パスワード設定
 alert("❌Senha incorreta");
 return;
}
}


  
   modal.style.display = "block";
   if(clients.registerInfo.length!=0){
     document.getElementById('bill5000').value = clients.registerInfo[0].bill_5000
     document.getElementById('bill1000').value = clients.registerInfo[0].bill_1000
     document.getElementById('coin500').value = clients.registerInfo[0].coin_500
     document.getElementById('coin100').value = clients.registerInfo[0].coin_100
     document.getElementById('coin50').value = clients.registerInfo[0].coin_50
     document.getElementById('coin10').value = clients.registerInfo[0].coin_10
     document.getElementById('coin5').value = clients.registerInfo[0].coin_5
     document.getElementById('coin1').value = clients.registerInfo[0].coin_1
     calculateTotal()
     document.getElementById('registerBtn').style.display='none'
     const inputs = document.querySelectorAll('#coins-mother-div input, #bill-mother-div input, #total-caixa-input input');
      // すべての input 要素に readonly を設定
      inputs.forEach(input => {
          input.setAttribute('readonly', true);
      });
   }else{
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
     document.getElementById('registerBtn').style.display='block'
   }
   if(clients.salesInfo){
    calculationSales()
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

 document.getElementById('calculation-again').addEventListener('click',()=>{
   calculationSales()
 })

 function calculationSales(){

   console.log('sales calculation')
   const otherSale = document.getElementById('notregister-by-money').value
   const otherSaleCard = document.getElementById('noregister-by-card').value

   document.getElementById('cashSales').innerText = `￥${clients.salesInfo.cash.total_amount.toLocaleString()}`
   document.getElementById('creditSales').innerText = `￥${clients.salesInfo.credit.total_amount.toLocaleString()}`
   document.getElementById('otherSales').innerText = `￥${clients.salesInfo.other.total_amount.toLocaleString()}`
   document.getElementById('sale-yet-register').innerText = `￥${clients.salesInfo.yet.total_amount.toLocaleString()}`

   let saldo = 0
   if(clients.registerInfo[0]){
     saldo = (clients.registerInfo[0].open_amount-0) + (clients.salesInfo.cash.total_amount-0) + (otherSale-0)
   }else{
     saldo = (clients.salesInfo.cash.total_amount-0) + (otherSale-0)
   }
   document.getElementById('totalBalance').innerText = `￥${saldo.toLocaleString()}`
   const totalSalesAmount = clients.salesInfo.cash.total_amount +
                         clients.salesInfo.credit.total_amount +
                         clients.salesInfo.other.total_amount +
                         clients.salesInfo.yet.total_amount;
   document.getElementById('total-vendas').value = `￥${((totalSalesAmount-0)+(otherSale-0)+(otherSaleCard-0)).toLocaleString()}`
 }

 // 合計金額を算出する関数
 function calculateTotal() {
   const bill5000 = parseInt(document.getElementById('bill5000').value) || 0;
   const bill1000 = parseInt(document.getElementById('bill1000').value) || 0;
   const coin500 = parseInt(document.getElementById('coin500').value) || 0;
   const coin100 = parseInt(document.getElementById('coin100').value) || 0;
   const coin50 = parseInt(document.getElementById('coin50').value) || 0;
   const coin10 = parseInt(document.getElementById('coin10').value) || 0;
   const coin5 = parseInt(document.getElementById('coin5').value) || 0;
   const coin1 = parseInt(document.getElementById('coin1').value) || 0;

   // 各金額を計算
   const total = (bill5000 * 5000) + (bill1000 * 1000) +
                 (coin500 * 500) + (coin100 * 100) + (coin50 * 50) +
                 (coin10 * 10) + (coin5 * 5) + (coin1 * 1);

   document.getElementById('totalAmount').value = '￥' + total.toLocaleString() ;
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
    const url = `${server}/orderskun/registers?date=${selectDay}&clientsId=${id}`;

    try {
        // await を fetch に追加し、fetch の完了を待つ
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        clients.registerInfo = data;
        registerFlug = true;

        if (clients.registerInfo.length === 0) {
          clients.registerInfo =''
            notRegisterInfo.style.display = "block";
        }

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


document.getElementById('registerBtn').addEventListener('click', function() {
  const nowUTC = new Date();
  // 日本時間に変換 (UTC+9)
  const nowJST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000));
  const registerDT = document.getElementById('registerDate').value
  const data = {
    user_id: clients.id,  // ユーザーIDを指定
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
const totalAmount = (data.bill_5000 * 5000) +
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
});

document.getElementById('closeRegisterBtn').addEventListener('click', function() {
  const nowUTC = new Date();
  // 日本時間に変換 (UTC+9)
  const nowJST = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000));

  const data = {
    user_id: 1,  // ユーザーIDを指定
    bill_5000: parseInt(document.getElementById('bill5000').value) || 0,
    bill_1000: parseInt(document.getElementById('bill1000').value) || 0,
    coin_500: parseInt(document.getElementById('coin500').value) || 0,
    coin_100: parseInt(document.getElementById('coin100').value) || 0,
    coin_50: parseInt(document.getElementById('coin50').value) || 0,
    coin_10: parseInt(document.getElementById('coin10').value) || 0,
    coin_1: parseInt(document.getElementById('coin1').value) || 0,
    open_time: nowJST.toISOString()
};
// 合計金額の計算
const totalAmount = (data.bill_5000 * 5000) +
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
.then(response => response.json())
.then(data => {
    alert(t('Done'));
  modal.style.display = "none";
  hideLoadingPopup()
})
.catch(error => {
  hideLoadingPopup()
    console.error('エラー:', error);
});
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

async function getOrdersbyPickupTime() {
    showLoadingPopup();
    const startDate = `${salesStart.value}:00.000Z`;  // UTC指定のため'Z'を追加
    const endDate = `${salesFinish.value}:59.999Z`;   // 23:59:59を設定
    try {
        // `await` を `fetch` の前に追加
        const response = await fetch(`${server}/orderskun/pickup-time/range?startDate=${startDate}&endDate=${endDate}&user_id=${clients.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        hideLoadingPopup();
        if (data.length > 0) {
            // 支払い方法ごとの合計金額を保存するオブジェクト
            const paymentSummary = {
                cash: { total_amount: 0, orders: [] },
                credit: { total_amount: 0, orders: [] },
                other: { total_amount: 0, orders: [] },
                yet: { total_amount: 0, orders: [] }
            };

            // データをループして、支払い方法ごとに合計金額を計算
            data.forEach(order => {
                const paymentMethod = order.payment_method;
                // 該当する支払い方法にオーダーを追加し、金額を加算
                if (paymentSummary[paymentMethod]) {
                    paymentSummary[paymentMethod].orders.push(order);
                    paymentSummary[paymentMethod].total_amount += parseFloat(order.total_amount);
                }
            });
            // 結果を `clients.salesInfo` に保存
            clients.salesInfo = paymentSummary;
            // ここでデータをフロントエンドのUIに表示するロジックを実装
        } else {
            console.log('No orders found for the given pickup time');
        }
    } catch (error) {
        hideLoadingPopup();
        console.error('Error fetching orders by pickup time:', error);
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

document.getElementById('inserirMonys').addEventListener('click',()=>{
  if(selectFecharcaixa){
    selectFecharcaixa=false
  }else{
    selectFecharcaixa=true
  }
  if(selectFecharcaixa){
    document.getElementById('modal-left-input').style="background-color:#333;color:#fff"
    document.getElementById('inserirMonys').innerText = t('back');

    // 2つのdiv内のすべての input 要素を取得
    const inputs = document.querySelectorAll('#coins-mother-div input, #bill-mother-div input, #total-caixa-input input');
    const title = document.getElementById('left-title-regist-casher')
    title.innerHTML = t('insert_cash_quantities');

    title.style="color:#FFF"
    // すべての input の value を 0 に設定
    inputs.forEach(input => {
        input.value = 0;
        input.removeAttribute('readonly'); // ここでreadonly属性を削除
    });
  }else{
    document.getElementById('modal-left-input').style="background-color:#fff"
    document.getElementById('inserirMonys').innerText = 'Inserir valores'
  }

})

caixaDate.addEventListener('change', async ()=>{
await getRegisters(clients.id)
await openCaixaModal()
})

serchSales.addEventListener('click', async()=>{
  await getOrdersbyPickupTime()
  calculationSales()
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


 function createDependentePedidosRetry(){
   console.log('haitakedo')
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

             displayOrderDetails(order);
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


 // 初期設定と変更イベント
 document.getElementById('language-select').addEventListener('change', async (e) => {
   const lang = e.target.value;
   localStorage.setItem('loacastrogg', lang);
   currentLang=lang
   applyTranslation(lang);
   createDependentePedidosRetry()
 });



 document.getElementById('language-select').value = currentLang;
 applyTranslation(currentLang);



