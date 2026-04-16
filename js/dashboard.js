// --- 1. PRODUCT SAVE FUNCTION ---
async function saveProduct() {
    const name = document.getElementById('prodName').value;
    const price = document.getElementById('prodPrice').value;
    const stock = document.getElementById('prodStock').value;
    const category = document.getElementById('prodCategory').value;
    const description = document.getElementById('prodDesc').value;
    const fileInput = document.getElementById('prodImageFile');
    const saveBtn = document.getElementById('saveBtn');

    if (!name || !price || !fileInput.files[0]) {
        alert("Baaji/Bhai, Name, Price aur Image lazmi hain!");
        return;
    }

    saveBtn.innerText = "Uploading...";
    saveBtn.disabled = true;

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
        const base64Image = reader.result;
        try {
            await db.collection("products").add({
                name: name,
                price: Number(price),
                stock: Number(stock),
                category: category,
                description: description,
                imageUrl: base64Image,
                supplierId: auth.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("Product Added Successfully!");
            location.reload(); 
        } catch (error) {
            alert("Error: " + error.message);
            saveBtn.innerText = "Save Product";
            saveBtn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

// --- 2. DATA LOADERS (Stats + Inventory) ---
function loadDashboardData(supplierId) {
    // A. Products Load karna aur Stats update karna
    db.collection("products").where("supplierId", "==", supplierId)
    .onSnapshot((snapshot) => {
        // Stats update
        document.getElementById("stat-total-products").innerText = snapshot.size;
        // loadDashboardData function ke andar orders wala hissa update karein
// loadDashboardData function ke andar snapshot wala part
db.collection("orders").where("supplierId", "==", supplierId)
.onSnapshot((snapshot) => {
    document.getElementById("stat-total-orders").innerText = snapshot.size;
    
    let pendingCount = 0;
    let supplierTotalEarnings = 0;

    snapshot.forEach((doc) => {
        const data = doc.data();
        
        // 1. Pending orders count check
        const currentStatus = (data.status || "").toLowerCase();
        if (currentStatus === "pending") {
            pendingCount++;
        }

        // 2. Earnings Calculation using supplierBasePrice
        // Hum data.supplierBasePrice use karenge jo database mein 1000 hai
        const basePrice = Number(data.supplierBasePrice) || 0;
        
        // Agar aap quantity future mein add karein to yahan multiply kar saktay hain
        // Filhal 1 order = 1 quantity assume ho rahi hai
        supplierTotalEarnings += basePrice;
    });

    // UI update
    document.getElementById("stat-pending-orders").innerText = pendingCount;
    document.getElementById("stat-total-earnings").innerText = "PKR " + supplierTotalEarnings;
});
        // Grid update
        const grid = document.getElementById("products-grid");
        if (grid) {
            grid.innerHTML = ""; 
            if (snapshot.empty) {
                grid.innerHTML = "<p>No products yet.</p>";
            } else {
                snapshot.forEach((doc) => {
                    const p = doc.data();
                    const productData = JSON.stringify(p).replace(/'/g, "&apos;");
                    const card = `
                        <div class="product-card" onclick='showDetails(${productData})' 
                             style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); cursor: pointer;">
                            <img src="${p.imageUrl}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
                            <h4 style="margin: 10px 0 5px 0;">${p.name}</h4>
                            <p style="color: #ff6600; font-weight: bold; margin: 0;">PKR ${p.price}</p>
                            <small>Stock: ${p.stock}</small>
                        </div>`;
                    grid.innerHTML += card;
                });
            }
        }
    });

    // B. Orders Stats update karna
    db.collection("orders").where("supplierId", "==", supplierId)
    .onSnapshot((snapshot) => {
        document.getElementById("stat-total-orders").innerText = snapshot.size;
        let pending = snapshot.docs.filter(doc => doc.data().status === "pending").length;
        document.getElementById("stat-pending-orders").innerText = pending;
    });
}

function showDetails(product) {
    document.getElementById("detImg").src = product.imageUrl;
    document.getElementById("detName").innerText = product.name;
    document.getElementById("detCat").innerText = product.category;
    document.getElementById("detDesc").innerText = product.description || "No description available.";
    document.getElementById("detPrice").innerText = product.price;
    document.getElementById("detStock").innerText = product.stock;
    document.getElementById("detailsModal").style.display = "block";
}

function closeDetailsModal() {
    document.getElementById("detailsModal").style.display = "none";
}

// --- 3. AUTH & INITIALIZATION ---
auth.onAuthStateChanged((user) => {
    if (user) {
        loadDashboardData(user.uid);      // Ye stats aur products load karega
        loadSupplierOrders(user.uid);     // YAHAN YE LINE ADD KAREIN - Ye table load karega
    } else {
        window.location.href = "login.html";
    }
});
function logout() {
    auth.signOut().then(() => { window.location.href = "login.html"; });
}

function loadSupplierOrders(supplierId) {
    const orderList = document.getElementById("supplier-order-list"); // Check karein ye ID table body mein hai ya nahi
    if (!orderList) return;

    // Counting sahi hai, matlab data mojood hai. Ab usey fetch karein:
    db.collection("orders")
      .where("supplierId", "==", supplierId) // Ensure karein ke 'supplierId' exactly wahi hai jo product post karte waqt save hui thi
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
          orderList.innerHTML = "";
          
          if (snapshot.empty) {
              orderList.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No orders found.</td></tr>";
              return;
          }

          snapshot.forEach((doc) => {
              const data = doc.data();
              const orderId = doc.id;

              
const row = `
    <tr onclick='openOrderUpdateModal("${doc.id}", ${JSON.stringify(data)})' style="cursor:pointer;">
        <td style="padding: 10px;">${orderId.substring(0,8)}...</td>
        <td>${data.productName}</td>
        <td>${data.customerName}</td>
        <td>PKR ${data.amount}</td>
        <td><span class="status-badge status-${data.status.replace(/\s+/g, '-').toLowerCase()}">${data.status}</span></td>
    </tr>
`;
              orderList.innerHTML += row;
          });
      }, (error) => {
          console.error("Supplier Orders Error:", error);
      });
}

let currentUpdateOrderId = null;

function openOrderUpdateModal(orderId, orderData) {
    currentUpdateOrderId = orderId;
    
    // Details show karna (Order ID ke saath)
    document.getElementById("orderSummary").innerHTML = `
        <p><b>Order ID:</b> <span style="color: #ff6600; font-family: monospace;">${orderId}</span></p>
        <p><b>Product:</b> ${orderData.productName}</p>
        <p><b>Customer:</b> ${orderData.customerName}</p>
        <p><b>Address:</b> ${orderData.customerAddress}</p>
        <p><b>Phone:</b> ${orderData.customerPhone}</p>
        <p><b>Current Status:</b> <span style="color:#ff6600">${orderData.status}</span></p>
    `;
    
    document.getElementById("newStatus").value = orderData.status;
    document.getElementById("orderUpdateModal").style.display = "block";
}
function closeUpdateModal() {
    document.getElementById("orderUpdateModal").style.display = "none";
}

// Update Button Click Listener
document.getElementById("updateStatusBtn").addEventListener("click", async () => {
    const selectedStatus = document.getElementById("newStatus").value;
    const btn = document.getElementById("updateStatusBtn");

    btn.innerText = "Updating...";
    btn.disabled = true;

    try {
        await db.collection("orders").doc(currentUpdateOrderId).update({
            status: selectedStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert("Status updated to: " + selectedStatus);
        closeUpdateModal();
    } catch (error) {
        alert("Error updating status: " + error.message);
    } finally {
        btn.innerText = "Update Status";
        btn.disabled = false;
    }
});
