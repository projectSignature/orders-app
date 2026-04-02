const token = window.localStorage.getItem('token');

// 初期化時に1回
history.pushState(null, null, location.href);

// 戻るを検知して即戻す
window.addEventListener('popstate', () => {
  history.pushState(null, null, location.href);
});


const menuDomCache = {};

if (!token) {
   window.location.href = '../index.html';
}

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
//オーダー名
let orderNameCache = [];

//キャッシュ読み込み関数
function loadOrderNameCache() {
  // console.log(orderNameCache)
  const saved = localStorage.getItem('orderNameCache');
  orderNameCache = saved ? JSON.parse(saved) : [];
}
//pendingオーダーとキャッシュを比較
function validateOrderNameCache(pendingOrders) {
  // pending に存在するキー一覧
  const validKeys = pendingOrders.map(o =>
    `${o.order_name}_${o.table_no}`
  );
  // キャッシュに同じものが1つでもあるか
  const hasMatch = orderNameCache.some(c =>
    validKeys.includes(`${c.order_name}_${c.table_no}`)
  );
  // なければ全クリア
  if (!hasMatch) {
    orderNameCache = [];
    localStorage.removeItem('orderNameCache');
    console.log('🧹 orderNameCache cleared');
  }
}
//キャッシュの初期化
function resetOrderNameCache() {
  orderNameCache = [];
  localStorage.removeItem('orderNameCache');
  console.log('🧹 orderNameCache reset');
}

function getMenuItemsContainer() {
  return document.getElementById('menu-items');
}


