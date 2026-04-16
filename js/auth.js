// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAs7...", // Aapke screenshot wala poora code yahan automatic link ho jayega
  authDomain: "dropify-web-7bc63.firebaseapp.com",
  projectId: "dropify-web-7bc63",
  storageBucket: "dropify-web-7bc63.firebasestorage.app",
  messagingSenderId: "305118744574",
  appId: "1:305118744574:web:e061737e96e594b2f29339"
};

// Initialize Firebase
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
        // Data Firestore mein save karein
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
        // Check user role from Firestore
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
