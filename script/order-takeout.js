const token = window.localStorage.getItem('token');
if (!token) {
   window.location.href = '../index.html';
}
const decodedToken = jwt_decode(token); // jwtDecodeではなくjwt_decodeを使用
const orderNamesContainer = document.getElementById('order-names-container');

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
        "status":'status',
        "comanda exist":'Esse nome já existe, por favor, selecione outro nome para poder separar',
        tax_included: 'com imposto',
        "（税込）": "(com imposto)",
    "（税：+": "(imposto: +"
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
         "status":'ステータス',
         "comanda exist":"This name already exists, please select another name to separate.",
         tax_included: '税込',
         "（税込）": "（税込）",
    "（税：+": "（税：+"
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
         "status":'status',
         "comanda exist":"この名前はすでに存在します。別の名前を選択して分けてください。",
         tax_included: 'tax incl.',
         "（税込）": "(incl. tax)",
    "（税：+": "(tax: +"

    }
};
// const selectedItemsContainer = document.getElementById('selected-items');
const nameInput = document.getElementById('name-input');
const addNameBtn = document.getElementById('add-name-btn');
const selectedItemsContainer = document.getElementById('selected-items');
const totalAmoundDisplay = document.getElementById('total-amount')

// モーダル要素
const modal = document.getElementById('add-name-modal');
const showAddNameModalBtn = document.getElementById('show-add-name-modal');
const closeModalBtn = document.querySelector('.modal .close');

document.getElementById('fullscreenButton').addEventListener('click', () => {
    const docElement = document.documentElement;
    if (docElement.requestFullscreen) {
        docElement.requestFullscreen();
    } else if (docElement.mozRequestFullScreen) { // Firefox
        docElement.mozRequestFullScreen();
    } else if (docElement.webkitRequestFullscreen) { // Chrome, Safari, Opera
        docElement.webkitRequestFullscreen();
    } else if (docElement.msRequestFullscreen) { // IE/Edge
        docElement.msRequestFullscreen();
    }

    // フルスクリーンボタンを非表示、解除ボタンを表示
    document.getElementById('fullscreenButton').style.display = 'none';

});



let orderList = {
  tableNo:9999,
  clienId:decodedToken.restaurant_id,
  order:{
  },
  historyOrder:{

  }
}
let currentOrder = {};
let selectedName = 'takeout';


let userLanguage = 'pt'
let categories = []; // カテゴリ情報を保存する配列

