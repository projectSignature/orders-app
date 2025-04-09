// ネットワーク接続を確認する関数
function checkNetworkStatus() {
  console.log(navigator)
  if (!navigator.onLine) {
    console.log('network offline')
    showModal({
      title: 'Ops...',
      message: 'Você não está conectado à internet. Verifique sua conexão.',
      type: 'error'
    });
  }
}
// アプリの起動時にネットワークを確認
window.addEventListener('load', () => {
  checkNetworkStatus();
});
// オンライン・オフラインの切り替えを監視
window.addEventListener('offline', () => {
  showModal({
    title: 'Ops...',
    message: 'Sua conexão foi perdida.',
    type: 'error'
  });
});
window.addEventListener('online', () => {
  showModal({
    title: 'Ops...',
    message: 'Você está online novamente.',
    type: 'error'
  });
  // alert('Você está online novamente.');
});
