const token = window.localStorage.getItem('token');
if (!token) {
  window.location.href = '../index.html';
}
const decodedToken = jwt_decode(token); // jwtDecodeではなくjwt_decodeを使用

let clients ={
  id:decodedToken.userId, //クライアントid
  language:'pt',
  paytype:'',
  selectedOrder:"",
  printInfo:"",
  currenMenuID:"",
  options:"",
  categories:""
}

document.getElementById('menu-btn').style = "background-color:orange"
const datalist = document.getElementById("menu-lister");
const datalistAccess = document.getElementById("menu-listeracceso");
const accessBtn = document.getElementById('access-toestoque')
const accesRapidoDiv = document.getElementById('alterarEstoquerapido')
const menuForm = document.getElementById('menu-form');
const optionsListElement = document.getElementById('options-list');
const stockMotherDiv = document.getElementById('menu-stock-mother-div')



let newFlug = false
const loadingMessage = document.getElementById('loading-message');

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
  // createDependentePedidosRetry()
});



document.getElementById('language-select').value = currentLang;
applyTranslation(currentLang);

document.addEventListener('DOMContentLoaded', async () => {
   showLoadingPopup();
    const categorySelectElement = document.getElementById('category-select');
    const menuListElement = document.getElementById('menu-list');
    const menuForm = document.getElementById('menu-form');
    const searchInput = document.getElementById("menu-search");
    const optionsListElement = document.getElementById('options-list');
    let currentMenuItem = null;

    const getData = await makerequest(`${server}/orders/getBasedata?user_id=${clients.id}`);
    const { categories, menus, options } = getData;
    loadingMessage.style.display = 'none';
    clients.options = options
    clients.categories = categories

    categorySelectElement.innerHTML = '';
    categories.forEach(category => {
      // console.log(categories)
        const optionElement = document.createElement('option');
        optionElement.value = category.id;
        optionElement.textContent = category[`admin_item_name`];
        categorySelectElement.appendChild(optionElement);
    });

    // Listen for category selection changes
    categorySelectElement.addEventListener('change', () => {
        const selectedCategoryId = categorySelectElement.value;
        displayMenuItems(menus.filter(menu => menu.category_id == selectedCategoryId));
    });

    // **メニュー名とメニュー情報をMapに保存**
      const menuMap = new Map();

      function populateDatalist() {
          datalist.innerHTML = ""; // **リストをクリア**
         datalistAccess.innerHTML = ""; // **リストをクリア**
         menus.forEach(item => {
           if (!item.admin_item_name) return;

           const option1 = document.createElement("option");
           option1.value = item.admin_item_name;
           datalist.appendChild(option1);

           const option2 = document.createElement("option");
           option2.value = item.admin_item_name;
           datalistAccess.appendChild(option2);

           menuMap.set(item.admin_item_name, item);
         });

      }

      // **メニューが選択された時の処理**
      function handleSelection() {
          const selectedValue = searchInput.value.trim();
          if (!selectedValue) return;

          const selectedItem = menuMap.get(selectedValue);

          if (selectedItem) {
              displayMenuItem(selectedItem);
              searchInput.value = ""; // **検索欄をクリア**
              searchInput.placeholder = `${t('selected')}: ${selectedItem.admin_item_name}`;
          }

          // **リストをリセット**
          setTimeout(() => {
              populateDatalist();
          }, 100);
      }

      // **検索入力時の処理**
      searchInput.addEventListener("input", () => {
        console.log('kok')
          if (menuMap.has(searchInput.value)) {
              handleSelection();
          }
      });

      // **フォーカス時にリストを再作成**
      searchInput.addEventListener("focus", () => {
          populateDatalist();
      });

      hideLoadingPopup();

    let draggedItem = null; // ドラッグ中の項目を保存する変数
    let isDragging = false; // ドラッグ状態を管理する変数

    function displayMenuItems(filteredMenus) {

    const dbLang = currentLang === 'jp' ? 'ja' : currentLang;
    menuListElement.innerHTML = ''; // 既存のメニュー項目をクリア
    const sortedMenuItems = filteredMenus.sort((a, b) => a.display_order - b.display_order);
    filteredMenus.forEach(menuItem => {
        const menuItemElement = document.createElement('div');
        menuItemElement.classList.add('menu-item');
        menuItemElement.textContent = menuItem[`menu_name_${dbLang}`];
        menuItemElement.dataset.id = menuItem.id;
        menuItemElement.draggable = true; // ドラッグ可能に設定
        // ドラッグが開始されたときのイベントリスナー
        menuItemElement.addEventListener('dragstart', () => {
            draggedItem = menuItemElement;
            isDragging = true; // ドラッグ中のフラグを設定
            setTimeout(() => {
                menuItemElement.classList.add('dragging');
                menuItemElement.style.opacity = '0.5'; // ドラッグ中の視覚的フィードバック
                menuItemElement.style.backgroundColor = '#FFD700'; // ドラッグ中の色変更
            }, 0);
        });

        // ドラッグが終了したときのイベントリスナー
        menuItemElement.addEventListener('dragend', () => {
            menuItemElement.classList.remove('dragging');
            menuItemElement.style.opacity = '1'; // 不透明度をリセット
            menuItemElement.style.backgroundColor = ''; // 背景色をリセット
            draggedItem = null;
            isDragging = false; // ドラッグ終了時にフラグをリセット
            // ドロップターゲットも背景色をリセット
            const highlightedItems = document.querySelectorAll('.menu-item');
            highlightedItems.forEach(item => {
                item.style.backgroundColor = ''; // 全ての背景色をリセット
            });
            saveMenuOrder(filteredMenus); // 並べ替えた順序を保存
        });

        // ドラッグオーバー時のイベントリスナー
        menuItemElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            const bounding = menuItemElement.getBoundingClientRect();
            const offset = bounding.y + bounding.height / 2;
            if (e.clientY > offset) {
                menuListElement.insertBefore(draggedItem, menuItemElement.nextSibling);
            } else {
                menuListElement.insertBefore(draggedItem, menuItemElement);
            }
        });

        // ドラッグ中にハイライトするためのイベントリスナー
        menuItemElement.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (menuItemElement !== draggedItem) {
                menuItemElement.style.backgroundColor = '#FFEB3B'; // ドロップターゲットをハイライト
            }
        });

        // ドラッグ中にハイライトを解除するためのイベントリスナー
        menuItemElement.addEventListener('dragleave', () => {
            if (menuItemElement !== draggedItem) {
                menuItemElement.style.backgroundColor = ''; // ハイライトを解除
            }
        });

        // クリックイベントのリスナー
        menuItemElement.addEventListener('click', () => {
            if (!isDragging) { // ドラッグ中でない場合のみクリックイベントを処理
                displayMenuItem(menuItem);
                document.getElementById('edit-options-btn').style.display='flex'
            }
        });

        menuListElement.appendChild(menuItemElement);
    });
}

