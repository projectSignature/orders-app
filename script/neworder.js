const token = window.localStorage.getItem('token');
if (!token) {
   window.location.href = '../index.html';
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
        "status":'status',
        "comanda exist":'Esse nome já existe, por favor, selecione outro nome para poder separar',
        tax_included: 'com imposto',
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

    }
};
const decodedToken = jwt_decode(token); // jwtDecodeではなくjwt_decodeを使用
const orderNamesContainer = document.getElementById('order-names-container');
// const selectedItemsContainer = document.getElementById('selected-items');
const nameInput = document.getElementById('name-input');
const addNameBtn = document.getElementById('add-name-btn');
const selectedItemsContainer = document.getElementById('selected-items');
// モーダルを閉じるボタンのイベントリスナー
document.getElementById('close-alert-btn').addEventListener('click', () => {
    alertModal.style.display = 'none';
});

window.addEventListener('popstate', function(event) {
    // 戻るボタンが押された時の処理
    window.location.href = '../orders.html';
    // 必要に応じて他の処理を実行
});

document.getElementById('update').addEventListener('click', function () {
    location.reload(); // ページをリロード
});



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
    // document.getElementById('exitFullscreenButton').style.display = 'block';
});


document.getElementById('exitFullscreenButton').addEventListener('click', () => {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
    }

    // 解除ボタンを非表示、フルスクリーンボタンを表示
    // document.getElementById('fullscreenButton').style.display = 'block';
    document.getElementById('exitFullscreenButton').style.display = 'none';
});


// モーダルの×ボタンを押した時のイベントリスナー
document.querySelector('.modal .close').addEventListener('click', () => {
    alertModal.style.display = 'none';
});

// モーダル要素
const modal = document.getElementById('add-name-modal');
const showAddNameModalBtn = document.getElementById('show-add-name-modal');
const closeModalBtn = document.querySelector('.modal .close');
const alertModal = document.getElementById('alert-modal');
const alertMessage = document.getElementById('alert-message');

let orderList = {
  tableNo:'',
  clienId:decodedToken.restaurant_id,//ログイン処理完了後は動的に
  order:{
  },
  historyOrder:{
  },
  taxType:decodedToken.tax_type,
  alcoolCheck:false
}

let currentOrder = {};
let selectedName = null;
let userLanguage = 'pt'
let categories = []; // カテゴリ情報を保存する配列

