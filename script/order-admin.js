const token = window.localStorage.getItem('token');

if (!token) {
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
  taxtType:decodedToken.tax_type,　//税金区分
  registerInfo:"",
  salesInfo:"", //セールデータ
  kubun:decodedToken.role,　//admin or operator
  table_count:decodedToken.table_count,
  takeout_enabled:decodedToken.takeout_enabled,
  uber_enabled:decodedToken.uber_enabled,
  receipt_display_name:decodedToken.receipt_display_name,
  receipt_postal_code:decodedToken.receipt_postal_code,
  receipt_address:decodedToken.receipt_address,
  receipt_tel:decodedToken.receipt_tel,
}

const seletOrderType = document.getElementById('take-or-uber')
const menuItemsContainer = document.getElementById('center-div');
const selectedItemsContainer = document.getElementById('list-order')
let notaxAmount = document.getElementById('total-amount')
const confirmButton = document.getElementById('confirm')
const nameinput = document.getElementById('name-input')
const totalAmount = document.getElementById('incluid-tax-total-amount')
const taxByamount = document.getElementById('tax-by-amount')
const loadingPopup = document.getElementById('loading-popup');
const pickupTimeElement = document.getElementById('pickup-time')
const updateTimeBtn = document.getElementById('update-time-btn')
let taxRate = 0.08; // デフォルトの税率8%
let totalPrice = 0; // 合計金額



let orderList = {
  tableNo:1,
  clienId:clients.id,
  order:{
  },
  historyOrder:{
  }
}

let selectedCard = null;
let categories = []; // カテゴリ情報を保存する配列
userLanguage='pt'
let selectedName = 9999

window.onload = async function() {
  const orderCategories = document.getElementById('categories-div');
  if (!orderCategories) {
        console.error('orderCategories is null. Please check if the element with id "order-categories" exists.');
        return;
    }
    let selectType = seletOrderType.value === 'local' ? false :true ;
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now - offset).toISOString().slice(0, 16);
    pickupTimeElement.value = localTime;
    showLoadingPopup()
  //メニュー、カテゴリー、オープション表示
  const MainData = await makerequest(`${server}/orders/getBasedata?user_id=${clients.id}`)
  let Categorys = MainData.categories.filter(category => category.is_takeout === selectType);
  clients.MainData = MainData
  clients.Categorys = Categorys
  categorySyori()
  //ユーザーが取り扱う商品のタイプを追加
function categorySyori(){
  orderCategories.innerHTML=""
  let Categorys = clients.Categorys
  if(Categorys.length===0){
    document.getElementById('take-or-uber').value = 'local';
     Categorys = MainData.categories.filter(category => category.is_takeout != selectType);
    hideLoadingPopup()
  }
  Categorys.sort((a, b) => a.display_order - b.display_order);
  Categorys.forEach((category, index) => {
  categories.push(category); // カテゴリ情報を配列に保存
  let button = document.createElement('button');
   const dbLang = currentLang === 'jp' ? 'ja' : currentLang;
  button.textContent = category[`category_name_${dbLang}`];
  // デフォルトで1つ目のボタンを選択状態にする
  if (index === 0) {
      button.classList.add('selected-category');
      currentSelectedButton = button;
      displayMenuItems(category.id);
  }
  button.addEventListener('click', () => {
      // 以前の選択を解除
      if (currentSelectedButton) {
          currentSelectedButton.classList.remove('selected-category');
      }
      // 現在の選択を適用
      button.classList.add('selected-category');
      currentSelectedButton = button;
      displayMenuItems(category.id);
  });


  orderCategories.appendChild(button);
  hideLoadingPopup()
});
}

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
     categorySyori()

     applyTranslation(lang);
     if (window.currentItemForDetails) {
    document.querySelectorAll('.item-details').forEach(el => el.remove());
    displayItemDetails(window.currentItemForDetails);
  }
   });



   document.getElementById('language-select').value = currentLang;
   applyTranslation(currentLang);


