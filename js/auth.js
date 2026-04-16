// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDAu0KrxIulI_ZPzx8rCVa_GAJgx3b3bc",
  authDomain: "dropify-caa0c.firebaseapp.com",
  projectId: "dropify-caa0c",
  storageBucket: "dropify-caa0c.firebasestorage.app",
  messagingSenderId: "123386844268",
  appId: "1:123386844268:web:2478356a8566ed499b3449",
  measurementId: "G-HET1M48B2E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firebase (Using Compat Version for your HTML setup)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- RETAILER REGISTRATION ---
function registerRetailer() {
    const name = document.getElementById('retailerName').value;
    const email = document.getElementById('retailerEmail').value;
    const password = document.getElementById('retailerPassword').value;

    if(!name || !email || !password) { alert("Please fill all fields"); return; }

    auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        return db.collection("users").doc(userCredential.user.uid).set({
            fullName: name,
            email: email,
            role: "retailer",
            createdAt: new Date()
        });
    })
    .then(() => {
        alert("Retailer Registered Successfully!");
        window.location.href = "login.html";
    })
    .catch((error) => { alert(error.message); });
}

// --- SUPPLIER REGISTRATION ---
function registerSupplier() {
    const name = document.getElementById('supplierName').value;
    const email = document.getElementById('supplierEmail').value;
    const password = document.getElementById('supplierPassword').value;

    if(!name || !email || !password) { alert("Please fill all fields"); return; }

    auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
        return db.collection("users").doc(userCredential.user.uid).set({
            fullName: name,
            email: email,
            role: "supplier",
            createdAt: new Date()
        });
    })
    .then(() => {
        alert("Supplier Registered Successfully!");
        window.location.href = "login.html";
    })
    .catch((error) => { alert(error.message); });
}

// --- LOGIN LOGIC ---
function loginUser() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        return db.collection("users").doc(userCredential.user.uid).get();
    })
    .then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            localStorage.setItem("userRole", userData.role);
            if(userData.role === "supplier") {
                window.location.href = "supplier-dashboard.html";
            } else {
                window.location.href = "retailer-dashboard.html";
            }
        }
    })
    .catch((error) => { alert(error.message); });
}