// 配列内のアイテムを入れ替える関数
function swapMenuItems(menuArray, fromIndex, toIndex) {
    const [movedItem] = menuArray.splice(fromIndex, 1);
    menuArray.splice(toIndex, 0, movedItem);
}

// 並べ替え後に順序をサーバーに送信する関数
function saveMenuOrder(filteredMenus) {
    // 並べ替えた後の順序を取得
    const updatedOrder = Array.from(menuListElement.children).map((menuItemElement, index) => {
        const id = parseInt(menuItemElement.dataset.id, 10);
        return {
            id: id,
            display_order: index + 1 // 新しい順序を1から始める
        };
    });
    // サーバーへ並べ替えた順序を保存
    fetch(`${server}/orders/updateMenuOrder`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedOrder)
    })
    .then(response => response.json())
    .then(data => {
      alert('sequência alterada com sucesso.')
    })
    .catch(error => {
      alert('erro no registro')
    });
}

    function displayMenuItem(menuItem) {
      console.log(menuItem)
      stockMotherDiv.style.display = 'none';
      menuForm.style.display = 'block';
        currentMenuItem = menuItem;
        menuForm.classList.add('active');
        clients.currenMenuID = menuItem.id
        document.getElementById('menu_name_en').value = menuItem.menu_name_en;
        document.getElementById('menu_name_pt').value = menuItem.menu_name_pt;
        document.getElementById('menu_name_ja').value = menuItem.menu_name_ja;
        document.getElementById('description_en').value = menuItem.description_en;
        document.getElementById('description_pt').value = menuItem.description_pt;
        document.getElementById('description_ja').value = menuItem.description_ja;
        document.getElementById('price').value = menuItem.price;
        document.getElementById('display_order').value = menuItem.display_order;
        document.getElementById('menu_name_control').value = menuItem.admin_item_name;
        document.getElementById('stock_status').value = menuItem.stock_status ? "true" : "false";

        // Display options with delete functionality
//         optionsListElement.innerHTML = '';
//         const menuOptions = options.filter(option => option.menu_id === menuItem.id);
//         menuOptions.forEach(option => {
//         const liElement = document.createElement('li');
//         liElement.classList.add('option-item');
//         liElement.textContent = `${option.option_name_pt} (${option.additional_price})`;
//
//         const deleteButton = document.createElement('button');
//         deleteButton.textContent = 'Deletar';
//         deleteButton.classList.add('delete-option-btn');
//         deleteButton.addEventListener('click', async () => {
//             await deleteOption(option.id);
//             liElement.remove();
//         });
//
//         liElement.appendChild(deleteButton);
//         optionsListElement.appendChild(liElement);
// });
        // Remove the active class from the previously active menu item, if any
        const activeMenuItem = document.querySelector('.menu-item.active');
        if (activeMenuItem) {
            activeMenuItem.classList.remove('active');
        }
        // Add the active class to the clicked menu item
        const clickedMenuItem = document.querySelector(`.menu-item[data-id="${menuItem.id}"]`);
        if (clickedMenuItem) {
            clickedMenuItem.classList.add('active');
        }
    }
    // Automatically select the first category and display its menus
    if (categories.length > 0) {
        categorySelectElement.value = categories[0].id;
        displayMenuItems(menus.filter(menu => menu.category_id == categories[0].id));
    }


    accessBtn.addEventListener('click', () => {
        stockMotherDiv.style.display = 'block';
        menuForm.style.display = 'none';
        renderStockList();
    });

    document.getElementById("menu-search-acesso").addEventListener("input", e => {
      const keyword = e.target.value.toLowerCase();
      const filteredMenus = menus.filter(m => m.admin_item_name.toLowerCase().includes(keyword));
      renderStockList(filteredMenus);
    });


    // **在庫管理 UI を作成**
    function renderStockList(filtered = menus) {
      accesRapidoDiv.innerHTML = ""; // クリア

      filtered.forEach(menu => {
        const menuItemDiv = document.createElement("div");
        menuItemDiv.classList.add("stock-item");

        const nameLabel = document.createElement("span");
        nameLabel.textContent = menu.admin_item_name;
        nameLabel.classList.add("menu-name");

        const switchLabel = document.createElement("label");
        switchLabel.classList.add("switch");

        const toggleSwitch = document.createElement("input");
        toggleSwitch.type = "checkbox";
        toggleSwitch.checked = menu.stock_status;
        toggleSwitch.classList.add("toggle-input");

        const slider = document.createElement("span");
        slider.classList.add("slider");

        toggleSwitch.addEventListener("change", async () => {
          menu.stock_status = toggleSwitch.checked;
          toggleSwitch.disabled = true;
          slider.classList.add("loading");
          await updateStockStatus(menu.id, menu.stock_status);
          toggleSwitch.disabled = false;
          slider.classList.remove("loading");
        });

        switchLabel.appendChild(toggleSwitch);
        switchLabel.appendChild(slider);
        menuItemDiv.appendChild(nameLabel);
        menuItemDiv.appendChild(switchLabel);
        accesRapidoDiv.appendChild(menuItemDiv);
      });
    }


    // **バックエンドに在庫情報を送信**
    async function updateStockStatus(menuId, stockStatus) {
        try {
            const response = await fetch(`${server}/orderskun/updateStock`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id: menuId, stock_status: stockStatus })
            });

            if (!response.ok) throw new Error("API エラー");

        } catch (error) {

        }
    }

});