seletOrderType.addEventListener('change', async () => {
  orderCategories.innerHTML=""
    // selectType.value で選択された値を取得
    const isTakeout = seletOrderType.value === 'local' ? false :true ; // 値が "true" なら boolean true に変換
    const dbLang = currentLang === 'jp' ? 'ja' : currentLang;
    // is_takeout の値に基づいてフィルタリング
    const Categorys = MainData.categories.filter(category => category.is_takeout === isTakeout);
    // display_order でソート
    Categorys.sort((a, b) => a.display_order - b.display_order);
    // ボタンを作成してカテゴリ情報を表示
    const categories = [];
    Categorys.forEach((category, index) => {
    categories.push(category); // カテゴリ情報を配列に保存
    let button = document.createElement('button');
    button.textContent = category[`category_name_${dbLang}`];
    // デフォルトで1つ目のボタンを選択状態にする
    if (index === 0) {
        button.classList.add('selected-category');
        currentSelectedButton = button;
        displayMenuItems(category.id);
    }
    button.addEventListener('click', () => {
        // 以前の選択を解除
        if (currentSelectedButton) {
            currentSelectedButton.classList.remove('selected-category');
        }
        // 現在の選択を適用
        button.classList.add('selected-category');
        currentSelectedButton = button;
        displayMenuItems(category.id);
    });


    orderCategories.appendChild(button);
    hideLoadingPopup()
  });
});


function displayMenuItems(category) {
  console.log(MainData.menus)
  const sortedData = MainData.menus
      .filter(item => item.category_id === category)
      .sort((a, b) => a.admin_item_name.localeCompare(b.admin_item_name));

menuItemsContainer.innerHTML = '';
console.log(sortedData)
sortedData.forEach(item => {
    let div = document.createElement('div');
    div.classList.add('menu-item');
        div.innerHTML = `
                         <h3 data-id="${item.id}">${item.admin_item_name}</h3>
                         <p>￥${Math.floor(item.price).toLocaleString()}</p>`;
        div.addEventListener('click', () => {
          displayItemDetails(item)
        });
    menuItemsContainer.appendChild(div);
});
}

function displayItemDetails(item) {
  const dbLang = currentLang === 'jp' ? 'ja' : currentLang;
    const sortedOptions = MainData.options.filter(opt => opt.menu_id === item.id);
    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('item-details');
    const taxText = item.is_takeout ? t('takeout_tax') : t('default_tax');
    detailsContainer.innerHTML = `
        <div class="details-content">
            <div class="left-side">

                <div style="height:10%"><h3>${item[`menu_name_${dbLang}`]}</h3></div>
                <div style="height:70%;background-color:#e0e0e0"><p>${item[`description_${dbLang}`] || ""}</p></div>
                <div style="height:20%;">
                  <p id="item-price">￥${Math.floor(item.price)}</p>
                  <p class="discricao-imposto" id="tax-description">${taxText}</p>
                </div>
            </div>
            <div class="right-side">
                <p>${translations[dbLang]["option"]}:</p>
                <div id="options-list" class="options-list">
                    ${sortedOptions.map(opt => `
                        <div class="option-item" data-id="${opt.id}" data-price="${opt.additional_price}">
                            <span class="option-name">${opt[`option_name_${dbLang}`]}</span>
                            <span class="option-price">+￥${Math.floor(opt.additional_price)}</span>
                        </div>
                    `).join('')}
                </div>
                <div>
                    <div>
                    <p >${translations[dbLang]["Quantidade"]}:</p>
                    </div>
                    <div class="quantity-selector">
                    <button id="decrease-quantity">-</button>
                    <input type="number" id="item-quantity" value="1" min="1">
                    <button id="increase-quantity">+</button>
                    </div>
                </div>
                <button id="add-to-cart" class="add-cancle-btn">${translations[dbLang]["Adicionar no carrinho"]}</button>
                <button id="back-button" class="add-cancle-btn">${translations[dbLang]["Voltar"]}</button>
            </div>
        </div>
    `;
    document.body.appendChild(detailsContainer);

    const itemPriceElement = document.getElementById('item-price');
    let basePrice = Math.floor(item.price);
    let selectedOptionsPrice = 0;
    let quantity = parseInt(document.getElementById('item-quantity').value);

    function updateTotalPrice() {
        const totalPrice = (basePrice + selectedOptionsPrice) * quantity;
        itemPriceElement.textContent = `￥${totalPrice}`;
    }

    document.querySelectorAll('.option-item').forEach(optionDiv => {
        optionDiv.addEventListener('click', () => {
            optionDiv.classList.toggle('selected');
            const price = parseFloat(optionDiv.getAttribute('data-price'));

            if (optionDiv.classList.contains('selected')) {
                selectedOptionsPrice += price;
            } else {
                selectedOptionsPrice -= price;
            }
            updateTotalPrice();
        });
    });

    document.getElementById('increase-quantity').addEventListener('click', () => {
        quantity = parseInt(document.getElementById('item-quantity').value) + 1;
        document.getElementById('item-quantity').value = quantity;
        console.log(clients)
        updateTotalPrice();
    });

    document.getElementById('decrease-quantity').addEventListener('click', () => {
        if (quantity > 1) {
            quantity = parseInt(document.getElementById('item-quantity').value) - 1;
            document.getElementById('item-quantity').value = quantity;
            updateTotalPrice();
        }
    });

    document.getElementById('back-button').addEventListener('click', () => {
        document.body.removeChild(detailsContainer);
    });

    document.getElementById('add-to-cart').addEventListener('click', () => {//カートに追加の処理
    const selectedOptions = [];
    document.querySelectorAll('.option-item.selected').forEach(optionDiv => {
    const optionId = optionDiv.getAttribute('data-id');
    const additionalPrice = parseFloat(optionDiv.getAttribute('data-price'));
    const optionName = optionDiv.querySelector('.option-name').textContent;

    selectedOptions.push({
        id: optionId,
        name: optionName, // オプション名を追加
        additional_price: additionalPrice
    });
});
        addToSelectedItems(item, quantity, selectedOptions);
        document.body.removeChild(detailsContainer);
    });


}

