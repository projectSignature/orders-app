



document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('clientId') || 0;
    let userLanguage = 'pt';
    let MainData = {};
    let currentSelectedButton = null;
    const categories = [];
    const orderCategories = document.getElementById('order-categories');
    const menuItemsContainer = document.getElementById('menu-items');
    const header = document.querySelector('header');
    const users = [,"Buonissimo",,,,,,,,,,,,,,,,"Roots Grill"]
    document.getElementById('userTitle').innerText = users[clientId]

    const translations = {
        'ja': { local: '店内', takeout: 'テイクアウト' },
        'pt': { local: 'refeição local', takeout: 'takeout' },
        'en': { local: 'Dine-in', takeout: 'Takeout' }
    };

    MainData = await makerequest(`${server}/orders/getBasedata?user_id=${clientId}`);
    const hasTakeout = MainData.categories.some(category => category.is_takeout === true);

    let takeoutFilter = 'local';
    let selectElement;

    if (hasTakeout) {
        selectElement = document.createElement('select');
        selectElement.id = 'takeout-select';
        updateSelectOptions(); // 初回のオプション設定
        selectElement.addEventListener('change', () => {
            takeoutFilter = selectElement.value;
            updateCategories();
        });
        header.insertBefore(selectElement, document.getElementById('language-switcher'));
    }

    updateCategories();

    function updateCategories() {
        orderCategories.innerHTML = '';
        const filteredCategories = MainData.categories.filter(category =>
            takeoutFilter === 'takeout' ? category.is_takeout === true : category.is_takeout === false
        );
        filteredCategories.sort((a, b) => a.display_order - b.display_order);

        filteredCategories.forEach((category, index) => {
            let button = document.createElement('button');
            button.textContent = category[`category_name_${userLanguage}`];

            if (index === 0) {
                button.classList.add('selected-category');
                currentSelectedButton = button;
                displayMenuItems(category.id);
            }

            button.addEventListener('click', () => {
                if (currentSelectedButton) {
                    currentSelectedButton.classList.remove('selected-category');
                }
                button.classList.add('selected-category');
                currentSelectedButton = button;
                displayMenuItems(category.id);
            });

            orderCategories.appendChild(button);
        });
    }

    // 言語変更に応じてセレクトメニューのオプションも更新
    function updateSelectOptions() {
        if (selectElement) {
            selectElement.innerHTML = `
                <option value="local">${translations[userLanguage].local}</option>
                <option value="takeout">${translations[userLanguage].takeout}</option>
            `;
        }
    }

    document.querySelectorAll('.language-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            userLanguage = icon.getAttribute('data-lang');
            updateCategories();
            updateSelectOptions(); // セレクトメニューのラベルを翻訳
        });
    });

    function displayMenuItems(categoryId) {
        const sortedData = MainData.menus
            .filter(item => item.category_id === categoryId)
            .sort((a, b) => a.stock_status !== b.stock_status ? (a.stock_status ? -1 : 1) : a.display_order - b.display_order);

        menuItemsContainer.innerHTML = '';
        sortedData.forEach(item => {
            let div = document.createElement('div');
            div.classList.add('menu-item');

            if (!item.stock_status) {
                div.classList.add('sold-out');
                div.innerHTML = `<img src="${item.imagem_string}" alt="${item.menu_name_pt}">
                                 <h3>${item[`menu_name_${userLanguage}`]}</h3>
                                 <p>Sold Out</p>`;
            } else {
                div.innerHTML = `<img src="${item.imagem_string}" alt="${item.menu_name_pt}">
                                 <h3>${item[`menu_name_${userLanguage}`]}</h3>
                                 <p>￥${Math.floor(item.price).toLocaleString()}</p>`;
            }

            menuItemsContainer.appendChild(div);
        });
    }
});