document.addEventListener("DOMContentLoaded", async () => {
  showLoadingPopup()
  console.log(decodedToken)
  console.log(decodedToken.facebook_url)
  console.log(decodedToken.instagram_url)
  if (decodedToken.facebook_url === null && decodedToken.instagram_url === null) {
    console.log('in');
    document.getElementById('follow-us-window').classList.add('hidden');
    console.log(document.getElementById('socialModal').classList); // クラスの追加を確認
}
const saveTableNo = sessionStorage.getItem('saveTableNo')
    // テーブル番号が存在しない場合はデフォルト値を1に設定
    if (!saveTableNo) {
        sessionStorage.setItem('saveTableNo',1)
        tableNumber = 1;
        orderList.tableNo = 1
        localStorage.setItem('order-myTable', orderList.client);
    }else{
      orderList.tableNo = saveTableNo
    }

    document.getElementById('table-number').textContent =  orderList.tableNo
    //メニューのデータを取得する
    const MainData = await makerequest(`${server}/orders/getBasedata?user_id=${orderList.clienId}`)
    //未払いのオーダーが存在してるかチェックする
    const PendingData = await fetchPendingOrders()

    orderList.historyOrder = PendingData
    if(PendingData){
      for(let i=0;i<PendingData.length;i++){
        addName(PendingData[i].order_name)
      }
    }
    //カテゴリーの順番を変える
    const Categorys = MainData.categories.filter(category => category.is_takeout === false);
    Categorys.sort((a, b) => a.display_order - b.display_order);
    const orderCategories = document.getElementById('order-categories');
    const menuItemsContainer = document.getElementById('menu-items');

    // displayMenuItems(Categorys[0].id)
      hideLoadingPopup()
    // カテゴリボタンを格納する変数
    let currentSelectedButton = null;
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



async function fetchPendingOrders() {
    try {
        const response = await fetch(`${server}/orderskun/get-by-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ client_id: orderList.clienId,table_no: orderList.tableNo,status:'confirmed'})
        });
        if (!response.ok) {
            throw new Error('Failed to fetch pending orders');
        }
        const pendingOrders = await response.json();
        console.log('Not confirmed Orders:', pendingOrders);
        return pendingOrders;
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        return null;
    }
}


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

    function displayHalfHalfPizza(item) {
        // 味とエッジのオプションに分ける
        const sortedOptions = MainData.options.filter(opt => opt.menu_id === item.id);
        const pizzaFlavors = sortedOptions.filter(opt => !opt.option_name_pt.includes('Borda'));
        const pizzaEdges = sortedOptions.filter(opt => opt.option_name_pt.includes('Borda'));
        const detailsContainer = document.createElement('div');
        detailsContainer.classList.add('item-details');
        detailsContainer.innerHTML = `
            <h2>Pizza meio a meio</h2>
            <div class="details-content-halfandhalf">
                <div class="left-side" style="width: 45%; float: left;">
                    <p>${translations[userLanguage]["Sabor"]}</p>
                    <div id="flavor-options-list" class="options-list">
                        ${pizzaFlavors.map(flavor => `
                            <div class="flavor-item" data-id="${flavor.id}" data-price="${flavor.additional_price}">
                                <span class="option-name">${flavor[`option_name_${userLanguage}`]}</span>
                                <span class="option-price">+￥${Math.floor(flavor.additional_price)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="right-side" style="width: 45%; float: right;">
                    <p>${translations[userLanguage]["Borda"]}:</p>
                    <div id="edge-options-list" class="options-list">
                        <div class="edge-item selected" data-id="none" data-price="0">
                            <span class="option-name">Nenhuma</span>
                            <span class="option-price">+￥0</span>
                        </div>
                        ${pizzaEdges.map(edge => `
                            <div class="edge-item" data-id="${edge.id}" data-price="${edge.additional_price}">
                                <span class="option-name">${edge[`option_name_${userLanguage}`]}</span>
                                <span class="option-price">+￥${Math.floor(edge.additional_price)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="clear: both;"></div>
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
                <div>
                    <button id="add-to-cart" class="add-cancle-btn">${translations[userLanguage]["Adicionar no carrinho"]}</button>
                    <button id="back-button" class="add-cancle-btn">${translations[userLanguage]["Voltar"]}</button>
                </div>
            </div>
        `;
        document.body.appendChild(detailsContainer);
        let selectedFlavorsPrice = 0;
        let selectedEdgePrice = 0; // 初期値は0（「無し」）
        let selectedFlavors = [];
        const itemPriceElement = document.getElementById('item-price');
        let basePrice = Math.floor(item.price);
        let selectedOptionsPrice = 0;
        let quantity = parseInt(document.getElementById('item-quantity').value);
        function updateTotalPrice() {
            const totalPrice = basePrice + selectedFlavorsPrice + selectedEdgePrice;
            // 価格表示を更新するロジックをここに追加可能
        }

        document.querySelectorAll('.flavor-item').forEach(flavorDiv => {
            flavorDiv.addEventListener('click', () => {
                if (flavorDiv.classList.contains('selected')) {
                    flavorDiv.classList.remove('selected');
                    const price = parseFloat(flavorDiv.getAttribute('data-price'));
                    selectedFlavorsPrice -= price;
                    selectedFlavors = selectedFlavors.filter(f => f !== flavorDiv.getAttribute('data-id'));
                } else if (selectedFlavors.length < 2) {
                    flavorDiv.classList.add('selected');
                    const price = parseFloat(flavorDiv.getAttribute('data-price'));
                    selectedFlavorsPrice += price;
                    selectedFlavors.push(flavorDiv.getAttribute('data-id'));
                } else {
                    alert(translations[userLanguage]["Só pode escolher 2 sabores."]);
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
        document.querySelectorAll('.edge-item').forEach(edgeDiv => {
        edgeDiv.addEventListener('click', () => {
        document.querySelectorAll('.edge-item').forEach(ed => ed.classList.remove('selected'));
        edgeDiv.classList.add('selected');
        const price = parseFloat(edgeDiv.getAttribute('data-price'));
        selectedEdgePrice = price;  // 選択されたエッジの価格を設定
        updateTotalPrice();
    });
});


        document.getElementById('back-button').addEventListener('click', () => {
            document.body.removeChild(detailsContainer);
        });

        document.getElementById('add-to-cart').addEventListener('click', () => {
            if (selectedFlavors.length < 2) {
                alert(translations[userLanguage]["Escolha 2 sabores antes de adicionar ao carrinho."]);
                return;
            }

            const selectedOptions = selectedFlavors.map(flavorId => ({
                id: flavorId,
                additional_price: parseFloat(document.querySelector(`.flavor-item[data-id="${flavorId}"]`).getAttribute('data-price'))
            }));

            const selectedEdge = document.querySelector('.edge-item.selected');
            if (selectedEdge && selectedEdge.getAttribute('data-id') !== 'none') {
                selectedOptions.push({
                    id: selectedEdge.getAttribute('data-id'),
                    additional_price: parseFloat(selectedEdge.getAttribute('data-price'))
                });
            }

            addToSelectedItems(item, 1, selectedOptions);
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
         try{
           const editOrderList = document.getElementById('edit-order-list');
           console.log(orderList.order[selectedName])
           if(orderList.order[selectedName].length===0){
             showAlert(translations[userLanguage]["Nenhum item foi selecionado"])
             alertModal.style.display = 'block';
             return
           }
           editOrderList.innerHTML = ''; // 既存のリストをクリア
           if (selectedName && orderList.order[selectedName]) {
               orderList.order[selectedName].forEach((item, index) => {
                   let li = document.createElement('li');
                   li.innerHTML = `
                       ${item.name} - ￥${item.amount} (${item.quantity}個)
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
         }catch(e){
           showAlert(translations[userLanguage]["Selecione ou abra uma comanda"])
           alertModal.style.display = 'block';
           return
         }

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
       const menuDivs = document.querySelectorAll('.menu-item');
       menuDivs.forEach(div => {
         const h3 = div.querySelector('h3');
         const p = div.querySelector('p');
         const itemId = h3.getAttribute('data-id');
         const menuItem = MainData.menus.find(item => item.id == itemId);
         if (menuItem) {
           const basePrice = Math.floor(menuItem.price);
           const taxRate = menuItem.is_takeout ? 0.08 : 0.10;
           const priceWithTax = Math.floor(basePrice * (1 + taxRate));

           let taxDisplay = '';
           if (orderList.taxType === 'exclusive') {
             taxDisplay = `（￥${priceWithTax.toLocaleString()} ${translations[userLanguage]["tax_included"]}）`;
           } else {
             taxDisplay = `（${translations[userLanguage]["tax_included"]}）`;
           }

           h3.textContent = menuItem[`menu_name_${userLanguage}`];
           p.textContent = `￥${basePrice.toLocaleString()}${taxDisplay}`;
         }
       });
     }


function addName(name) {
    if (!name || currentOrder[name]) {
        return; // 名前が空、または既に存在する場合は何もしない
    }
    orderList.order[name] = [];
    let nameDiv = document.createElement('div');
    nameDiv.textContent = name;
    nameDiv.addEventListener('click', () => {
        selectedName = name;
        displayOrderForName(name);
        updateActiveName(nameDiv);
    });
    orderNamesContainer.appendChild(nameDiv);

    // 名前を追加した後に自動的に選択状態にする
    selectedName = name;
    displayOrderForName(name);
    updateActiveName(nameDiv);
}

// 名前を追加するボタンのイベントリスナー
addNameBtn.addEventListener('click', () => {
  if(!orderList.alcoolCheck&&decodedToken.restaurant_id===17){
    showAlcoholWarningModal()

  }
    const name = nameInput.value.trim();
    const orderName = orderList.historyOrder.filter(item => item.order_name === name);
    const existOrderName = orderName.length === 0 ? false : true;
    if (existOrderName) {
        showAlert(translations[userLanguage]["comanda exist"]);
        alertModal.style.display = 'block';
    } else {
        if (name) {
            addName(name);
            addOrderName(name);
            nameInput.value = ''; // インプットフィールドをクリア
            modal.style.display = 'none'; // モーダルを閉じる
        }
    }
});


function displayOrderForName(name) {
    selectedItemsContainer.innerHTML = ''; // 既存のリストをクリア
    orderList.order[name].forEach(item => {
        let li = document.createElement('li');
        li.textContent = `${item.name} - ${item.quantity}個 - ￥${item.amount}`;
        selectedItemsContainer.appendChild(li);
    });
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

// モーダルを表示する
showAddNameModalBtn.addEventListener('click', () => {
    modal.style.display = 'block';
});

// モーダルを閉じる
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// 名前を追加するボタンのイベントリスナー
addNameBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const orderName = orderList.historyOrder.filter(item => item.order_name === name)
    const existOrderName = orderName.length===0?false:true
    if(existOrderName){
      showAlert(translations[userLanguage]["comanda exist"])
      alertModal.style.display = 'block';
    }else{
      if (name) {
          addName(name);
          addOrderName(name)
          nameInput.value = ''; // インプットフィールドをクリア
          modal.style.display = 'none'; // モーダルを閉じる
      }
    }

});

// モーダル外をクリックした場合にモーダルを閉じる
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// 確定ボタンのイベントリスナーを追加
document.getElementById('confirm-order').addEventListener('click', async () => {
    const confirmButton = document.getElementById('confirm-order');
        showLoadingPopup()
    try {
        if (orderList.clienId === "" || orderList.tableNo === "" || selectedName === "" || orderList.order[selectedName].length === 0) {
          console.log('nocart')
            showAlert(translations[userLanguage]["Nenhum item foi selecionado"]);
            confirmButton.disabled = false;
            loadingPopup.style.display = 'none'; // エラーの場合はポップアップを非表示
            return;
        }
        const orderID = orderList.historyOrder.filter(item => item.order_name === selectedName)
        const ordersId = orderID.length===0?'':orderID[0].id
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
                orderId:ordersId,
                pickup_time: getJapanTime()
            })
        });
        if (response.ok) {
          const responseData = await response.json();
          if(responseData.newflug){
            responseData.order.orderItems = responseData.orderItems;//アイテムをオーダーオブジェクトに追加
            orderList.historyOrder.push(responseData.order);
          }
            updateAlarmStatus(ordersId,true)
            showCustomAlert(translations[userLanguage]["Pedido feito"]);
            orderList.order[selectedName] = [];
            selectedItemsContainer.innerHTML = ''; // リストをクリア
        } else {
            const errorData = await response.json();
            console.error('Error:', errorData);
            showAlert(translations[userLanguage]["Erro no registro"]);
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(translations[userLanguage]["Selecione ou abra uma comanda"]);
        return
    } finally {
        confirmButton.disabled = false;
            hideLoadingPopup()
    }
});

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




function addOrderName(orderName) {
  // オーダー名が存在しない場合、オーダー名の初期化を行う
  if (!orderList.order[orderName]) {
    orderList.order[orderName] = []; // 空の配列を初期化
  } else {

  }
}


document.getElementById('div-table-btn').addEventListener('click', () => {
    document.getElementById('password-modal').style.display = 'block';


});


document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        document.getElementById('password-modal').style.display = 'none';
        document.getElementById('table-number-modal').style.display = 'none';
    });
});