function addToSelectedItems(item, quantity, selectedOptions) {
    // selectedName に対応する配列が存在しない場合、初期化
    if (!orderList.order[selectedName]) {
        orderList.order[selectedName] = [];
    }
    let totalPrice = (Math.floor(item.price) + selectedOptions.reduce((sum, opt) => sum + opt.additional_price, 0)) * quantity;
    // 既に同じ id と options を持つアイテムが存在するかチェック
    let existingItem = orderList.order[selectedName].find(orderItem => {
        return orderItem.id === item.id && JSON.stringify(orderItem.options) === JSON.stringify(selectedOptions);
    });
    if (existingItem) {
        // 存在する場合は数量を増やし、金額を再計算
        existingItem.quantity += quantity;
        existingItem.amount += totalPrice;
        displayOrderForName(selectedName)
    } else {
        // 存在しない場合は新しいアイテムを追加
        const getIP = MainData.categories
            .filter(items => items.id === item.category_id)
        let newItem = {
            id: item.id,
            name: item[`admin_item_name`],
            amount: totalPrice,
            category: item.category_id,
            quantity: quantity,
            options: selectedOptions,
            printer:getIP[0].printer_ip,
            is_takeout:item.is_takeout
        };
        orderList.order[selectedName].push(newItem);
        displayOrderForName(selectedName)
    }
    // コンソールに orderList を表示
}

