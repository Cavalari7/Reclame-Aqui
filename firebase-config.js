// Importa funções do SDK Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; // opcional

// Configuração do seu projeto (copiada do Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDc9xtp-kvgKIK4fwKOGxzbX6CgrAbxpH4",
  authDomain: "reclame-aqui-cianorte-38734.firebaseapp.com",
  projectId: "reclame-aqui-cianorte-38734",
  storageBucket: "reclame-aqui-cianorte-38734.firebasestorage.app",
  messagingSenderId: "835300956219",
  appId: "1:835300956219:web:3039ed61c372afc133641e",
  measurementId: "G-FQJ9386FD9"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // opcional

export default app;
