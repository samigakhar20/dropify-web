// --- 1. MARKETPLACE PRODUCTS LOAD KARNA ---
function loadMarketplace() {
    // Search Input Listener
document.getElementById("marketSearch").addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const productCards = document.querySelectorAll(".product-card");

    productCards.forEach(card => {
        // Product name h4 tag mein hai
        const productName = card.querySelector("h4").innerText.toLowerCase();
        
        if (productName.includes(searchTerm)) {
            card.style.display = "block"; // Show match
        } else {
            card.style.display = "none"; // Hide others
        }
    });
});
    
    const grid = document.getElementById("market-grid");
    if (!grid) return;

    db.collection("products").onSnapshot((snapshot) => {
        grid.innerHTML = ""; 
        if (snapshot.empty) {
            grid.innerHTML = "<p style='text-align:center;'>Marketplace khali hai.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const p = doc.data();
            const productId = doc.id;
            const productData = JSON.stringify(p).replace(/'/g, "&apos;");

            const card = `
    <div class="product-card">
        <img src="${p.imageUrl}" style="width: 100%; height: 160px; object-fit: cover;">
        <h4>${p.name}</h4>
        <p>PKR ${p.price}</p>
        <div style="display: flex; gap: 5px;">
<button onclick='viewProductDetails("${productId}", ${productData})' style="flex:1; background:#6c757d; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">View</button>
            <button onclick='showMarketDetails("${productId}", ${productData})' style="flex:1; background:#28a745;">Order</button>
        </div>
    </div>
`;
            grid.innerHTML += card;
        });
        console.log("Products loaded successfully!");
    }, (error) => {
        console.error("Firestore Error:", error);
    });
}
// Product Details Modal dikhane ke liye
function viewProductDetails(productId, p) {
    document.getElementById("viewPName").innerText = p.name;
    document.getElementById("viewPImage").src = p.imageUrl;
    document.getElementById("viewPDesc").innerText = p.description || "No description available.";
    document.getElementById("viewPPrice").innerText = p.price;

    // View modal ke andar "Order Now" button ko functional banayein
    const viewOrderBtn = document.getElementById("viewOrderBtn");
    viewOrderBtn.onclick = () => {
        closeProductModal(); // View modal band karein
        showMarketDetails(productId, p); // Order modal kholein
    };

    document.getElementById("productViewModal").style.display = "block";
}

// View Modal band karne ke liye
function closeProductModal() {
    document.getElementById("productViewModal").style.display = "none";
}
// Global variable taake placeOrder ko product ka data mil sakay
let currentProduct = null;

// --- 2. POPUP MEIN DETAILS DIKHANA ---
function showMarketDetails(id, p) {
    // Ye line lazmi hai! Product ka sara data save karne ke liye
    currentProduct = { id, ...p };

    document.getElementById("mName").innerText = p.name;
    document.getElementById("mBasePrice").innerText = p.price; 
    
    // Quantity ko default 1 par set karein
    document.getElementById("orderQuantity").value = 1;
    
    // Selling price mein supplier ki price bhar dein
    document.getElementById("retailerPrice").value = p.price;

    const orderBtn = document.getElementById("orderBtn");
    // Sirf function ka naam likhein, (id, p) mat bhejain
    orderBtn.onclick = placeOrder; 
    
    document.getElementById("retailerDetailsModal").style.display = "block";
}