function displayOrderForName(name) {
  totalPrice = 0; // 合計金額をリセット
  totalDisplayAmount =0
  selectedItemsContainer.innerHTML = ''; // 既存のリストをクリア
  orderList.order[name].forEach((item, index) => {
    let li = document.createElement('li');
    let itemAmountFormatted = item.amount.toLocaleString();
    // 金額用のspan要素を作成
    let itemAmount = document.createElement('span');
    itemAmount.textContent = `￥${itemAmountFormatted}`;
    itemAmount.classList.add('item-amount'); // 必要に応じてクラスを追加

    // 親要素としてのspanを作成
    let itemInfo = document.createElement('span');
    itemInfo.textContent = item.name;
    itemInfo.classList.add('detail_names-div'); // 既存のクラスを追加

    let quantityDisplay = document.createElement('span');
    quantityDisplay.textContent = ` ${item.quantity}個 `;
    quantityDisplay.classList.add('quantity-display');

    let minusButton = document.createElement('button');
    minusButton.textContent = '-';
    minusButton.style = "width:50px";
    minusButton.addEventListener('click', () => {
      if (item.quantity > 1) {
        const tanka = item.amount / item.quantity
        item.quantity--;
        quantityDisplay.textContent = ` ${item.quantity}個 `;

        // アイテムの単価に数量を掛けた合計金額を表示
        let updatedAmount = item.amount * item.quantity;
        itemAmount.textContent = `￥${(tanka*item.quantity).toLocaleString()}`;

        // 合計金額を計算
        item.amount = tanka*item.quantity
        totalPrice = item.amount;
        console.log(orderList.order[name])
        updateTotals(); // 合計金額を更新
      }
    });

    let plusButton = document.createElement('button');
    plusButton.textContent = '+';
    plusButton.style = "width:50px";
    plusButton.addEventListener('click', () => {
      console.log(item.amount)
      console.log(item.quantity)
      const tanka = item.amount / item.quantity
  item.quantity++;
  quantityDisplay.textContent = ` ${item.quantity}個 `;

  itemAmount.textContent = `￥${(tanka*item.quantity).toLocaleString()}`;

  // 合計金額を計算

  item.amount = tanka*item.quantity
  totalPrice = item.amount;
  updateTotals(); // 合計金額を更新
});

    // ゴミ箱ボタン（アイテム削除）
    let trashButton = document.createElement('button');
    trashButton.textContent = '🗑️';  // ゴミ箱アイコン
    trashButton.style = "width:50px;margin-left:15px;background-color:#FFF";
    trashButton.addEventListener('click', () => {
      orderList.order[name].splice(index, 1); // 配列から該当アイテムを削除
      displayOrderForName(name);  // 再表示
    });

    li.appendChild(itemInfo);
    li.appendChild(itemAmount);
    li.appendChild(minusButton);
    li.appendChild(quantityDisplay);
    li.appendChild(plusButton);
    li.appendChild(trashButton);

    // オプションを表示
    if (item.options && item.options.length > 0) {
      item.options.forEach(option => {
        let optionElement = document.createElement('div');
        optionElement.textContent = `・${t('option')}：${option.name}, ${t('value')} ￥${option.additional_price}`;
        optionElement.classList.add('item-option'); // 必要に応じてクラスを追加
        li.appendChild(optionElement);
      });
    }
    totalPrice += item.amount ; // 合計金額を計算* item.quantity
    selectedItemsContainer.appendChild(li);
  });

  updateTotals(); // 初期表示時に合計金額を更新
}

function updateTotals() {
  console.log(clients);
  const order = orderList.order;
  const dynamicKey = Object.keys(order)[0];
  const items = order[dynamicKey];

  let subtotal = 0;
  let tax8 = 0;
  let tax10 = 0;

  items.forEach(item => {
    const price = item.amount;
    subtotal += price;

    if (clients.taxtType === 'exclusive') {
  // 外税：税を上乗せ
  if (item.is_takeout) {
    tax8 += price * 0.08;
  } else {
    tax10 += price * 0.10;
  }
} else {
  // 内税：税を抜き出す
  if (item.is_takeout) {
    tax8 += Math.round(price - (price / 1.08));
  } else {
    tax10 += Math.round(price - (price / 1.10));
  }
}

  });

  const taxTotal = Math.floor(tax8) + Math.floor(tax10);
  const totalWithTax = clients.taxtType === 'exclusive'
    ? subtotal + taxTotal
    : subtotal;

  // 表示更新
  document.getElementById('total-amount').textContent =
  clients.taxtType === 'exclusive'
? `${t('without_tax_label')} ￥${subtotal.toLocaleString()}`
: `${t('with_tax_label')} ￥${subtotal.toLocaleString()}`;


taxByamount.textContent = `${t('tax')} ￥${taxTotal.toLocaleString()} (8%: ￥${Math.floor(tax8)}, 10%: ￥${Math.floor(tax10)})`;

  taxByamount.style.fontSize = '20px';

  // document.getElementById('incluid-tax-total-amount').textContent =
  //   `Total: ￥${totalWithTax.toLocaleString()}`;
}




// 選択された税率ボタンを強調表示する関数
function updateTaxButtons(selectedId) {
  document.getElementById('tax8').classList.remove('selected');
  document.getElementById('tax10').classList.remove('selected');
  document.getElementById(selectedId).classList.add('selected');
}