async function deleteOption(optionId) {
    try {

    await  fetch(`${server}/orders/delete/option`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({id:optionId})
      })
      .then(response => response.json())
      .then(data => {
        showCustomAlert(`Deletado`)
          console.log('Order updated:', data);
      })

    } catch (error) {
        console.error('Failed to delete option:', error);
        alert('Failed to delete option');
    }
}

// document.getElementById('add-option-btn').addEventListener('click', async () => {
//     const optionNameEn = document.getElementById('new-option-en').value;
//     const optionNamePt = document.getElementById('new-option-pt').value;
//     const optionNameJa = document.getElementById('new-option-ja').value;
//     const additionalPrice = document.getElementById('new-option-price').value;
//
//     if (!optionNameEn || !additionalPrice) {
//         alert('Selecione todos os campos para o registro');
//         return;
//     }
//
//     const newOption = {
//         user_id: clients.id,
//         menu_id: clients.currenMenuID,
//         option_name_en: optionNameEn,
//         option_name_pt: optionNamePt,
//         option_name_ja: optionNameJa,
//         additional_price: additionalPrice
//     };
//
//     try {
//       fetch(`${server}/orders/add/option`, {
//           method: 'POST',
//           headers: {
//               'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(newOption)
//       })
//       .then(response => response.json())
//       .then(data => {
//         showCustomAlert(`Adicionado`)
//         const liElement = document.createElement('li');
//         liElement.textContent = `${addedOption.option_name_en} (${addedOption.additional_price})`;
//         const deleteButton = document.createElement('button');
//         deleteButton.textContent = 'Delete';
//         deleteButton.classList.add('delete-option-btn');
//         deleteButton.addEventListener('click', async () => {
//             await deleteOption(addedOption.id);
//             liElement.remove();
//         });
//
//         liElement.appendChild(deleteButton);
//         optionsListElement.appendChild(liElement);
//
//         alert('Option added successfully');
//           console.log('Order updated:', data);
//       })
//     } catch (error) {
//         console.error('Failed to add option:', error);
//         alert('Failed to add option');
//     }
// });


