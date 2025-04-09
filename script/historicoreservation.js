document.addEventListener('DOMContentLoaded', () => {
    let allReservations = []; // Armazenar todas as reservas localmente
    const itemsPerPage = 10; // Limite de 10 itens por página
    const maxDateRange = 30; // Limitar o intervalo de dias para evitar sobrecarga

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const endDate = sevenDaysLater.toISOString().split('T')[0];

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
            console.log('serchtemae')
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
      console.log('serch')
        showLoading();

        const userId = 1;
        const apiUrl = `${server}/reservations/daterange?startDate=${startDate}&endDate=${endDate}&user_id=${userId}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                hideLoading();
                console.log(data)

                if (data.success) {
                    allReservations = data.data; // Armazena todos os dados localmente
                    renderPage(1); // Renderizar a primeira página
                    renderPagination(Math.ceil(allReservations.length / itemsPerPage), 1); // Configurar a paginação
                } else {
                    console.error("Falha ao buscar reservas.");
                }
            })
            .catch(error => {
                hideLoading();
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
                    <td>${reservation.num_people}</td>
                    <td>${reservation.remarks || t('no_remarks')}</td>
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