// 確定ボタンのイベントリスナーを追加
document.getElementById('confirm-order').addEventListener('click', async () => {
    const confirmButton = document.getElementById('confirm-order');
    const loadingPopup = document.getElementById('loading-popup');
    const orderClient = nameinput.value
    const dbLang = currentLang === 'jp' ? 'ja' : currentLang;
    confirmButton.disabled = true; // ボタンを無効化
    loadingPopup.style.display = 'block'; // ポップアップを表示
    try {
      console.log(orderList.order[9999])

  if(!orderClient||orderClient===""){
    alert(t('enter_customer_or_uber'));

    return
  }

        if (orderList.clienId === "" || selectedName === "" || orderList.order[9999]===undefined) {
            alert(translations[dbLang]["Nenhum item foi selecionado"]);
            confirmButton.disabled = false;
            loadingPopup.style.display = 'none'; // エラーの場合はポップアップを非表示
            return;
        }

        // 日本時間のISOフォーマットを取得してサーバーに送信
        const formattedPickupTime = `${pickupTimeElement.value}:00.000Z`;
        const response = await fetch(`${server}/orderskun/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_name: orderClient,
                user_id: clients.id,
                table_no: '',
                items: orderList.order[9999],
                orderId:'',
                order_type:seletOrderType.value,
                pickup_time:formattedPickupTime
            })
        });





        if (response.ok) {
          const responseData = await response.json();
            if(seletOrderType.value==="uber"||seletOrderType.value==="demaekan"){
              const response = await fetch(`http://localhost:3001/print/cupom`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      nomedaComanda: orderClient,
                      user_id: clients.id,
                      table_no: '',
                      items: orderList.order[9999],
                      order_id:responseData.order.id,
                      order_type:seletOrderType.value,
                      pickup_time:formattedPickupTime,
                      receipt_display_name:clients.receipt_display_name,
                      receipt_postal_code:clients.receipt_postal_code,
                      receipt_address:clients.receipt_address,
                      receipt_tel:clients.receipt_tel
                  })
              });
            }
            showCustomAlert(translations[dbLang]["Pedido feito"]);
            orderList.order[selectedName] = [];
            selectedItemsContainer.innerHTML = ''; // リストをクリア
            nameinput.value=""
            notaxAmount.textContent = `${t('without_tax_label')} ￥0`;
            taxByamount.textContent = `${t('tax')} ￥0`;
            // totalAmount.textContent = `Total: ￥0`;
            const now = new Date();
            const offset = now.getTimezoneOffset() * 60000;
            const localTime = new Date(now - offset).toISOString().slice(0, 16);
            pickupTimeElement.value = localTime;
        } else {
            const errorData = await response.json();
            showAlert(translations[dbLang]["Erro no registro"]);
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(translations[dbLang]["Erro no registro"]);
    } finally {
        confirmButton.disabled = false;
        loadingPopup.style.display = 'none'; // リクエスト完了後にポップアップを非表示
    }
});

function showCustomAlert(message) {
    const alertBox = document.getElementById('custom-alert');
    alertBox.querySelector('p').textContent = message;
    alertBox.style.display = 'block';

    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 1000); // 1秒間表示
}

function showAlert(message) {
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    alertMessage.textContent = message;
    alertModal.style.display = 'block';
    const dbLang = currentLang === 'jp' ? 'ja' : currentLang;
    document.getElementById('Atanction-title').textContent = translations[dbLang]["Atencion"]
    document.getElementById('close-alert-btn').textContent = translations[dbLang]["Voltar"]

    // モーダルを閉じるボタンのイベントリスナー
    document.getElementById('close-alert-btn').addEventListener('click', () => {
        alertModal.style.display = 'none';
    });

    // モーダルの×ボタンを押した時のイベントリスナー
    document.querySelector('.modal .close').addEventListener('click', () => {
        alertModal.style.display = 'none';
    });

    // モーダル外をクリックした場合にモーダルを閉じる
    window.addEventListener('click', (event) => {
        if (event.target === alertModal) {
            alertModal.style.display = 'none';
        }
    });
}