document.getElementById('delete-menu-item').addEventListener('click', async () => {
    if (!clients.currenMenuID) return;
    const confirmDelete = confirm('Deseja deletar o item mesmo?');
    if (!confirmDelete) return;
    try {
        // Delete related options first
        const menuOptions = clients.options.filter(option => option.menu_id === clients.currenMenuID);
        for (const option of menuOptions) {
            await deleteOption(option.id);
        }
        fetch(`${server}/orders/delete/menu`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id:clients.currenMenuID})
        })
        .then(response => response.json())
        .then(data => {
          showCustomAlert(`Deletado`)
          window.location.reload();
        })
    } catch (error) {
        console.error('Failed to delete menu item and options:', error);
        alert('Failed to delete menu item and options');
    }
});

function clearMenuForm() {
    currentMenuItem = null;
    document.getElementById('menu_name_en').value = '';
    document.getElementById('menu_name_pt').value = '';
    document.getElementById('menu_name_ja').value = '';
    document.getElementById('description_en').value = '';
    document.getElementById('description_pt').value = '';
    document.getElementById('description_ja').value = '';
    document.getElementById('price').value = '';
    document.getElementById('display_order').value = '';
    document.getElementById('stock_status').value = 'true';
    document.getElementById('menu_image').value = '';
    optionsListElement.innerHTML = '';
    menuForm.classList.remove('active');
}


document.getElementById('add-new-menu').addEventListener('click', () => {
  document.getElementById('edit-options-btn').style.display='none'
  stockMotherDiv.style.display = 'none';
  menuForm.style.display = 'block';
  newFlug =true
    // 右側のフォームを表示し、全てのフィールドをクリアする

    menuForm.classList.add('active'); // フォームを表示
    document.getElementById('menu-category-new').style="display:block"

    // フォーム内のフィールドをクリア
    document.getElementById('menu_name_en').value = '';
    document.getElementById('menu_name_pt').value = '';
    document.getElementById('menu_name_ja').value = '';
    document.getElementById('description_en').value = '';
    document.getElementById('description_pt').value = '';
    document.getElementById('description_ja').value = '';
    document.getElementById('price').value = '';
    document.getElementById('display_order').value = '';
    document.getElementById('stock_status').checked = true;
    document.getElementById('menu_name_control').value = ''
    // document.getElementById('options-list').style.display='none'
    // document.getElementById('add-option-form').style.display='none'
    // document.getElementById('optionsTitle').style.display='none'

    const newCategorySelect = document.getElementById('new-category-select');
    // 既存のオプションをクリア
    newCategorySelect.innerHTML = '';
    // 取得したカテゴリーデータを新しいセレクトボックスに設定
 clients.categories.forEach(category => {
     const optionElement = document.createElement('option');
     optionElement.value = category.id;
     optionElement.textContent = category.admin_item_name; // 表示名を設定
     newCategorySelect.appendChild(optionElement);
 });
});

