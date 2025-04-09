
let clients = {
    id: 1,
    language: 'pt',
    paytype: '',
    selectedOrder: "",
    printInfo: "",
    currenMenuID: "",
    options: "",
    categories: ""
}
document.getElementById('menu-btn').style = "background-color:orange"
let newFlug = false
const loadingMessage = document.getElementById('loading-message');

document.addEventListener('DOMContentLoaded', async () => {


    loadingMessage.style.display = 'block';
    const categorySelectElement = document.getElementById('category-select');
    const menuListElement = document.getElementById('menu-list');
    const menuForm = document.getElementById('menu-form');
    const optionsListElement = document.getElementById('options-list');
    let currentMenuItem = null;

    // Fetch categories, menus, and options
    const getData = await makerequest(`${server}/orders/getBasedata?user_id=${clients.id}`);
    const { categories, menus, options } = getData;
    loadingMessage.style.display = 'none';
    clients.options = options
    clients.categories = categories

    // Load categories into the select element
    categorySelectElement.innerHTML = '';
    categories.forEach(category => {
        const optionElement = document.createElement('option');
        optionElement.value = category.id;
        optionElement.textContent = category[`category_name_${clients.language}`]; // 表示名を変更できます
        categorySelectElement.appendChild(optionElement);
    });

    // Listen for category selection changes
    categorySelectElement.addEventListener('change', () => {
        const selectedCategoryId = categorySelectElement.value;
        displayMenuItems(menus.filter(menu => menu.category_id == selectedCategoryId));
    });





    let draggedItem = null; // ドラッグ中の項目を保存する変数
    let isDragging = false; // ドラッグ状態を管理する変数





    function displayMenuItems(filteredMenus) {
        menuListElement.innerHTML = ''; // 既存のメニュー項目をクリア
        const sortedMenuItems = filteredMenus.sort((a, b) => a.display_order - b.display_order);
        filteredMenus.forEach(menuItem => {
            const menuItemElement = document.createElement('div');
            menuItemElement.classList.add('menu-item');
            menuItemElement.textContent = menuItem[`menu_name_${clients.language}`];
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
        document.getElementById('stock_status').value = menuItem.stock_status ? "true" : "false";

        // Display options with delete functionality
        optionsListElement.innerHTML = '';
        const menuOptions = options.filter(option => option.menu_id === menuItem.id);
        menuOptions.forEach(option => {
            const liElement = document.createElement('li');
            liElement.classList.add('option-item');
            liElement.textContent = `${option.option_name_en} (${option.additional_price})`;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Deletar';
            deleteButton.classList.add('delete-option-btn');
            deleteButton.addEventListener('click', async () => {
                await deleteOption(option.id);
                liElement.remove();
            });

            liElement.appendChild(deleteButton);
            optionsListElement.appendChild(liElement);
        });
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
});

async function deleteOption(optionId) {
    try {

        await fetch(`${server}/orders/delete/option`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: optionId })
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

document.getElementById('add-option-btn').addEventListener('click', async () => {
    const optionNameEn = document.getElementById('new-option-en').value;
    const optionNamePt = document.getElementById('new-option-pt').value;
    const optionNameJa = document.getElementById('new-option-ja').value;
    const additionalPrice = document.getElementById('new-option-price').value;

    if (!optionNameEn || !additionalPrice) {
        alert('Selecione todos os campos para o registro');
        return;
    }

    const newOption = {
        user_id: clients.id,
        menu_id: clients.currenMenuID,
        option_name_en: optionNameEn,
        option_name_pt: optionNamePt,
        option_name_ja: optionNameJa,
        additional_price: additionalPrice
    };

    try {
        fetch(`${server}/orders/add/option`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newOption)
        })
            .then(response => response.json())
            .then(data => {
                showCustomAlert(`Adicionado`)
                const liElement = document.createElement('li');
                liElement.textContent = `${addedOption.option_name_en} (${addedOption.additional_price})`;
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('delete-option-btn');
                deleteButton.addEventListener('click', async () => {
                    await deleteOption(addedOption.id);
                    liElement.remove();
                });

                liElement.appendChild(deleteButton);
                optionsListElement.appendChild(liElement);

                alert('Option added successfully');
                console.log('Order updated:', data);
            })
    } catch (error) {
        console.error('Failed to add option:', error);
        alert('Failed to add option');
    }
});


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
            body: JSON.stringify({ id: clients.currenMenuID })
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
    newFlug = true
    // 右側のフォームを表示し、全てのフィールドをクリアする
    const menuForm = document.getElementById('menu-form');
    const optionsListElement = document.getElementById('options-list');


    menuForm.classList.add('active'); // フォームを表示
    document.getElementById('menu-category-new').style = "display:block"

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



    const newCategorySelect = document.getElementById('new-category-select');

    // 既存のオプションをクリア
    newCategorySelect.innerHTML = '';
    console.log(clients.categories)
    // 取得したカテゴリーデータを新しいセレクトボックスに設定
    clients.categories.forEach(category => {
        const optionElement = document.createElement('option');
        optionElement.value = category.id;
        optionElement.textContent = category.category_name_en; // 表示名を設定
        console.log(optionElement)
        newCategorySelect.appendChild(optionElement);
    });


});