const translations = {
    pt: {
        "Histórico": "Histórico",
        "Lista de pedidos": "Lista de pedidos",
        "Confirmar pedido": "Confirmar pedido",
        "Alterar": "Alterar",
        "Abrir comanda": "Criar comanda",
        "Digite o nome para registro da comanda": "Digite o nome para registro da comanda",
        "Alterar o pedido": "Alterar o pedido",
        "Senha para alterar número da mesa": "Senha para alterar número da mesa",
        "Salvar": "Salvar",
        "Novo número da mesa": "Novo número da mesa",
        "Criar comanda":"Criar comanda",
        "Adicionar no carrinho":"Adicionar no carrinho",
        "Voltar":"Voltar",
        "option":"Opções",
        "Atencion":"Atenção",
        "selecione uma comanda":"Selecione ou abra uma comanda",
        "Nenhum item foi selecionado":"Nenhum item foi selecionado",
        "Pedido feito":"Pedido feito com sucesso",
        "Erro no registro":"Erro no registro",
        "Escolha a comanda":"Escolha a comanda",
        "Nome da comanda":"Nome da comanda",
        "Valor total":"Valor total",
        "Quantidade":"Quantidade",
        "Valor":"Valor",
        "Histórico não encontrado":"Histórico não encontrado",
        "Selecione ou abra uma comanda":"Selecione ou abra uma comanda",
        "Sabor":"Selecione 2 sabores",
        "Borda":"Selecione a borda",
        "Só pode escolher 2 sabores.":"Só pode escolher 2 sabores.",
        "Categoria":'Categoria',
        "preparando":'preparando',
        "entregue":'entregue',
        "status":'status'
    },
    ja: {
        "Histórico": "履歴",
        "Lista de pedidos": "注文リスト",
        "Confirmar pedido": "注文を確定",
        "Alterar": "修正",
        "Abrir comanda": "オーダー追加",
        "Digite o nome para registro da comanda": "オーダー名を入力してください",
        "Alterar o pedido": "注文を修正",
        "Senha para alterar número da mesa": "テーブル番号を変更するパスワード",
        "Salvar": "保存",
        "Novo número da mesa": "新しいテーブル番号",
        "Criar comanda":"オーダーを作成",
        "Adicionar no carrinho":"カートに追加",
        "Voltar":"戻る",
        "option":"オプション",
        "Atencion":"注意",
        "Selecione uma comanda":"オーダー名を選択するか、新しく作ってください",
        "Nenhum item foi selecionado":"商品が選択されていません。",
         "Pedido feito":"注文が確定しました",
         "Erro no registro":"登録エラー",
         "Escolha a comanda":"オーダー名を選択してください",
         "Nome da comanda":"オーダー名",
         "Valor total":"合計金額",
         "Quantidade":"数量",
         "Valor":"価格",
         "Histórico não encontrado":"履歴存在しません",
         "Selecione ou abra uma comanda":"オーダーを作成または選択してください",
         "Sabor":"2つの味を選択してください",
         "Borda":"Select the crust",
         "Só pode escolher 2 sabores.":"2つの味しか選択できません",
         "Categoria":'カテゴリー',
         "preparando":'準備中',
         "entregue":'提供済み',
         "status":'ステータス'
    },
    en: {
        "Histórico": "History",
        "Lista de pedidos": "Order List",
        "Confirmar pedido": "Confirm Order",
        "Alterar": "Edit",
        "Abrir comanda": "Open Order",
        "Digite o nome para registro da comanda": "Enter name to register order",
        "Alterar o pedido": "Edit Order",
        "Senha para alterar número da mesa": "Password to change table number",
        "Salvar": "Save",
        "Novo número da mesa": "New Table Number",
        "Criar comanda":"create a order",
        "Adicionar no carrinho":"Add to cart",
        "Voltar":"Back",
        "option":"option",
        "Atencion":"Atencion",
        "Selecione uma comanda":"Please select or open an order.",
        "Nenhum item foi selecionado":"No items were selected.",
         "Pedido feito":"Order placed successfully",
         "Erro no registro":"Error in registration",
         "Escolha a comanda":"Select the order",
         "Nome da comanda": "Order name",
         "Valor total":"Total ammount",
         "Quantidade":"Quantity",
         "Valor":"ammount",
         "Histórico não encontrado":"Not exist history",
         "Selecione ou abra uma comanda":"Select or open an order",
         "Sabor":"Select 2 flavors",
         "Borda":"エッジを選択してください",
         "Só pode escolher 2 sabores.":"You can only choose 2 flavors",
         "Categoria":"Category",
         "preparando": "preparing",
         "entregue": "delivered",
         "status":'status'
    }
};

}

