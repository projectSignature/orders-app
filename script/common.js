async function makerequest(url){
  const request = await fetch(url)  //esperar aqui
  return request.json()
}

const pageToButtonMap = {
    'pos.html': 'pos-btn',
    'menuUpdate.html': 'menu-btn',
    'historypedidos.html': 'history-btn',
    'orders.html':'pedido-client-btn',
    'comandas.html':'comanda-btn',
    'ordersTakeOut.html':'pedido-takeout-btn',
    'order-admin.html':'pedido-admin-btn',
    'reservation.html':'reserva-btn',
    'reservationhistorico.html':'reserva-hist-btn',
    'label-page.html':'label-btn',
};
document.getElementById('logout-btn').addEventListener('click',()=>{
  window.localStorage.removeItem('token');
  window.location.href = '../index.html';
})
document.addEventListener('DOMContentLoaded', function() {
    const navButtons = document.querySelectorAll('.header-btn');
    // ページ読み込み時に現在のページに対応するボタンをハイライトする
    const currentPage = window.location.pathname.split('/').pop();
    const correspondingButtonId = pageToButtonMap[currentPage];
    if (correspondingButtonId) {
        // document.getElementById(correspondingButtonId).classList.add('active');
    }
    // ボタンのクリックイベントを設定
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // すべてのボタンからactiveクラスを削除
            navButtons.forEach(btn => btn.classList.remove('active'));
            // クリックされたボタンにactiveクラスを追加
            this.classList.add('active');
            // 対応するページに遷移
            const buttonId = this.id;
            const targetPage = Object.keys(pageToButtonMap).find(page => pageToButtonMap[page] === buttonId);
            if (targetPage) {
                window.location.href = targetPage;
            }
        });
    });
});
function getJapanDate() {
    // 現在のUTC時間を取得
    const now = new Date();
    // 日本標準時 (JST) はUTC+9時間
    const jstOffset = 9 * 60; // 9時間 * 60分 = 540分
    // 日本時間のタイムスタンプを計算
    const japanTime = new Date(now.getTime() + jstOffset * 60 * 1000);
    // 年、月、日を取得
    const year = japanTime.getUTCFullYear();
    const month = (japanTime.getUTCMonth() + 1).toString().padStart(2, '0'); // 月は0から始まるので+1
    const day = japanTime.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
