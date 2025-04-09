const pageToButtonMap = {
    'pos.html': 'pos-btn',
    'menuUpdate.html': 'menu-btn',
    'history.html': 'history-btn',
    'logout.html': 'logout-btn'
};



document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // すべてのボタンからactiveクラスを削除
            navButtons.forEach(btn => btn.classList.remove('active'));

            // クリックされたボタンにactiveクラスを追加
            this.classList.add('active');
        });
    });

    // ページ読み込み時に現在のページに対応するボタンをハイライトする
    const currentPage = window.location.pathname.split('/').pop();
    const correspondingButtonId = pageToButtonMap[currentPage];

    if (correspondingButtonId) {
        document.getElementById(correspondingButtonId).classList.add('active');
    }
});