document.getElementById('confirm-password-btn').addEventListener('click', () => {
    const enteredPassword = document.getElementById('password-input').value;


    const correctPassword = '3790'; // ここで正しいパスワードを設定

    if (enteredPassword === correctPassword) {
      document.getElementById('password-input').value=""
        document.getElementById('password-modal').style.display = 'none';
        document.getElementById('table-number-modal').style.display = 'block';
        // fullscreenButtonとexitFullscreenButtonの表示状態をチェック
        const isFullscreenButtonVisible = document.getElementById('fullscreenButton').style.display === 'flex';
        const isExitFullscreenButtonVisible = document.getElementById('exitFullscreenButton').style.display === 'flex';

      document.getElementById('exitFullscreenButton').style.display = 'block'
        // モーダルを閉じたときにボタンを非表示にするイベントリスナーを追加
        document.getElementById('table-number-modal').addEventListener('click', () => {
            document.getElementById('fullscreenButton').style.display = 'none';
            document.getElementById('exitFullscreenButton').style.display = 'none';
        });

    } else {
        alert('Senha incorreta!');
    }
});

document.getElementById('save-table-number-btn').addEventListener('click', () => {
    const newTableNumber = document.getElementById('new-table-number').value;
    orderList.tableNo = newTableNumber
    if (newTableNumber) {
        document.getElementById('table-number').textContent = newTableNumber;
        sessionStorage.setItem('saveTableNo',newTableNumber)
        document.getElementById('table-number-modal').style.display = 'none';
        document.getElementById('fullscreenButton').style.display = 'none';
        document.getElementById('exitFullscreenButton').style.display = 'none';
    } else {
      document.getElementById('fullscreenButton').style.display = 'none';
      document.getElementById('exitFullscreenButton').style.display = 'none';
        alert('Por favor, insira um número de mesa válido.');
    }
});

