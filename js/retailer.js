// --- 1. MARKETPLACE PRODUCTS LOAD KARNA ---
function loadMarketplace() {
    const grid = document.getElementById("market-grid");
    if (!grid) return;

    // "onSnapshot" real-time updates ke liye hai
    db.collection("products").onSnapshot((snapshot) => {
        grid.innerHTML = ""; 
        if (snapshot.empty) {
            grid.innerHTML = "<p style='text-align:center;'>Marketplace khali hai. Koi products nahi mile.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const p = doc.data();
            const productId = doc.id; // Firebase Document ID order ke liye zaroori hai

            // Card Design: JSON.stringify ko clean karne ke liye replace use kiya hai
            const productData = JSON.stringify(p).replace(/'/g, "&apos;");

            const card = `
                <div class="product-card" style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition: 0.3s;">
                    <img src="${p.imageUrl}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px;">
                    <h4 style="margin: 10px 0 5px 0; color: #333;">${p.name}</h4>
                    <p style="color: #28a745; font-weight: bold; margin: 5px 0;">PKR ${p.price}</p>
                    <small style="color: #777; display: block; margin-bottom: 10px;">Stock: ${p.stock}</small>
                    <button onclick='showMarketDetails("${productId}", ${productData})' 
                            style="width: 100%; background: #28a745; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        View & Order
                    </button>
                </div>
            `;
            grid.innerHTML += card;
        });
    });
}

// --- 2. POPUP MEIN DETAILS DIKHANA ---
function showMarketDetails(id, p) {
    document.getElementById("mImg").src = p.imageUrl;
    document.getElementById("mName").innerText = p.name;
    document.getElementById("mDesc").innerText = p.description || "No description provided.";
    document.getElementById("mPrice").innerText = p.price;
    document.getElementById("mStock").innerText = "Stock Available: " + p.stock;
    
    // Order button par naya function attach karna jo is product ko identify kare
    const orderBtn = document.getElementById("orderBtn");
    orderBtn.onclick = () => placeOrder(id, p);
    
    document.getElementById("retailerDetailsModal").style.display = "block";
}

// --- 3. ORDER PLACE KARNA ---
async function placeOrder(productId, p) {
    const retailerId = auth.currentUser.uid;
    
    // Form se values lena
    const cName = document.getElementById("custName").value;
    const cPhone = document.getElementById("custPhone").value;
    const cAddress = document.getElementById("custAddress").value;

    if(!cName || !cPhone || !cAddress) {
        alert("Please fill all fields!");
        return;
    }

    try {
        await db.collection("orders").add({
            productId: productId,
            productName: p.name,
            productImage: p.imageUrl,
            amount: Number(p.price),
            supplierId: p.supplierId, // Ye check karein ke product data mein supplierId mojood ho
            retailerId: retailerId,
            customerName: cName,
            customerPhone: cPhone,
            customerAddress: cAddress,
            status: "pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Order Successfully Placed!");
        closeRetailerModal();
    } catch (error) {
        console.error("Error adding order: ", error);
        alert("Order Failed: " + error.message);
    }
}
    } finally {
        orderBtn.innerText = "Place Order Now";
        orderBtn.disabled = false;
    }
}

function closeRetailerModal() {
    document.getElementById("retailerDetailsModal").style.display = "none";
}

// --- 4. AUTH STATUS & DATA INITIALIZATION ---
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("Retailer Active:", user.uid);
        loadMarketplace();
        // Yahan aap loadOrders(user.uid) bhi add kar sakte hain baad mein
    } else {
        window.location.href = "login.html";
    }
});

function logout() {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
}
