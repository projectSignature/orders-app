// let accessmainserver = global.urlApi;

let user;
let password;
let errormessage;
let isLoading = false; // Variável para controlar o estado de carregamento

// ネットワーク接続を確認する関数
function checkNetworkStatus() {
  if (!navigator.onLine) {
    alert('Você não está conectado à internet. Verifique sua conexão.');
  }
}

// アプリの起動時にネットワークを確認
window.addEventListener('load', () => {
  checkNetworkStatus();
});

// オンライン・オフラインの切り替えを監視
window.addEventListener('offline', () => {
  alert('Sua conexão foi perdida.');
});

window.addEventListener('online', () => {
  alert('Você está online novamente.');
});

document.getElementById("login-button").addEventListener("click", login_check);
//ログイン情報の確認をする処理、IDが空白かどうか、その後PASSがくうはくかどうか、TRUEの場合Swal処理
async function login_check(user, password) {
  checkNetworkStatus()
  user = document.getElementById("user").value; //ユーザー名
  password = document.getElementById("pass").value; //パスワード
  if (user == "") {
    errormessage = "Enter your username";
    swallopen(errormessage);
  } else {
    if (password == "") {
      errormessage = "Enter your password";
      swallopen(errormessage);
    } else {
      if (!isLoading) { // Verifica se não está carregando
        showLoading(); // Exibe o carregamento
        signin({email: user, password})
      }
    }
  }
}

async function signin(payload) {
  // let urlBase = accessmainserver;
  //let urlBase = 'http://localhost:3000'
  if (window.location.href.includes('/localhost') || window.location.href.includes('http://127.0.0.1:5500')) {
    urlBase = 'http://localhost:3000';
  }

  axios.post(`${server}/noauth/orders/signin`, payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then((response) =>{

    if (response.data.success) {
      const { token } = response.data.info;
      window.localStorage.setItem('token', token);
      hideLoading(); // Oculta o carregamento
      if(response.data.kubun==='operator'){
        window.location.href = './pages/pos.html';
      }else if(response.data.kubun==='dine_in'){
        if(payload.email==='Buonissimo pedidos'){
          window.location.href = './pages/orders.html';
        }else{
          window.location.href = './pages/neworders.html';
        }
        //
      }else if(response.data.kubun==='takeout'){
        window.location.href = './pages/ordersTakeOut.html';
      }else{
        window.location.href = './pages/dashboard.html';
      }
      // window.location.href = './pages/pos.html'; // Redireciona para renda.html
    } else {
      errormessage = "Check username and password";
      document.getElementById("pass").value = "";
      swallopen(errormessage);
      hideLoading(); // Oculta o carregamento
    }
  })
  .catch(error => {
    console.error(error);
    if(error.status===401){
    showModal({
      title: 'Ops...',
      message: 'Usuário não encontrado ou Senha Incorreta',
      type: 'error'
    });
  }else{
    showModal({
      title: 'Ops...',
      message: 'Erro de Autenticação',
      type: 'error'
    });
  }
    hideLoading(); // Oculta o carregamento
  });
}

function swallopen() {
  Swal.fire({
    title: 'Error',
    icon: 'warning',
    showCancelButton: true,
    showConfirmButton: false,
    cancelButtonText: 'back',
    width: 500,
    html: `<span>${errormessage}</span>`,
    customClass: "sweet-alert",
  }).then((result) => {
    if (result.value) {
      Swal.fire({
        icon: "success",
        title: 'concluido',
      });
    }
  });
}

function showLoading() {
  isLoading = true;
  var modal = document.getElementById("loadingModal");
  var span = document.getElementsByClassName("close")[0];
  document.getElementById("modalText").innerText = "Carregando...";
  modal.style.display = "block";
  span.onclick = function() {
    modal.style.display = "none";
  }
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
}

function hideLoading() {
  isLoading = false;
  var modal = document.getElementById("loadingModal");
  modal.style.display = "none";
}
