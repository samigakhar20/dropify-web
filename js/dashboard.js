// Dashboard Data Loader
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Supplier Logged In:", user.uid);
        updateDashboardStats(user.uid);
    } else {
        window.location.href = "login.html";
    }
});

function updateDashboardStats(supplierId) {
    // 1. Total Products Count
    db.collection("products")
      .where("supplierId", "==", supplierId)
      .onSnapshot((snapshot) => {
          document.getElementById("stat-total-products").innerText = snapshot.size;
      });

    // 2. Total Orders Count
    db.collection("orders")
      .where("supplierId", "==", supplierId)
      .onSnapshot((snapshot) => {
          document.getElementById("stat-total-orders").innerText = snapshot.size;
          
          // Pending Orders Filter
          let pending = snapshot.docs.filter(doc => doc.data().status === "pending").length;
          document.getElementById("stat-pending-orders").innerText = pending;
      });
}

// Logout Function (Jo humne pehle baat ki thi)
function logout() {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
}
