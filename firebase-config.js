const firebaseConfig = {
    apiKey: "AIzaSyB6qerNsyshgEjQlpTn5QOW_tCfpah7fIo",
    authDomain: "itikaf-63482.firebaseapp.com",
    databaseURL: "https://itikaf-63482-default-rtdb.firebaseio.com",
    projectId: "itikaf-63482",
    storageBucket: "itikaf-63482.appspot.com",
    messagingSenderId: "452451341170",
    appId: "1:452451341170:web:885f58e689b16bf03b43eb"
    
};

firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();
const database = firebase.database(); // Ubah firestore ke database