document.addEventListener("DOMContentLoaded", async () => {
    showLoadingPopup()
    const MainData = await makerequest(`${server}/orders/getBasedata?user_id=${orderList.clienId}`)
    //カテゴリーの順番を変える
    const Categorys = MainData.categories.filter(category => category.is_takeout === true);
    Categorys.sort((a, b) => a.display_order - b.display_order);
    const orderCategories = document.getElementById('order-categories');
    const menuItemsContainer = document.getElementById('menu-items');
    displayMenuItems(Categorys[0].id)
    // カテゴリボタンを格納する変数
    let currentSelectedButton = null;
    hideLoadingPopup()
    Categorys.forEach((category, index) => {
    categories.push(category); // カテゴリ情報を配列に保存
    let button = document.createElement('button');
    button.textContent = category[`category_name_${userLanguage}`];
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
});


function displayMenuItems(category) {
  console.log(orderList)
  const sortedData = MainData.menus
      .filter(item => item.category_id === category)
      .sort((a, b) => {
          // stock_status が true のものを前にソート
          if (a.stock_status !== b.stock_status) {
              return a.stock_status ? -1 : 1;
          }
          // stock_status が同じ場合は display_order でソート
          return a.display_order - b.display_order;
      });
menuItemsContainer.innerHTML = '';
// 税区分チェック
const isExclusive = orderList.taxType === 'exclusive';

sortedData.forEach(item => {
  const taxRate = item.is_takeout ? 0.08 : 0.10;
  const basePrice = Math.floor(item.price);
  const priceWithTax = Math.floor(basePrice * (1 + taxRate));

  let taxDisplay = '';
  if (orderList.taxType === 'exclusive') {
    taxDisplay = `（￥${priceWithTax.toLocaleString()} ${translations[userLanguage]["tax_included"]}）`;
  } else {
    taxDisplay = `（${translations[userLanguage]["tax_included"]}）`;
  }

  let div = document.createElement('div');
  div.classList.add('menu-item');
   console.log('haiteru')
  if (!item.stock_status) {
    div.classList.add('menu-item-card', 'sold-out');
  div.innerHTML = `
    <div class="menu-image">
      <img src="${item.imagem_string}" alt="${item.menu_name_pt}">
      <div class="sold-out-badge">Sold Out</div>
    </div>
    <div class="menu-content">
      <h3 data-id="${item.id}" class="menu-name">${item[`menu_name_${userLanguage}`]}</h3>
    </div>
  `;

  } else {
    div.classList.add('menu-item-card');
  div.innerHTML = `
    <div class="menu-image">
      <img src="${item.imagem_string}" alt="${item.menu_name_pt}">
    </div>
    <div class="menu-content">
      <h3 data-id="${item.id}" class="menu-name">${item[`menu_name_${userLanguage}`]}</h3>
      <p class="menu-price">￥${basePrice.toLocaleString()} <span class="tax-info">${taxDisplay}</span></p>
    </div>
  `;

    div.addEventListener('click', () => {
      if (!selectedName) {
        showAlert(translations[userLanguage]["selecione uma comanda"]);
        return;
      }
      if (item.user_id === 1 && item.category_id === 24) {
        displayHalfHalfPizza(item);
      } else {
        displayItemDetails(item);
      }
    });
  }

  menuItemsContainer.appendChild(div);
});


}

//メニュー詳細の表示------------------>
function displayItemDetails(item) {
  // 税率取得
  const taxRate = item.is_takeout ? 0.08 : 0.10;
  const isExclusive = orderList.taxType === 'exclusive';
  console.log(item)
    const sortedOptions = MainData.options.filter(opt => opt.menu_id === item.id);
    const detailsContainer = document.createElement('div');
    detailsContainer.classList.add('item-details');
    detailsContainer.innerHTML = `
        <div class="details-content">
            <div class="left-side">
                <img src="${item.imagem_string}" alt="${item.name}" class="details-image">
                <h3>${item[`menu_name_${userLanguage}`]}</h3>
                <p>${item[`description_${userLanguage}`] || ""}</p>
                <p id="item-price">${getTaxText(Math.floor(item.price))}</p>
            </div>
            <div class="right-side">
                <p>${translations[userLanguage]["option"]}:</p>
                <div id="options-list" class="options-list">
                    ${sortedOptions.map(opt => `
                        <div class="option-item" data-id="${opt.id}" data-price="${opt.additional_price}">
                            <span class="option-name">${opt[`option_name_${userLanguage}`]}</span>
                            <span class="option-price">+￥${Math.floor(opt.additional_price)}</span>
                        </div>
                    `).join('')}
                </div>
                <div>
                    <div>
                    <p >${translations[userLanguage]["Quantidade"]}:</p>
                    </div>
                    <div class="quantity-selector">
                    <button id="decrease-quantity">-</button>
                    <input type="number" id="item-quantity" value="1" min="1">
                    <button id="increase-quantity">+</button>
                    </div>
                </div>
                <button id="add-to-cart" class="add-cancle-btn">${translations[userLanguage]["Adicionar no carrinho"]}</button>
                <button id="back-button" class="add-cancle-btn">${translations[userLanguage]["Voltar"]}</button>
            </div>
        </div>
    `;
    document.body.appendChild(detailsContainer);

    const itemPriceElement = document.getElementById('item-price');
let basePrice = Math.floor(item.price);
let selectedOptionsPrice = 0;
let quantity = parseInt(document.getElementById('item-quantity').value);



function getTaxText(price) {
if (isExclusive) {
    const taxed = Math.floor(price * (1 + taxRate));
    const taxLabel = translations[userLanguage]["tax_included"] || "税込";
    return `￥${price.toLocaleString()}（￥${taxed.toLocaleString()} ${taxLabel}）`;
} else {
    const taxLabel = translations[userLanguage]["tax_included"] || "税込";
    return `￥${price.toLocaleString()}（${taxLabel}）`;
}
}

function updateTotalPrice() {
const totalPrice = (basePrice + selectedOptionsPrice) * quantity;
itemPriceElement.textContent = getTaxText(totalPrice);
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
            selectedOptions.push({
                id: optionId,
                additional_price: additionalPrice
            });
        });

        addToSelectedItems(item, quantity, selectedOptions);
        document.body.removeChild(detailsContainer);
    });
}

    document.getElementById('confirm-order').addEventListener('click', async () => {
    showLoadingPopup()
         const confirmButton = document.getElementById('confirm-order');
        const loadingPopup = document.getElementById('loading-popup');
        confirmButton.disabled = true; // ボタンを無効化
        loadingPopup.style.display = 'block'; // ポップアップを表示
        try {
            if (orderList.clienId === "" || orderList.tableNo === "" || selectedName === "" || orderList.order[selectedName].length === 0) {
                showAlert(translations[userLanguage]["Nenhum item foi selecionado"]);
                confirmButton.disabled = false;
                loadingPopup.style.display = 'none'; // エラーの場合はポップアップを非表示
                return;
            }
            const getJapanTime = () => {
            const now = new Date();
            const offset = 9 * 60 * 60 * 1000; // UTC+9 (日本標準時)
            const japanTime = new Date(now.getTime() + offset);
            return japanTime.toISOString();  // ISOフォーマットに変換
        };
            const response = await fetch(`${server}/orderskun/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_name: selectedName,
                    user_id: orderList.clienId,
                    table_no: orderList.tableNo,
                    items: orderList.order[selectedName],
                    orderId:'',
                    pickup_time: getJapanTime()
                })
            });
            console.log(response)

            if (response.ok) {
                hideLoadingPopup()
                showCustomAlert(translations[userLanguage]["Pedido feito"]);
                orderList.order[selectedName] = [];
                selectedItemsContainer.innerHTML = ''; // リストをクリア
                totalAmoundDisplay.innerText = "￥0"
            } else {
                const errorData = await response.json();
                console.error('Error:', errorData);
                showAlert(translations[userLanguage]["Erro no registro"]);
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert(translations[userLanguage]["Erro no registro"]);
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
                name: item[`menu_name_${userLanguage}`],
                amount: totalPrice,
                category: item.category_id,
                quantity: quantity,
                options: selectedOptions,
                printer:getIP[0].printer_ip
            };
            orderList.order[selectedName].push(newItem);
            displayOrderForName(selectedName)
        }

        // コンソールに orderList を表示
    }
    // 初期表示
    // displayMenuItems(categories[0]);
    document.getElementById('edit-order').addEventListener('click', () => {
           displayEditOrderModal();
       });

       // モーダルを閉じる処理（既存のモーダルに共通で使用）
       document.querySelectorAll('.modal .close').forEach(closeBtn => {
           closeBtn.addEventListener('click', () => {
               closeBtn.closest('.modal').style.display = 'none';
           });
       });

       // オーダー修正モーダルに現在のオーダーを表示
       function displayEditOrderModal() {
           const editOrderList = document.getElementById('edit-order-list');
           editOrderList.innerHTML = ''; // 既存のリストをクリア
           if (selectedName && orderList.order[selectedName]) {
               orderList.order[selectedName].forEach((item, index) => {
                   let li = document.createElement('li');
                   li.innerHTML = `
                       <span class="item-name-of-alter-order-list">${item.name} - ￥${item.amount}✕(${item.quantity})</span>
                       <button class="decrease-quantity">-</button>
                       <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-index="${index}">
                       <button class="increase-quantity">+</button>
                   `;
                   editOrderList.appendChild(li);
               });

               // イベントリスナーを追加
               editOrderList.querySelectorAll('.decrease-quantity').forEach(btn => {
                   btn.addEventListener('click', handleQuantityChange);
               });

               editOrderList.querySelectorAll('.increase-quantity').forEach(btn => {
                   btn.addEventListener('click', handleQuantityChange);
               });

               editOrderList.querySelectorAll('.quantity-input').forEach(input => {
                   input.addEventListener('change', handleQuantityInputChange);
               });
           }

           // モーダルを表示
           document.getElementById('edit-order-modal').style.display = 'block';
       }

       // 数量の変更処理
       function handleQuantityChange(event) {
           const input = event.target.parentElement.querySelector('.quantity-input');
           let quantity = parseInt(input.value);
           const index = input.dataset.index;

           if (event.target.classList.contains('increase-quantity')) {
               quantity++;
           } else if (event.target.classList.contains('decrease-quantity') && quantity > 0) {
               quantity--;
           }

           input.value = quantity;

           // 数量が0の場合はアイテムを削除、それ以外は数量を更新
           if (quantity === 0) {
               removeOrderItem(index);
           } else {
               updateOrderItemQuantity(index, quantity);
           }
       }

       // オーダーアイテムの削除
       function removeOrderItem(index) {
           orderList.order[selectedName].splice(index, 1);
           displayOrderForName(selectedName);
       }

       // 数量入力欄の変更処理
       function handleQuantityInputChange(event) {
           const quantity = parseInt(event.target.value);
           const index = event.target.dataset.index;

           // 数量が0の場合はアイテムを削除、それ以外は数量を更新
           if (quantity === 0) {
               removeOrderItem(index);
           } else {
               updateOrderItemQuantity(index, quantity);
           }
       }
       // オーダーアイテムの数量を更新
       function updateOrderItemQuantity(index, quantity) {
           const item = orderList.order[selectedName][index];
           const basePrice = Math.floor(item.amount / item.quantity);
           item.quantity = quantity;
           item.amount = basePrice * quantity;
           // リストの表示を更新
           displayOrderForName(selectedName);
       }

       // 変更を保存ボタンの処理
       document.getElementById('save-changes-btn').addEventListener('click', () => {
           // 変更を保存し、モーダルを閉じる
           document.getElementById('edit-order-modal').style.display = 'none';
       });

       function updateCategoryButtons() {
           const buttons = orderCategories.querySelectorAll('button');
           buttons.forEach((button, index) => {
               button.textContent = categories[index][`category_name_${userLanguage}`];
           });
       }

       const languageIcons = document.querySelectorAll('.language-icon');


       languageIcons.forEach(icon => {
           icon.addEventListener('click', (event) => {
               const selectedLang = event.target.getAttribute('data-lang');
               translatePage(selectedLang);
           });
       });

       function translatePage(lang) {
         userLanguage = lang
           document.querySelectorAll('[data-translate-key]').forEach(element => {
                         const key = element.getAttribute('data-translate-key');
                         if (translations[lang] && translations[lang][key]) {
                             element.textContent = translations[lang][key];
                         }
                     });
           updateCategoryButtons()
           updateMenuItems()
       }

       function updateMenuItems() {
    const menuItems = document.querySelectorAll('.menu-item h3');
    menuItems.forEach(h3 => {
        const itemId = h3.getAttribute('data-id');
        const menuItem = MainData.menus.find(item => item.id == itemId);
        if (menuItem) {
            h3.textContent = menuItem[`menu_name_${userLanguage}`];
        }
    });
}
function displayOrderForName(name) {
  selectedItemsContainer.innerHTML = ''; // 既存のリストをクリア
  orderList.order[name].forEach(item => {
    let li = document.createElement('li');
    li.textContent = `${item.name} - ${item.quantity}✕ - ￥${item.amount}`;
    selectedItemsContainer.appendChild(li);
    // オプションを1行ずつ追加
    if (item.options && item.options.length > 0) {
      item.options.forEach(option => {
        let optionLi = document.createElement('li');
        optionLi.textContent = `(${option.name} - ${translations[userLanguage]["Valor"]}: ￥${option.additional_price})`;
        optionLi.style.marginLeft = '20px'; // インデントをつける
        selectedItemsContainer.appendChild(optionLi);
      });
    }
  });
  const totalAmount = orderList.order.takeout.reduce((sum, item) => sum + item.amount, 0);
  const isInclusive = decodedToken.tax_type === 'inclusive'; // ←適宜キー名調整
   console.log(isInclusive)
   console.log( decodedToken)
  const taxLabel = isInclusive
    ? translations[userLanguage]["（税込）"]
    : translations[userLanguage]["（税：+"] + Math.floor(totalAmount * 0.10).toLocaleString() + ")";

  totalAmoundDisplay.innerText = `￥${totalAmount.toLocaleString()} ${taxLabel}`;

}


function updateActiveName(activeDiv) {
    document.querySelectorAll('.scrollable-names div').forEach(div => {
        div.classList.remove('active');
    });
    activeDiv.classList.add('active');
}

// オーダーにアイテムを追加
function addToOrder(item) {
    if (selectedName) {

        orderList.order[selectedName].push(item);
        displayOrderForName(selectedName);
    }
}

// モーダルを閉じる
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// モーダル外をクリックした場合にモーダルを閉じる
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});



document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        document.getElementById('password-modal').style.display = 'none';
        document.getElementById('table-number-modal').style.display = 'none';
    });
});

// document.getElementById('confirm-password-btn').addEventListener('click', () => {
//     const enteredPassword = document.getElementById('password-input').value;
//     const correctPassword = '9876'; // ここで正しいパスワードを設定
//
//     if (enteredPassword === correctPassword) {
//       document.getElementById('password-input').value=""
//         document.getElementById('password-modal').style.display = 'none';
//         document.getElementById('table-number-modal').style.display = 'block';
//
//     } else {
//         alert('Senha incorreta!');
//     }
// });

// document.getElementById('save-table-number-btn').addEventListener('click', () => {
//     const newTableNumber = document.getElementById('new-table-number').value;
//     orderList.tableNo = newTableNumber
//     if (newTableNumber) {
//         document.getElementById('table-number').textContent = newTableNumber;
//         localStorage.setItem('tableNumber', newTableNumber);
//         document.getElementById('table-number-modal').style.display = 'none';
//     } else {
//         alert('Por favor, insira um número de mesa válido.');
//     }
// });

// モーダル外をクリックしたら閉じる
window.onclick = function(event) {
    if (event.target === document.getElementById('password-modal') || event.target === document.getElementById('table-number-modal')) {
        event.target.style.display = 'none';
    }
}

function showAlert(message) {
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    alertMessage.textContent = translations[userLanguage]["Selecione ou abra uma comanda"];
    alertModal.style.display = 'block';
    document.getElementById('Atanction-title').textContent = translations[userLanguage]["Atencion"]
    document.getElementById('close-alert-btn').textContent = translations[userLanguage]["Voltar"]

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

function showCustomAlert(message) {
    const alertBox = document.getElementById('custom-alert');
    alertBox.querySelector('p').textContent = message;
    alertBox.style.display = 'block';

    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 1000); // 1秒間表示
}


//履歴を表示するロジック


// モーダルを閉じる処理
function closeModal(modal) {
    modal.style.display = 'none';
}

// モーダルの閉じるボタンの処理
document.querySelector('#history-modal .close').addEventListener('click', () => {
    closeModal(document.getElementById('history-modal'));
});

// モーダル外をクリックした場合にモーダルを閉じる
window.addEventListener('click', (event) => {
    const historyModal = document.getElementById('history-modal');
    if (event.target === historyModal) {
        closeModal(historyModal);
    }
});

function displayOrderDetails(orderName, items) {
  console.log(orderName)
  console.log(items)
    const modal = document.getElementById('order-details-modal');
    const orderNameTitle = document.getElementById('order-name-title');
    const orderTotalAmount = document.getElementById('order-total-amount');
    const orderItemsList = document.getElementById('order-items-list');

    // モーダルのタイトルと合計金額を設定
    orderNameTitle.textContent = `${translations[userLanguage]["Nome da comanda"]}： ${orderName}`;
    const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.item_price), 0);
    orderTotalAmount.textContent = `${translations[userLanguage]["Valor total"]}： ￥${totalAmount.toLocaleString()}`;

    // アイテムリストをクリア
    orderItemsList.innerHTML = '';

    // 各アイテムをリストに追加
    items.forEach(item => {
        const options = JSON.parse(item.options); // オプションをパースしてオブジェクトに変換
        const menuItem = MainData.menus.find(itemss => itemss.id == item.menu_id);
        const categorie = MainData.categories.filter(category => category.id-0 === menuItem.category_id-0);
        const categoryNameKey = `category_name_${userLanguage}`;
        const optionNames = options.map(opt => {
            const optionDetail = MainData.options.find(optionItem => optionItem.id == opt.id);
            return optionDetail ? optionDetail[`option_name_${userLanguage}`] : '不明なオプション';
        }).join(', ');

        // 提供状況に応じてタグを表示するためのステータスのラベル
        let statusLabel = '';
        console.log('statu is'+item.serve_status)
        if (item.serve_status === 'pending') {
            statusLabel = `<span class="status-label pending">${translations[userLanguage]['preparando']}</span>`;
        } else if (item.serve_status === 'served') {
            statusLabel = `<span class="status-label served">${translations[userLanguage]['entregue']}</span>`;
        }

        const itemElement = document.createElement('li');
        itemElement.innerHTML = `
            <strong>${menuItem[`menu_name_${userLanguage}`]}</strong>
            <br>
            <strong>${translations[userLanguage]['Categoria']}:${categorie[0][categoryNameKey]}</strong>
            <br>
            <strong>${translations[userLanguage]["Quantidade"]}:</strong> ${item.quantity}
            <br>
            <strong>${translations[userLanguage]["option"]}:</strong>
            <div class="option-container">
                ${options.length ? optionNames : 'なし'}
            </div>
            <br>
            <strong>${translations[userLanguage]["Valor"]}:</strong> ${formatPrice(item.item_price)}
            <br>
            <strong>${translations[userLanguage]["status"]}:</strong> ${statusLabel}  <!-- 提供状況を表示 -->
        `;
        orderItemsList.appendChild(itemElement);
    });

    // モーダルを表示
    modal.style.display = 'block';
}
function formatPrice(price) {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
}

// モーダルを閉じるためのリスナー
document.querySelector('#order-details-modal .close').addEventListener('click', () => {
    document.getElementById('order-details-modal').style.display = 'none';
});

// モーダルを閉じるためのリスナー
document.querySelector('#order-details-modal .close').addEventListener('click', () => {
    document.getElementById('order-details-modal').style.display = 'none';
});

});