document.getElementById('save-menu-item').addEventListener('click', async () => {
    if(document.getElementById('menu_name_control').value===""){
      alert('Insira o nome de controle')
      return
    }
    if (!newFlug) {
        const menuData = {
            user_id: clients.id,
            id: clients.currenMenuID,
            category_id: document.getElementById('category-select').value,
            menu_name_en: document.getElementById('menu_name_en').value,
            menu_name_pt: document.getElementById('menu_name_pt').value,
            menu_name_ja: document.getElementById('menu_name_ja').value,
            description_en: document.getElementById('description_en').value,
            description_pt: document.getElementById('description_pt').value,
            description_ja: document.getElementById('description_ja').value,
            price: document.getElementById('price').value,
            display_order: document.getElementById('display_order').value,
            stock_status: document.getElementById('stock_status').value === "true",
            admin_item_name: document.getElementById('menu_name_control').value
        };

        const menuImageInput = document.getElementById('menu_image');
        const menuImageFile = menuImageInput.files[0];

        const formData = new FormData();
        formData.append('menuData', JSON.stringify(menuData)); // 常にmenuDataを追加

        if (menuImageFile) {
            formData.append('menu_image', menuImageFile); // 画像がある場合のみ追加
        }

        try {
            showLoadingPopup();
            const response = await fetch(`${server}/orders/updates/menu`, {
                method: 'POST',
                body: formData
            });

            const menus = await response.json();
            if (response.ok) {
                hideLoadingPopup();
                alert('Menu alterado com sucesso');
                window.location.reload();
            } else {
                throw new Error(menus.message || 'Erro no registro');
            }
        } catch (error) {
            hideLoadingPopup();
            console.error(error);
            alert('Erro no registro');
        }
    } else {
        newAddMenu();
    }
});


async function newAddMenu() {
  stockMotherDiv.style.display = 'none';
  menuForm.style.display = 'block';
  if(document.getElementById('menu_name_control').value===""){
    alert('Insira o nome de controle')
    return
  }
    const menuData = {
        user_id: clients.id,
        category_id: document.getElementById('new-category-select').value,
        menu_name_en: document.getElementById('menu_name_en').value,
        menu_name_pt: document.getElementById('menu_name_pt').value,
        menu_name_ja: document.getElementById('menu_name_ja').value,
        description_en: document.getElementById('description_en').value,
        description_pt: document.getElementById('description_pt').value,
        description_ja: document.getElementById('description_ja').value,
        price: document.getElementById('price').value,
        display_order: document.getElementById('display_order').value,
        stock_status: document.getElementById('stock_status').value === "true",
        admin_item_name: document.getElementById('menu_name_control').value
    };
    const menuImageInput = document.getElementById('menu_image');
    const menuImageFile = menuImageInput.files[0]; // Pega o primeiro arquivo
    const formData = new FormData();
    formData.append('menuData', JSON.stringify(menuData)); // メニューデータは常に追加

    if (menuImageFile) {
        formData.append('menu_image', menuImageFile); // 画像がある場合のみ追加
    }

    try {
        showLoadingPopup();
        const response = await fetch(`${server}/orders/create/menu`, {
            method: 'POST',
            body: formData // フォームデータを送信
        });
        const menus = await response.json();
        if (response.ok) {
            hideLoadingPopup();
            alert('Menu alterado com sucesso');
            window.location.reload();
        } else {
            throw new Error(menus.message || 'Erro no registro');
        }
    } catch (error) {
        hideLoadingPopup();
        console.error(error);
        alert('Erro no registro');
    }
    console.log(menuData, 'menuData');
    console.log(menuImageFile, 'menuImageFile');

}

function showCustomAlert(message) {
    const alertBox = document.getElementById('custom-alert');
    alertBox.querySelector('p').textContent = message;
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 1000); // 1秒間表示
}

let currentOptions = [];