// --- ORDER PLACE KARNA ---
async function placeOrder() {
    // Agar currentProduct khali hai to order nahi hoga
    if (!currentProduct) {
        alert("Product data missing!");
        return;
    }

    const qtyInput = document.getElementById("orderQuantity");
    const sellingPriceInput = document.getElementById("retailerPrice");
    const customerNameInput = document.getElementById("custName");
    const orderBtn = document.getElementById("orderBtn");

    const qty = Number(qtyInput.value) || 1;
    const sellingPrice = Number(sellingPriceInput.value);
    const customerName = customerNameInput.value;
    
    if (!sellingPrice || !customerName || qty < 1) {
        alert("Please fill all details and valid quantity!");
        return;
    }

    orderBtn.innerText = "Placing Order...";
    orderBtn.disabled = true;

    const orderData = {
        productId: currentProduct.id,
        productName: currentProduct.name,
        supplierId: currentProduct.supplierId,
        supplierBasePrice: Number(currentProduct.price), // 1000
        quantity: qty,                                   // Nayi field jo humne add ki
        amount: sellingPrice * qty,                      // Total amount
        customerName: customerName,
        customerPhone: document.getElementById("custPhone").value,
        customerAddress: document.getElementById("custAddress").value,
        retailerId: auth.currentUser.uid,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection("orders").add(orderData);
        alert("Order Placed Successfully!");
        closeRetailerModal();
    } catch (error) {
        console.error("Order Error:", error);
        alert("Error: " + error.message);
    } finally {
        orderBtn.innerText = "Confirm Order";
        orderBtn.disabled = false;
    }
}
// --- 4. AUTH INITIALIZATION ---
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Retailer Logged In:", user.uid);
        
        // Ye 3 functions lazmi call hone chahiye
        loadMarketplace();
        loadDashboardStats(user.uid); 
        loadMyOrders(user.uid);
        
    } else {
        window.location.href = "login.html";
    }
});

// --- 1. DASHBOARD STATS LOAD KARNA ---
function loadDashboardStats(retailerId) {
    db.collection("orders").where("retailerId", "==", retailerId)
      .onSnapshot((snapshot) => {
          let total = snapshot.size;
          let revenue = 0;
          let active = 0;

          snapshot.forEach(doc => {
              const data = doc.data();
              revenue += Number(data.amount || 0);
              if(data.status === "pending" || data.status === "processing") {
                  active++;
              }
          });

          // UI update karna
          document.getElementById("stat-total-orders").innerText = total;
          document.getElementById("stat-active-orders").innerText = active;
          document.getElementById("stat-total-revenue").innerText = "PKR " + revenue;
      });
}

// --- 2. MY ORDERS TABLE LOAD KARNA (FIXED) ---
function loadMyOrders(retailerId) {
    const orderList = document.getElementById("order-list");
    if (!orderList) return;

    db.collection("orders")
      .where("retailerId", "==", retailerId)
      .orderBy("createdAt", "desc") 
      .onSnapshot((snapshot) => {
          orderList.innerHTML = "";
          
          if (snapshot.empty) {
              orderList.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:20px;'>Abhi tak koi order nahi hai.</td></tr>";
              return;
          }

          snapshot.forEach((doc) => {
              const data = doc.data(); // Yahan 'res' ki jagah 'data' kar diya hai
              const orderId = doc.id;
              
              // Stringify handle karne ke liye taake details modal sahi khule
              const orderDataStr = JSON.stringify(data).replace(/'/g, "&apos;");

              const row = `
                <tr onclick='showOrderDetails("${orderId}", ${orderDataStr})' style="cursor:pointer;">
                    <td><strong>${data.productName}</strong><br><small>ID: ${orderId.substring(0,8)}...</small></td>
                    <td>${data.customerName}</td>
                    <td>PKR ${data.amount}</td>
                    <td><span class="status-badge" style="background:#d4edda; color:#155724; padding:4px 8px; border-radius:4px;">${data.status}</span></td>
                </tr>
              `;
              orderList.innerHTML += row;
          });
      }, (error) => {
          console.error("Orders Load Error: ", error);
      });
}

function showOrderDetails(orderId, data) {
    // Modal ke elements mein data bharna
    document.getElementById("detId").innerText = orderId;
    document.getElementById("detName").innerText = data.customerName;
    document.getElementById("detPhone").innerText = data.customerPhone || "N/A";
    document.getElementById("detAddress").innerText = data.customerAddress || "No Address Provided";
    document.getElementById("detProduct").innerText = data.productName;
    document.getElementById("detAmount").innerText = data.amount;
    document.getElementById("detStatus").innerText = data.status;

    // Modal dikhao
    document.getElementById("orderDetailsModal").style.display = "block";
}

// Modal band karne ka function
function closeOrderModal() {
    document.getElementById("orderDetailsModal").style.display = "none";
}
