   const dynamicModal = document.getElementById('dynamicModal');
   const dynamicModalTitle = document.getElementById('dynamicModalTitle');
   const dynamicModalMessage = document.getElementById('dynamicModalMessage');
   const dynamicModalClose = document.getElementById('dynamicModalClose');
   const dynamicModalContent = document.getElementById('dynamicModalContent');

   // モーダルを表示する汎用関数
   function showModal({ title = 'Mensagem', message = 'Conteúdo da mensagem.', type = 'info', buttonText = 'Fechar' }) {
     // メッセージの内容を設定
     dynamicModalTitle.textContent = title;
     dynamicModalMessage.textContent = message;
     dynamicModalClose.textContent = buttonText;

     // 以前のクラスを削除してから、タイプに応じたクラスを追加
     dynamicModalContent.classList.remove('dynamic-modal-success', 'dynamic-modal-error', 'dynamic-modal-warning');
     if (type === 'success') dynamicModalContent.classList.add('dynamic-modal-success');
     if (type === 'error') dynamicModalContent.classList.add('dynamic-modal-error');
     if (type === 'warning') dynamicModalContent.classList.add('dynamic-modal-warning');

     // モーダルを表示
     dynamicModal.style.display = 'flex';
     document.body.classList.add('dynamic-modal-open'); // スクロールを無効化
   }

   // モーダルを閉じる関数
   function closeDynamicModal() {
     dynamicModal.style.display = 'none';
     document.body.classList.remove('dynamic-modal-open'); // スクロールを再度有効化
   }

   // 閉じるボタンが押されたとき
   dynamicModalClose.addEventListener('click', closeDynamicModal);

   // モーダルの外側をクリックして閉じる
   dynamicModal.addEventListener('click', (e) => {
     if (e.target === dynamicModal) closeDynamicModal();
   });