function renderOptions() {
  const list = document.getElementById("option-modal-list");
  list.innerHTML = "";

  currentOptions.forEach((opt, idx) => {
    const div = document.createElement("div");
    div.className = "option-item";
    div.innerHTML = `
      <input value="${opt.option_name_pt}" onchange="currentOptions[${idx}].option_name_pt=this.value">
      <input value="${opt.option_name_en}" onchange="currentOptions[${idx}].option_name_en=this.value">
      <input value="${opt.option_name_ja}" onchange="currentOptions[${idx}].option_name_ja=this.value">
      <input type="number" value="${opt.additional_price}" onchange="currentOptions[${idx}].additional_price=this.value">
      <button class="delete-option-btn">Deletar</button>
    `;

    div.querySelector("button").addEventListener("click", () => {
      currentOptions.splice(idx, 1); // currentOptions から削除
      div.remove(); // 表示も削除
    });

    list.appendChild(div);
  });

}

function updateOption(index, key, value) {
  currentOptions[index][key] = value;
}

function removeOption(index) {
  currentOptions.splice(index, 1);
  renderOptions();
}

// document.getElementById("add-option-btn").addEventListener("click", () => {
//   currentOptions.push({ option_name_pt: "", option_name_en: "", option_name_ja: "", additional_price: 0 });
//   renderOptions();
// });

document.getElementById("edit-options-btn").addEventListener("click", () => {
  console.log(clients.options)
  const optionModal = document.getElementById("option-modal");
  const list = document.getElementById("option-modal-list");
  list.innerHTML = "";
  currentOptions = clients.options.filter(opt => opt.menu_id === clients.currenMenuID);

  currentOptions.forEach((opt, idx) => {
    const div = document.createElement("div");
    div.className = "option-item";
    div.innerHTML = `
      <input value="${opt.option_name_pt}" onchange="currentOptions[${idx}].option_name_pt=this.value">
      <input value="${opt.option_name_en}" onchange="currentOptions[${idx}].option_name_en=this.value">
      <input value="${opt.option_name_ja}" onchange="currentOptions[${idx}].option_name_ja=this.value">
      <input type="number" value="${opt.additional_price}" onchange="currentOptions[${idx}].additional_price=this.value">
      <button class="delete-option-btn">Deletar</button>
    `;

    const deleteBtn = div.querySelector(".delete-option-btn");
    deleteBtn.addEventListener("click", () => {
      currentOptions.splice(idx, 1); // currentOptionsから削除
      div.remove(); // 表示上も削除
    });

    list.appendChild(div);
  });


  optionModal.style.display = "flex";
});

document.getElementById("add-option-to-modal").addEventListener("click", () => {
  currentOptions.push({
    option_name_pt: "",
    option_name_en: "",
    option_name_ja: "",
    additional_price: 0
  });
  renderOptions(); // 再描画してUIにも反映
});


document.getElementById("save-option-modal").addEventListener("click", async () => {
   showLoadingPopup();
  try {
    const res = await fetch(`${server}/orders/update/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_id: clients.currenMenuID,
        user_id: clients.id,
        options: currentOptions
      })
    });

    const result = await res.json();
    if (res.ok) {
      showCustomAlert("Opções atualizadas");
      document.getElementById("option-modal").style.display = "none";

      // フロントの clients.options を更新
      clients.options = clients.options.filter(opt => opt.menu_id !== clients.currenMenuID).concat(result.data);
    } else {
      alert(result.message || 'Erro ao salvar opções');
    }
    hideLoadingPopup()
  } catch (err) {
    console.error(err);
    alert('Falha na atualização das opções');
  }
});


// document.getElementById("add-option-to-modal").addEventListener("click", () => {
//   const newOption = {
//     user_id: clients.id,
//     menu_id: clients.currenMenuID,
//     option_name_pt: "",
//     option_name_en: "",
//     option_name_ja: "",
//     additional_price: 0
//   };
//   fetch(`${server}/orders/add/option`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(newOption)
//   })
//   .then(res => res.json())
//   .then(() => {
//     showCustomAlert("Opção adicionada");
//     document.getElementById("edit-options-btn").click(); // 再描画
//   });
// });

document.getElementById("close-option-modal").addEventListener("click", () => {
  document.getElementById("option-modal").style.display = "none";
});
