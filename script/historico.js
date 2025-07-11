const token = window.localStorage.getItem('token');
if (!token) {
   window.location.href = '../index.html';
}
const decodedToken = jwt_decode(token); // jwtDecodeではなくjwt_decodeを使用


let userInfo ={
  id:decodedToken.userId, //クライアントid
  language:decodedToken.language,
  table_count: decodedToken.table_count, // Quantidade de mesas
  iat: 1727826129
}

let clients ={
  id:decodedToken.userId, //クライアントid
  language:decodedToken.language, //クライアント言語
  paytype:'',　//ユーザー支払い方法
  selectedOrder:"",　//選択オーダー
  printInfo:"",　//？？
  taxtType:"",　//税金区分
  registerInfo:"",
  salesInfo:"", //セールデータ
  kubun:decodedToken.role,　//admin or operator
  table_count:decodedToken.table_count,
  takeout_enabled:decodedToken.takeout_enabled,
  uber_enabled:decodedToken.uber_enabled,
  tax_use:decodedToken.tax_enabled,
  invoice_number:decodedToken.invoice_number,
  pendingOrders:null,
  receipt_display_name:decodedToken.receipt_display_name,
  receipt_postal_code:decodedToken.receipt_postal_code,
  receipt_address:decodedToken.receipt_address,
  receipt_tel:decodedToken.receipt_tel,
  tax_type:decodedToken.tax_type,
  regiterCaixa:0

}


document.addEventListener('DOMContentLoaded', () => {
    let allReservations = []; // Armazenar todas as reservas localmente
    const itemsPerPage = 10; // Limite de 10 itens por página
    const maxDateRange = 30; // Limitar o intervalo de dias para evitar sobrecarga

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const endDate = sevenDaysLater.toISOString().split('T')[0];


    let currentLang = localStorage.getItem('loacastrogg') || 'pt';

   function t(key) {
    return translation[currentLang][key] || key;
   }


     function applyTranslation(lang) {
       const elements = document.querySelectorAll('[data-i18n]');
       elements.forEach(el => {
         const key = el.getAttribute('data-i18n');
         const translated = translation[lang][key] || key;

         document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
           const key = el.getAttribute('data-i18n-placeholder');
           el.placeholder = translation[currentLang][key] || key;
         });

         if (el.querySelector('button')) {
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
        currentLang = lang
        applyTranslation(lang);
        if (window.currentItemForDetails) {
       document.querySelectorAll('.item-details').forEach(el => el.remove());
       displayItemDetails(window.currentItemForDetails);
     }
      });

      document.getElementById('language-select').value = currentLang;
      applyTranslation(currentLang);

    const dateInputs = document.querySelectorAll('.date-range input[type="date"]');

    if (dateInputs.length === 2) {
        const startDateInput = dateInputs[0];
        const endDateInput = dateInputs[1];

        startDateInput.value = today;
        endDateInput.value = endDate;

        fetchReservations(today, endDate);

        document.querySelector('.search').addEventListener('click', () => {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;

            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            const timeDiff = Math.abs(endDateObj - startDateObj);
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            if (daysDiff > maxDateRange) {
                alert(`Por favor, selecione um intervalo de no máximo ${maxDateRange} dias.`);
                return;
            }

            fetchReservations(startDate, endDate);
        });
    } else {
        console.error('Os inputs de data não foram encontrados ou são insuficientes.');
    }

    function showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    function hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    function fetchReservations(startDate, endDate) {
        showLoadingPopup();

        const userId = userInfo.id;
        const apiUrl = `${server}/reservations/daterange?startDate=${startDate}&endDate=${endDate}&user_id=${userId}`;
        console.log(apiUrl)

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
              console.log(data)
                hideLoadingPopup();

                if (data.success) {
                    allReservations = data.data; // Armazena todos os dados localmente
                    renderPage(1); // Renderizar a primeira página
                    renderPagination(Math.ceil(allReservations.length / itemsPerPage), 1); // Configurar a paginação
                } else {
                    console.error("Falha ao buscar reservas.");
                }
            })
            .catch(error => {
                hideLoadingPopup();
                console.error('Erro:', error);
            });
    }

    function renderPage(page) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const reservationsToShow = allReservations.slice(start, end);

        renderReservations(reservationsToShow);
    }

    function renderReservations(reservations) {
        const tbody = document.querySelector('.reservation-table tbody');
        tbody.innerHTML = ''; // Limpa a tabela antes de preencher

        reservations
            .sort((a, b) => new Date(a.reservation_date) - new Date(b.reservation_date))
            .forEach(reservation => {
                const reservationDate = new Date(reservation.reservation_date);
                const formattedDate = reservationDate.toLocaleDateString('ja-JP');

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${reservation.id}</td>
                    <td>${formattedDate}</td>
                    <td>${reservation.reservation_name}</td>
                    <td>${reservation.table_number}</td>
                    <td>${reservation.num_people || 'Sem observações'}</td>
                    <td>${reservation.remarks || 'Sem observações'}</td>

                `;
                tbody.appendChild(tr);
            });
    }

    function renderPagination(totalPages, currentPage) {
        const paginationContainer = document.querySelector('.pagination');
        paginationContainer.innerHTML = '';

        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => {
                renderPage(i);
                renderPagination(totalPages, i);
            });

            paginationContainer.appendChild(pageButton);
        }
    }
});
