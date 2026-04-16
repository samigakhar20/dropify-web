// --- 1. MARKETPLACE PRODUCTS LOAD KARNA ---
function loadMarketplace() {
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
            <button onclick='viewProductDetails(${productData})' style="flex:1; background:#6c757d;">View</button>
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
// --- 2. POPUP MEIN DETAILS DIKHANA ---
function showMarketDetails(id, p) {
    document.getElementById("mName").innerText = p.name;
    
    // Base price ko sirf reference ke liye dikhayen
    document.getElementById("mBasePrice").innerText = p.price; 
    
    // Input field mein default wahi price bhar dein jo supplier ki hai (Retailer isay edit karega)
    document.getElementById("custPrice").value = p.price;

    const orderBtn = document.getElementById("orderBtn");
    orderBtn.onclick = () => placeOrder(id, p);
    
    document.getElementById("retailerDetailsModal").style.display = "block";
}

function showOrderDetails(orderId, data) {
    document.getElementById("detId").innerText = orderId;
    document.getElementById("detName").innerText = data.customerName;
    document.getElementById("detPhone").innerText = data.customerPhone;
    document.getElementById("detAddress").innerText = data.customerAddress;
    document.getElementById("detProduct").innerText = data.productName;
    document.getElementById("detAmount").innerText = data.amount;
    document.getElementById("orderDetailsModal").style.display = "block";
}

// --- ORDER PLACE KARNA ---
async function placeOrder(productId, p) {
    const retailerId = auth.currentUser.uid;
    const orderBtn = document.getElementById("orderBtn");

    const cName = document.getElementById("custName").value;
    const cPhone = document.getElementById("custPhone").value;
    const cAddress = document.getElementById("custAddress").value;
    const sellingPrice = document.getElementById("custPrice").value; // Retailer ki apni price

    if(!cName || !cPhone || !cAddress || !sellingPrice) {
        alert("Please fill all fields!");
        return;
    }

    // Profit calculation (optional: sirf console mein dekhne ke liye)
    const profit = Number(sellingPrice) - Number(p.price);
    console.log("Your Profit on this order: PKR " + profit);

    orderBtn.innerText = "Processing...";
    orderBtn.disabled = true;

    try {
        await db.collection("orders").add({
            productId: productId,
            productName: p.name,
            productImage: p.imageUrl,
            
            // YAHAN TABDEELI HAI: Supplier ki price ki jagah Retailer ki selling price save hogi
            amount: Number(sellingPrice), 
            supplierBasePrice: Number(p.price), // Future reference ke liye supplier ki original price bhi save kar len
            
            supplierId: p.supplierId, 
            retailerId: retailerId,
            customerName: cName,
            customerPhone: cPhone,
            customerAddress: cAddress,
            status: "pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Order Placed Successfully at PKR " + sellingPrice);
        closeRetailerModal();
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        orderBtn.innerText = "Confirm & Place Order";
        orderBtn.disabled = false;
    }
}
function closeRetailerModal() {
    const modal = document.getElementById("retailerDetailsModal");
    if (modal) {
        modal.style.display = "none";
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

// --- 2. MY ORDERS TABLE LOAD KARNA ---
function loadMyOrders(retailerId) {
    const orderList = document.getElementById("order-list");
    if (!orderList) return;

    db.collection("orders")
      .where("retailerId", "==", retailerId)
      .orderBy("createdAt", "desc") // Naya order sab se upar
      .onSnapshot((snapshot) => {
          orderList.innerHTML = "";
          
          if (snapshot.empty) {
              orderList.innerHTML = "<tr><td colspan='4' style='text-align:center; padding:20px;'>Abhi tak koi order nahi hai.</td></tr>";
              return;
          }

          snapshot.forEach((doc) => {
              const res = doc.data();
              const row = `
                  <tr style="border-bottom: 1px solid #eee;">
                      <td style="padding:12px;">
                        <strong>${res.productName}</strong><br>
                        <small style="color:#888;">ID: ${doc.id.substring(0,8)}...</small>
                      </td>
                      <td>${res.customerName}</td>
                      <td>PKR ${res.amount}</td>
                      <td>
                        <span class="status-badge ${res.status === 'pending' ? 'status-active' : 'status-delivered'}">
                            ${res.status.toUpperCase()}
                        </span>
                      </td>
                  </tr>
              `;
              orderList.innerHTML += row;
          });
      }, (error) => {
          console.error("Orders Load Error: ", error);
      });
}