async function cupom(id) {
const totalQuantity = orderList.order[9999].reduce((sum, item) => sum + item.quantity, 0);
let row = `<div id="contentToPrint" class="print-content">
  <div class="ubernumber">
    <p>${nameinput.value}</p>
  </div>
  <div class='display-center-div'>
    <p>${await getCurrentDateTime()}  #${id}</p>
  </div>
  <div class="contents-div">
   <p>ご注文内容(Pedido)</p>
  </div>
  <div class="contents-div">
      ${await generateCupomItemsHTML()}
  </div>

  <div class="azukari-amount-div">
    <div>御買上げ点数　　</div>
    <div>${totalQuantity}点</div>
  </div>
  <div class="dotted-line"></div>
  <div class="contents-div-message">
   <p>Thanks for order</p>
  </div>
  <div class="img-dicvs"><img src="../imagen/logo.png" width="100" class="setting-right-button" /></div>
  <div class="adress-mother-div">
    <div>Roots Grill</div>
    <div>〒475-0801</div>
    <div>愛知県碧南市相生町4-13 102号室</div>
  </div>
</div>`;

var printWindow = window.open('', '_blank');
// ウィンドウが正常に開けているか確認
if (!printWindow) {
  alert('A página foi bloqueata, verifique a configuração do google');
  return; // 処理を終了します
}

// 新しいウィンドウにコンテンツを書き込む
printWindow.document.write(`
  <html>
  <head>
    <title id="title-print"></title>
    <style>
      @media print {
        #body-testes {
          width: 80mm;
          height: 100mm !important;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: red !important;
        }
        .adress-div {
          width: 100%;
          height: 7rem;
          background-color: black;
          -webkit-print-color-adjust: exact;
          color: white;
        }
        .img-dicvs {
          display: flex;
          justify-content: center;
        }
        .display-center-div {
          display: flex;
          justify-content: center;
        }
        .contents-div {
          width: 100%;

        }
        .contents-div-message{
          width: 100%;
          display:flex;
          justify-content: center;
          font-size:16px
        }
        .items-name {
          text-align: left;
          width:80%;
          overflow:hidden
        }
        .details-iten {
          width: 80%;
          text-align: right;
          margin-right: 1rem;
        }
        .dotted-line::before {
          content: '';
          display: block;
          width: 100%;
          height: 1px;
          background-color: black;
          background-image: repeating-linear-gradient(90deg, black, black 2px, transparent 2px, transparent 4px);
          -webkit-print-color-adjust: exact;
        }
        .total-amount-div {
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-size: 3vh;
        }
        .azukari-amount-div {
          width: 100%;
          display: flex;
          justify-content: space-between;
        }
        .ubernumber {
          width: 100%;
          height: 8rem;
          margin-top:1rem;
          background-color: black;
          -webkit-print-color-adjust: exact;
          color: white;
          font-size:6vh;
          font-weight:bold;
          display: flex;
          justify-content: center;
          align-items: center;"
        }
        .adress-mother-div{
          width: 100%;
          background-color:black;
          margin-top:2px;
          -webkit-print-color-adjust: exact;
          color: white;
        }
        .adress-mother-div div{
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .items-mother-div-name{
          width:100%;
          display:flex
        }
         .item-entry{
           width:100%
         }
        .total-qt {
          margin-top: 1rem;
        }

      }
    </style>
  </head>
  <body id="body-testes">
    ${row}
  </body>
  </html>
`);
// 画像が正しく読み込まれるまで待機
await new Promise(resolve => {
  var img = new Image();
  img.onload = resolve;
  img.src = "../imagen/logo.png";
});
// 印刷を実行
printWindow.print();
// 印刷が完了したらウィンドウを閉じる
printWindow.close();
}

function generateCupomItemsHTML() {
    // orderList.order[9999] が存在しない場合は空文字を返す
    console.log(orderList.order[9999])
    if (!orderList.order[9999]) {
        return '';
    }
    let receiptHTML = '';
    // orderList.order[9999] をループ
    orderList.order[9999].forEach(item => {
      console.log(item)
        receiptHTML += `
            <div class="item-entry">
                <div class="items-mother-div-name">
                 <div class="items-name"> ${item.name}</div><div> x ${item.quantity}</div></div>
        `;
        // オプションが存在する場合はそれぞれのオプションを1行ずつ表示
        if (item.options && item.options.length > 0) {
            item.options.forEach(option => {
                receiptHTML += `
                    <div class="details-iten">+ ${option.name}</div>
                `;
            });
        }
        receiptHTML += `</div>`; // item-entry の終了
    });
    return receiptHTML;
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

  updateTimeBtn.addEventListener('click',()=>{
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now - offset).toISOString().slice(0, 16);
    pickupTimeElement.value = localTime;
  })