document.getElementById('save-menu-item').addEventListener('click', async () => {
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
            stock_status: document.getElementById('stock_status').value === "true"
        };

        // Captura a imagem do input file
        const menuImageInput = document.getElementById('menu_image');
        const menuImageFile = menuImageInput.files[0]; // Pega o primeiro arquivo

        if (menuImageFile) {
            // Cria um FormData para enviar o arquivo junto com os dados do menu
            const formData = new FormData();
            formData.append('menuData', JSON.stringify(menuData)); // Adiciona os dados do menu
            formData.append('menu_image', menuImageFile); // Adiciona a imagem como BLOB
            console.log(formData, 'formData')
            try {
                const response = await fetch(`${server}/orders/updates/menu`, {
                    method: 'POST',
                    body: formData // Envia o FormData
                });

                const menus = await response.json();
                if (response.ok) {
                    alert('Menu alterado com sucesso');
                    window.location.reload();
                } else {
                    throw new Error(menus.message || 'Erro no registro');
                }
            } catch (error) {
                console.error(error);
                alert('Erro no registro');
            }
        } else {
            alert('Por favor, selecione uma imagem.');
        }
    } else {
        newAddMenu();
    }
});


async function newAddMenu() {
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
        stock_status: document.getElementById('stock_status').value === "true"
    };
    const menuImageInput = document.getElementById('menu_image');
    const menuImageFile = menuImageInput.files[0]; // Pega o primeiro arquivo
    if (menuImageFile) {
        const formData = new FormData();
        formData.append('menuData', JSON.stringify(menuData)); // Adiciona os dados do menu
        formData.append('menu_image', menuImageFile); // Adiciona a imagem como BLOB
        try {
            const response = await fetch(`${server}/orders/create/menu`, {
                method: 'POST',
                body: formData // Envia o FormData
            });
            const menus = await response.json();
            if (response.ok) {
                alert('Menu alterado com sucesso');
                window.location.reload();
            } else {
                throw new Error(menus.message || 'Erro no registro');
            }
        } catch (error) {
            console.error(error);
            alert('Erro no registro');
        }
        console.log(menuData, 'menuData')
        console.log(menuImageFile, 'menuImageFile')
    }
}

function showCustomAlert(message) {
    const alertBox = document.getElementById('custom-alert');
    alertBox.querySelector('p').textContent = message;
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 1000); // 1秒間表示
}



// async function loadCategories() {
//     const categories = await makerequest(`${server}/orders/getCategories?user_id=${clients.id}`);
//     const categorySelect = document.getElementById('category-select');
//     categorySelect.innerHTML = ''; // 既存の選択肢をクリア
//     categories.forEach(category => {
//         const optionElement = document.createElement('option');
//         optionElement.value = category.id;
//         optionElement.textContent = category.category_name_en; // 表示名を変更できます
//         categorySelect.appendChild(optionElement);
//     });
// }

// document.addEventListener('DOMContentLoaded', async () => {
//     await loadCategories(); // カテゴリリストのロード
// });