// モーダル外をクリックしたら閉じる
window.onclick = function(event) {
    if (event.target === document.getElementById('password-modal') || event.target === document.getElementById('table-number-modal')) {
        event.target.style.display = 'none';
    }
}

function showAlert(message) {

    alertMessage.textContent = message;
    alertModal.style.display = 'block';
    document.getElementById('Atanction-title').textContent = translations[userLanguage]["Atencion"]
    document.getElementById('close-alert-btn').textContent = translations[userLanguage]["Voltar"]



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

// 履歴ボタンをクリックしたときの処理
document.getElementById('view-history').addEventListener('click', () => {
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');

    // 既存の履歴リストをクリア
    historyList.innerHTML = '';

    // `orderNamesContainer` の中にあるオーダー名を取得
    const orderNamesContainer = document.getElementById('order-names-container');
    const orderNames = orderNamesContainer.querySelectorAll('div');

    orderNames.forEach(orderNameDiv => {
        const historyItem = document.createElement('div');
        historyItem.textContent = orderNameDiv.textContent;
        historyItem.classList.add('history-item');

        // オーダー名をクリックしたらそのオーダーを表示する処理
        // オーダー名をクリックした時にサーバーからオーダー情報を取得する処理
  historyItem.addEventListener('click', async () => {
    closeModal(historyModal)
      selectedName = orderNameDiv.textContent;
      const PendingData = await fetchPendingOrders()
      orderList.historyOrder = PendingData
      const OrderDetail = orderList.historyOrder.filter(order => order.order_name === selectedName);
      console.log(orderList.historyOrder)
       displayOrderDetails(selectedName,OrderDetail[0].OrderItems)

  });


        historyList.appendChild(historyItem);
    });
    // モーダルを表示
    historyModal.style.display = 'block';
});
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
    console.log(totalAmount)
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

function openModal() {

    // Define QR image URLs
    const qrImages = {
        facebook: decodedToken.facebook_url, // Replace with actual QR code URL
        instagram: decodedToken.instagram_url // Replace with actual QR code URL
    };

  if(decodedToken.facebook_url===""||decodedToken.instagram_url===""){

  }
    // Get container
    const qrContainer = document.getElementById("qr-container");
    qrContainer.innerHTML = ''; // Clear any existing content

    // Load images conditionally
    for (let [platform, url] of Object.entries(qrImages)) {
        const img = new Image();
        img.src = url;
        img.classList.add("qr-image");
        img.alt = platform;

        img.onload = function() {
            qrContainer.appendChild(img);
        };
    }

    // Show modal
    document.getElementById("socialModal").style.display = "block";
}

function closeModal() {
    document.getElementById("socialModal").style.display = "none";
}

// Close modal when clicked outside
window.onclick = function(event) {
    const modal = document.getElementById("socialModal");
    if (event.target === modal) {
        closeModal();
    }
};

function showAlcoholWarningModal() {
  orderList.alcoolCheck = true
  document.getElementById('alcohol-warning-modal').classList.remove('hidden');
}

document.getElementById('close-alcohol-modal').addEventListener('click', () => {
  document.getElementById('alcohol-warning-modal').classList.add('hidden');
});