document.addEventListener("DOMContentLoaded", async () => {
  showLoadingPopup()
//キャッシュを取得
  loadOrderNameCache()

  if (decodedToken.facebook_url === null && decodedToken.instagram_url === null) {
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

    // console.log(MainData)
    //未払いのオーダーが存在してるかチェックする
    const PendingData = await fetchPendingOrders()

    orderList.historyOrder = PendingData

   // console.log(`pending orders` ,orderList.historyOrder)

   // console.log(PendingData)
    if(PendingData.length>0){
      // console.log('is pending')
      for(let i=0;i<PendingData.length;i++){
        addName(PendingData[i].order_name)
      }
    }else{
      // console.log('is not has pending')
      resetOrderNameCache()
    }
    //カテゴリーの順番を変える
    const Categorys = MainData.categories.filter(category => category.is_takeout === false);
    Categorys.sort((a, b) => a.display_order - b.display_order);
    const orderCategories = document.getElementById('order-categories');

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

  console.log(category)

   const menuItemsContainer = document.getElementById('menu-items');
  // ✅ キャッシュがあれば即表示
  if (menuDomCache[category]) {
    const menuItemsContainer = getMenuItemsContainer();
    menuItemsContainer.innerHTML = '';

    menuItemsContainer.appendChild(
      menuDomCache[category].cloneNode(true)
    );
    return;
  }

  const sortedData = MainData.menus
    .filter(item => item.category_id === category)
    .sort((a, b) => {
      if (a.stock_status !== b.stock_status) {
        return a.stock_status ? -1 : 1;
      }
      return a.display_order - b.display_order;
    });

  const fragment = document.createDocumentFragment();
  const isExclusive = orderList.taxType === 'exclusive';

  sortedData.forEach(item => {
    const taxRate = item.is_takeout ? 0.08 : 0.10;
    const basePrice = Math.floor(item.price);
    const priceWithTax = Math.floor(basePrice * (1 + taxRate));

    const taxDisplay = isExclusive
      ? `（￥${priceWithTax.toLocaleString()} ${translations[userLanguage]["tax_included"]}）`
      : `（${translations[userLanguage]["tax_included"]}）`;

    const div = document.createElement('div');
    div.className = 'menu-item menu-item-card';



if (!item.stock_status) {
 div.classList.add('menu-item-card', 'sold-out');
  div.innerHTML = `
    <div class="menu-image">
      <img src="${item.imagem_string}" alt="${item.menu_name_pt}">
    </div>
    <div class="sold-out-badge">Sold Out</div>

    <div class="menu-content">
      <h3 data-id="${item.id}" class="menu-name">${item[`menu_name_${userLanguage}`]}</h3>
    </div>


  `;
}else{
    div.innerHTML = `
      <div class="menu-image">
        <img src="${item.imagem_string}" loading="lazy">
        ${!item.stock_status ? '<div class="sold-out-badge">Sold Out</div>' : ''}
      </div>
      <div class="menu-content">
        <h3 data-id="${item.id}">${item[`menu_name_${userLanguage}`]}</h3>
        ${item.stock_status
          ? `<p>￥${basePrice.toLocaleString()} ${taxDisplay}</p>`
          : ''}
      </div>
    `;
}

    div.onclick = () => {
      if (!selectedName) {
        showAlert(translations[userLanguage]["selecione uma comanda"]);
        return;
      }
      item.user_id === 1 && item.category_id === 24
        ? displayHalfHalfPizza(item)
        : displayItemDetails(item);
    };

    fragment.appendChild(div);
  });

  // ✅ 初回だけDOM生成
  menuItemsContainer.innerHTML = '';
  menuItemsContainer.appendChild(fragment);

  // ✅ キャッシュ保存（超重要）
  menuDomCache[category] = fragment.cloneNode(true);
}

function displayItemDetails(item) {
  const taxRate = item.is_takeout ? 0.08 : 0.10;
  const isExclusive = orderList.taxType === 'exclusive';

  const sortedOptions = MainData.options.filter(
    opt => opt.menu_id === item.id
  );

  // ★ 必須オプション抽出
  const requiredOptions = sortedOptions.filter(opt => opt.is_required);

  const detailsContainer = document.createElement('div');
  detailsContainer.classList.add('item-details');

  detailsContainer.innerHTML = `
    <div class="details-content">
    <div class="left-side">
      <img src="${item.imagem_string}" class="details-image">

      <h3>${item[`menu_name_${userLanguage}`]}</h3>

      ${
        item[`description_${userLanguage}`]
          ? `
            <div class="menu-description">
              <div class="menu-description-title">
                ℹ️ ${
                  userLanguage === 'ja'
                    ? '内容'
                    : userLanguage === 'pt'
                      ? 'Descrição do prato'
                      : 'Dish details'

                }
              </div>
              <div class="menu-description-text">
                ${item[`description_${userLanguage}`]}
              </div>
            </div>
          `
          : ''
      }

      <p id="item-price"></p>
    </div>


      <div class="right-side">
        <p>${translations[userLanguage]["option"]}</p>

        <div id="options-list" class="options-list">
          ${sortedOptions.map(opt => `
            <div class="option-item"
              data-id="${opt.id}"
              data-price="${opt.additional_price}"
              data-required="${opt.is_required}">
              <span class="option-name">
                ${opt[`option_name_${userLanguage}`]}

              </span>
              <span class="option-price">+￥${Math.floor(opt.additional_price)}</span>
            </div>
          `).join('')}
        </div>

        <div>
          <p>${translations[userLanguage]["Quantidade"]}</p>
          <div class="quantity-selector">
            <button id="decrease-quantity">-</button>
            <input type="number" id="item-quantity" value="1" min="1">
            <button id="increase-quantity">+</button>
          </div>
        </div>

        <button id="add-to-cart" class="add-cancle-btn">
          ${translations[userLanguage]["Adicionar no carrinho"]}
        </button>
        <button id="back-button" class="add-cancle-btn">
          ${translations[userLanguage]["Voltar"]}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(detailsContainer);
  // ${opt.is_required ? `<span class="required-badge">必須</span>` : ``}
  const itemPriceElement = document.getElementById('item-price');
  let basePrice = Math.floor(item.price);
  let selectedOptionsPrice = 0;
  let quantity = 1;

  function getTaxText(price) {
    if (isExclusive) {
      const taxed = Math.floor(price * (1 + taxRate));
      return `￥${price.toLocaleString()}（￥${taxed.toLocaleString()} ${translations[userLanguage]["tax_included"]}）`;
    }
    return `￥${price.toLocaleString()}（${translations[userLanguage]["tax_included"]}）`;
  }

  function updateTotalPrice() {
    const total = (basePrice + selectedOptionsPrice) * quantity;
    itemPriceElement.textContent = getTaxText(total);
  }

  updateTotalPrice();

  document.querySelectorAll('.option-item').forEach(el => {
    el.addEventListener('click', () => {

      el.classList.toggle('selected');

      // 🔹 必須エラー解除
      document.querySelectorAll('.option-item.required-miss')
        .forEach(i => i.classList.remove('required-miss'));

      // document
      //   .getElementById('required-message')
      //   .classList.add('hidden');

      const price = parseFloat(el.dataset.price);
      selectedOptionsPrice += el.classList.contains('selected')
        ? price
        : -price;

      updateTotalPrice();
    });
  });


  // quantity
  document.getElementById('increase-quantity').onclick = () => {
    quantity++;
    document.getElementById('item-quantity').value = quantity;
    updateTotalPrice();
  };

  document.getElementById('decrease-quantity').onclick = () => {
    if (quantity > 1) quantity--;
    document.getElementById('item-quantity').value = quantity;
    updateTotalPrice();
  };

  // back
  document.getElementById('back-button').onclick = () => {
    document.body.removeChild(detailsContainer);
  };

  document.getElementById('add-to-cart').addEventListener('click', () => {
    const requiredOptions = sortedOptions.filter(o => o.is_required);

    if (requiredOptions.length > 0) {
      const selectedRequired = document.querySelectorAll(
        '.option-item.selected[data-required="true"]'
      );

      if (selectedRequired.length === 0) {
        const firstRequiredEl = document.querySelector(
          '.option-item[data-required="true"]'
        );
        const requiredItems = document.querySelectorAll(
          '.option-item[data-required="true"]'
        );

        // 🔽 必須項目までスクロール
        if (firstRequiredEl) {
          firstRequiredEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }

        // 👇 少し待ってから吹き出し出すと見やすい
        setTimeout(() => {
          showRequiredBalloon(firstRequiredEl);
        }, 250);

        // 🔴 必須 option だけ強調
        requiredItems.forEach(el => {
          el.classList.add('required-miss');
        });

        return;
      }
    }

    const selectedOptions = [];
    document.querySelectorAll('.option-item.selected').forEach(el => {
      selectedOptions.push({
        id: el.dataset.id,
        additional_price: parseFloat(el.dataset.price)
      });
    });

    addToSelectedItems(item, quantity, selectedOptions);
    document.body.removeChild(detailsContainer);
  });


}

//メニュー詳細の表示------------------>
//     function displayItemDetails(item) {
//       // 税率取得
//       console.log(item)
//       const taxRate = item.is_takeout ? 0.08 : 0.10;
//       const isExclusive = orderList.taxType === 'exclusive';
//       console.log(item)
//         const sortedOptions = MainData.options.filter(opt => opt.menu_id === item.id);
//
//         console.log(sortedOptions)
//         const detailsContainer = document.createElement('div');
//         detailsContainer.classList.add('item-details');
//         detailsContainer.innerHTML = `
//             <div class="details-content">
//                 <div class="left-side">
//                     <img src="${item.imagem_string}" alt="${item.name}" class="details-image">
//                     <h3>${item[`menu_name_${userLanguage}`]}</h3>
//                     <p>${item[`description_${userLanguage}`] || ""}</p>
//                     <p id="item-price">${getTaxText(Math.floor(item.price))}</p>
//                 </div>
//                 <div class="right-side">
//                     <p>${translations[userLanguage]["option"]}:</p>
//                     <div id="options-list" class="options-list">
//                         ${sortedOptions.map(opt => `
//                             <div class="option-item" data-id="${opt.id}" data-price="${opt.additional_price}">
//                                 <span class="option-name">${opt[`option_name_${userLanguage}`]}</span>
//                                 <span class="option-price">+￥${Math.floor(opt.additional_price)}</span>
//                             </div>
//                         `).join('')}
//                     </div>
//                     <div>
//                         <div>
//                         <p >${translations[userLanguage]["Quantidade"]}:</p>
//                         </div>
//                         <div class="quantity-selector">
//                         <button id="decrease-quantity">-</button>
//                         <input type="number" id="item-quantity" value="1" min="1">
//                         <button id="increase-quantity">+</button>
//                         </div>
//                     </div>
//                     <button id="add-to-cart" class="add-cancle-btn">${translations[userLanguage]["Adicionar no carrinho"]}</button>
//                     <button id="back-button" class="add-cancle-btn">${translations[userLanguage]["Voltar"]}</button>
//                 </div>
//             </div>
//         `;
//         document.body.appendChild(detailsContainer);
//
//         const itemPriceElement = document.getElementById('item-price');
// let basePrice = Math.floor(item.price);
// let selectedOptionsPrice = 0;
// let quantity = parseInt(document.getElementById('item-quantity').value);
//
//
//
// function getTaxText(price) {
//     if (isExclusive) {
//         const taxed = Math.floor(price * (1 + taxRate));
//         const taxLabel = translations[userLanguage]["tax_included"] || "税込";
//         return `￥${price.toLocaleString()}（￥${taxed.toLocaleString()} ${taxLabel}）`;
//     } else {
//         const taxLabel = translations[userLanguage]["tax_included"] || "税込";
//         return `￥${price.toLocaleString()}（${taxLabel}）`;
//     }
// }
//
// function updateTotalPrice() {
//     const totalPrice = (basePrice + selectedOptionsPrice) * quantity;
//     itemPriceElement.textContent = getTaxText(totalPrice);
// }
//
//
//         document.querySelectorAll('.option-item').forEach(optionDiv => {
//             optionDiv.addEventListener('click', () => {
//                 optionDiv.classList.toggle('selected');
//                 const price = parseFloat(optionDiv.getAttribute('data-price'));
//
//                 if (optionDiv.classList.contains('selected')) {
//                     selectedOptionsPrice += price;
//                 } else {
//                     selectedOptionsPrice -= price;
//                 }
//                 updateTotalPrice();
//             });
//         });
//
//         document.getElementById('increase-quantity').addEventListener('click', () => {
//             quantity = parseInt(document.getElementById('item-quantity').value) + 1;
//             document.getElementById('item-quantity').value = quantity;
//             updateTotalPrice();
//         });
//
//         document.getElementById('decrease-quantity').addEventListener('click', () => {
//             if (quantity > 1) {
//                 quantity = parseInt(document.getElementById('item-quantity').value) - 1;
//                 document.getElementById('item-quantity').value = quantity;
//                 updateTotalPrice();
//             }
//         });
//
//         document.getElementById('back-button').addEventListener('click', () => {
//             document.body.removeChild(detailsContainer);
//         });
//
//         document.getElementById('add-to-cart').addEventListener('click', () => {//カートに追加の処理
//
//             const selectedOptions = [];
//             document.querySelectorAll('.option-item.selected').forEach(optionDiv => {
//                 const optionId = optionDiv.getAttribute('data-id');
//                 const additionalPrice = parseFloat(optionDiv.getAttribute('data-price'));
//                 selectedOptions.push({
//                     id: optionId,
//                     additional_price: additionalPrice
//                 });
//             });
//
//             addToSelectedItems(item, quantity, selectedOptions);
//             document.body.removeChild(detailsContainer);
//         });
//     }

function showRequiredBalloon(targetEl) {
  // 既にあれば消す
  // console.log(targetEl)
  const existing = document.querySelector('.required-balloon');
  // console.log(existing)
  if (existing) existing.remove();

  const rect = targetEl.getBoundingClientRect();

  const balloon = document.createElement('div');
  balloon.className = 'required-balloon';
  balloon.textContent =
  userLanguage === 'ja'
    ? '焼き加減を選択してください'
    : userLanguage === 'pt'
      ? 'Selecione o ponto da carne'
      : 'Please select the doneness';

  document.body.appendChild(balloon);

  // 位置調整（必須オプションの少し上）
  balloon.style.top = `${rect.top + window.scrollY - balloon.offsetHeight - 8}px`;
  balloon.style.left = `${rect.left + window.scrollX}px`;

  // 2秒後に自動で消す
  setTimeout(() => {
    balloon.remove();
  }, 2000);
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
                    <p id="required-message" class="required-message hidden">
  必須オプションを1つ選択してください
</p>
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


        // document.getElementById('back-button').addEventListener('click', () => {
        //     document.body.removeChild(detailsContainer);
        // });
        // document.getElementById('add-to-cart').addEventListener('click', () => {
        //   const requiredOptions = sortedOptions.filter(o => o.is_required);
        //
        //   console.log('ここきてる')
        //
        //   if (requiredOptions.length > 0) {
        //     const selectedRequired = document.querySelectorAll(
        //       '.option-item.selected[data-required="true"]'
        //     );
        //
        //     if (selectedRequired.length === 0) {
        //       const firstRequiredEl = document.querySelector(
        //         '.option-item[data-required="true"]'
        //       );
        //
        //       // 👇 ここで吹き出し表示
        //       showRequiredBalloon(firstRequiredEl);
        //
        //       // 👇 該当項目だけ軽く強調
        //       firstRequiredEl.classList.add('required-highlight');
        //       setTimeout(() => {
        //         firstRequiredEl.classList.remove('required-highlight');
        //       }, 800);
        //
        //       return;
        //     }
        //   }
        //
        //   // 正常処理…
        // });

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

           if (!orderList.order[selectedName] || orderList.order[selectedName].length === 0) {
  // 何もしない or モーダル閉じる
  document.getElementById('edit-order-modal').style.display = 'none';
  return;
}


           const editOrderList = document.getElementById('edit-order-list');
           console.log(orderList.order[selectedName])
           if(orderList.order[selectedName].length===0){
             showAlert(translations[userLanguage]["Nenhum item foi selecionado"])
             alertModal.style.display = 'block';
             return
           }
           editOrderList.innerHTML = ''; // 既存のリストをクリア
           if (selectedName && orderList.order[selectedName]) {
             orderList.order[selectedName].forEach(item => {
               const li = document.createElement('li');
               li.dataset.id = item.id; // ← idだけ持つ

               li.innerHTML = `
                 ${item.name} - ￥${item.amount} (${item.quantity}個)
                 <button class="decrease-quantity">-</button>
                 <input type="number" class="quantity-input" value="${item.quantity}" min="0">
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

       function handleQuantityChange(event) {
         const li = event.target.closest('li');
         const id = Number(li.dataset.id);
         const input = li.querySelector('.quantity-input');

         let quantity = parseInt(input.value, 10) || 0;

         if (event.target.classList.contains('increase-quantity')) {
           quantity++;
         } else if (event.target.classList.contains('decrease-quantity')) {
           quantity--;
         }

         input.value = quantity;

         if (quantity <= 0) {
           removeOrderItemById(id);
         } else {
           updateOrderItemQuantityById(id, quantity);
         }
       }


       // オーダーアイテムの削除
       function removeOrderItemById(id) {
         const items = orderList.order[selectedName];
         const index = items.findIndex(item => item.id === id);

         if (index === -1) return;

         items.splice(index, 1);
         displayOrderForName(selectedName);
         displayEditOrderModal();

         if (orderList.order[selectedName].length === 0) {
  document.getElementById('edit-order-modal').style.display = 'none';
}

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
       function updateOrderItemQuantityById(id, quantity) {
         const items = orderList.order[selectedName];
         const index = items.findIndex(item => item.id === id);

         if (index === -1) return;

         const item = items[index];
         const basePrice = Math.floor(item.amount / item.quantity);

         item.quantity = quantity;
         item.amount = basePrice * quantity;

         displayOrderForName(selectedName);
         displayEditOrderModal();
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

function isOrderNameExists(name) {
  // console.log(name)
  // console.log(orderList.tableNo)
  // console.log(orderNameCache)
  return orderNameCache.some(item =>
    item.order_name === name &&
    item.table_no === String(orderList.tableNo)
  );
}


function saveOrderName(name) {
  orderNameCache.push({
    order_name: name,
    table_no: String(orderList.tableNo)
  });
  localStorage.setItem(
    'orderNameCache',
    JSON.stringify(orderNameCache)
  );
}



// 名前を追加するボタンのイベントリスナー
  //
  // addNameBtn.addEventListener('click', () => {
  //   document.getElementById('custom-keyboard').style.display = 'none';
  //
  //   const name = nameInput.value.trim();
  //   if (!name) return;
  //
  //   const exist = orderList.historyOrder.some(
  //     item => item.order_name === name
  //   );
  //   if (exist) {
  //     showAlert(translations[userLanguage]["comanda exist"]);
  //     return;
  //   }
  //
  //   // オーダー作成
  //   addName(name);
  //   addOrderName(name);
  //   nameInput.value = '';
  //   modal.style.display = 'none';
  //
  //   // 🔴 今作った orderName をグローバルに保持
  //   window.currentOrderName = name;
  //
  //   document.getElementById('custom-keyboard').style.display = 'none'
  //
  //   // 🔴 飲酒モーダルは「未表示なら」出す
  //   if (
  //     decodedToken.restaurant_id === 17 &&
  //     !hasShown(name, 'alcohol')
  //   ) {
  //     showAlcoholModal(name);
  //   }
  // });



  function displayOrderForName(name) {
    selectedItemsContainer.innerHTML = '';

    const items = orderList.order[name];
    // console.log(items)

    // 🔹 何もない場合
    if (!items || items.length === 0) {
      // console.log(translations)
      const li = document.createElement('li');
      li.className = 'empty-message';
      li.textContent = translations[userLanguage].noItem;
      selectedItemsContainer.appendChild(li);
      return;
    }

    // 🔹 アイテムがある場合
    items.forEach(item => {
      const li = document.createElement('li');
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

showAddNameModalBtn.addEventListener('click', () => {
  modal.style.display = 'block';

  // 👇 キーボード表示
  document.getElementById('custom-keyboard').style.display = 'block';

  // 👇 入力欄にフォーカス（カーソル表示用）
  document.getElementById('name-input').focus();
});


// モーダルを閉じる
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
     document.getElementById('custom-keyboard').style.display = 'none';
});

// 名前を追加するボタンのイベントリスナー
addNameBtn.onclick = () => {

  const name = nameInput.value.trim();
  if (!name) return;

  // 🔴 キャッシュ基準で重複チェック
  if (isOrderNameExists(name)) {
    showAlert(translations[userLanguage]["comanda exist"]);
    alertModal.style.display = 'block';
    return;
  }else{
    showAlcoholWarningModal()
  }

  addName(name);
  addOrderName(name);
  saveOrderName(name);

  nameInput.value = '';
  modal.style.display = 'none';

  document.getElementById('custom-keyboard').style.display = 'none'
};


// function isOrderNameExists(name) {
//   console.log(name)
//   const nodes = document.querySelectorAll('#order-names-container > div');
//
//   // console.log(nodes)
//
//   console.log(nodes)
//   return Array.from(nodes).some(div => div.textContent.trim() === name);
// }




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
            // console.log('Alarm status updated:', data.message);
        } else {
            // console.error('Error updating alarm status');
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

const passwordInput = document.getElementById('password-input');
const keyboard = document.getElementById('numeric-keyboard');
let activeInput = null;

passwordInput.setAttribute('readonly', true);

document.getElementById('div-table-btn').addEventListener('click', () => {
  document.getElementById('password-modal').style.display = 'block';

  const input = document.getElementById('password-input');
  activeInput = input;
  input.focus(); // 見た目用（readonlyでもOK）

  keyboard.classList.add('show');
});


document.addEventListener('click', (e) => {
  const input = e.target.closest('input[data-keyboard-target]');
  if (!input) return;

  activeInput = input;
  keyboard.classList.add('show');
});

// キーボード操作
keyboard.addEventListener('click', (e) => {
  if (!activeInput) return;

  const key = e.target.dataset.key;
  const action = e.target.dataset.action;

  if (key !== undefined) {
    activeInput.value += key;
  }

  if (action === 'clear') {
    activeInput.value = activeInput.value.slice(0, -1);
  }

  if (action === 'ok') {
    keyboard.classList.remove('show');
    activeInput.blur();
    activeInput = null;
  }
});

// モーダル閉じたらキーボードも閉じる
document.querySelectorAll('.modal .close').forEach(btn => {
  btn.addEventListener('click', () => {
    keyboard.classList.remove('show');
    activeInput = null;
  });
});

// モーダル閉じたら消す
document.querySelector('#password-modal .close')
  .addEventListener('click', () => {
    keyboard.classList.remove('show');
    passwordInput.value = '';
  });

  function openTableNumberModal() {
    const modal = document.getElementById('table-number-modal');
    const input = document.getElementById('new-table-number');

    modal.style.display = 'block';

    // 🔥 ここが超重要
    activeInput = input;
    input.focus();

    keyboard.classList.add('show');
  }




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
        openTableNumberModal();


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

        keyboard.classList.remove('show');

        activeInput = null;
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
      const options = JSON.parse(item.options);
      const menuItem = MainData.menus.find(m => m.id == item.menu_id);

      const optionNames = options.map(opt => {
        const optionDetail = MainData.options.find(o => o.id == opt.id);
        return optionDetail
          ? optionDetail[`option_name_${userLanguage}`]
          : translations[userLanguage]['option_unknown'];
      }).join(', ');

      let statusLabel = '';
      if (item.serve_status === 'pending') {
        statusLabel = `<span class="status-label pending">${translations[userLanguage]['preparando']}</span>`;
      } else if (item.serve_status === 'served') {
        statusLabel = `<span class="status-label served">${translations[userLanguage]['entregue']}</span>`;
      }

      const noOptionText =
        translations[userLanguage]['none'] ||
        translations[userLanguage]['Nenhuma'] ||
        'なし';

      const itemElement = document.createElement('li');
      itemElement.className = 'order-card';

      itemElement.innerHTML = `
        ${statusLabel}

        <div class="order-main-row">
          <span class="item-name">
            ${menuItem[`menu_name_${userLanguage}`]}
          </span>

          <span class="item-qty">
            x${item.quantity}
          </span>

          <span class="item-price">
            ${formatPrice(item.item_price)}
          </span>
        </div>

        <div class="order-sub-row">
          <span class="option-label">
            ${translations[userLanguage]['option']}:
          </span>

          <span class="option-container">
            ${options.length ? optionNames : noOptionText}
          </span>
        </div>
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
  document.getElementById('alcoholModal').style.display = 'flex'
}

document.getElementById('close-alcohol-modal').addEventListener('click', () => {
  document.getElementById('alcoholModal').style.display = 'none';
    showSplitBillModal(window.currentOrderName);

});


document.getElementById('close-splitbill-modal').addEventListener('click', () => {
  document.getElementById('splitBillModal').classList.add('hidden');
})
const input = document.getElementById('name-input');

function kb(char) {
  input.value += char;
}

function kbBack() {
  input.value = input.value.slice(0, -1);
}

function kbSpace() {
  input.value += ' ';
}


function getShownMessages() {
  return JSON.parse(localStorage.getItem('shownMessagesByOrder') || '{}');
}

function markShown(orderName, type) {
  const data = getShownMessages();
  if (!data[orderName]) data[orderName] = {};
  data[orderName][type] = true;
  localStorage.setItem('shownMessagesByOrder', JSON.stringify(data));
}

function hasShown(orderName, type) {
  const data = getShownMessages();
  return data[orderName]?.[type] === true;
}

function showAlcoholModal(orderName) {
  document.getElementById('alcoholModal').style.display = 'flex';
  markShown(orderName, 'alcohol');
}

function showSplitBillModal(orderName) {
  document.getElementById('splitBillModal').style.display = 'flex';
  markShown(orderName, 'splitBill');
}



// document.getElementById('fullscreenButton').addEventListener('click', () => {
//     const docElement = document.documentElement;
//     if (docElement.requestFullscreen) {
//         docElement.requestFullscreen();
//     } else if (docElement.mozRequestFullScreen) { // Firefox
//         docElement.mozRequestFullScreen();
//     } else if (docElement.webkitRequestFullscreen) { // Chrome, Safari, Opera
//         docElement.webkitRequestFullscreen();
//     } else if (docElement.msRequestFullscreen) { // IE/Edge
//         docElement.msRequestFullscreen();
//     }
//
//     // フルスクリーンボタンを非表示、解除ボタンを表示
//     document.getElementById('fullscreenButton').style.display = 'none';
//     // document.getElementById('exitFullscreenButton').style.display = 'block';
// });


// document.getElementById('exitFullscreenButton').addEventListener('click', () => {
//     if (document.exitFullscreen) {
//         document.exitFullscreen();
//     } else if (document.mozCancelFullScreen) { // Firefox
//         document.mozCancelFullScreen();
//     } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
//         document.webkitExitFullscreen();
//     } else if (document.msExitFullscreen) { // IE/Edge
//         document.msExitFullscreen();
//     }
//     // 解除ボタンを非表示、フルスクリーンボタンを表示
//     // document.getElementById('fullscreenButton').style.display = 'block';
//     document.getElementById('exitFullscreenButton').style.display = 'none';
// });
