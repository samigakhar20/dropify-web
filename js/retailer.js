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
                <div class="product-card" style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <img src="${p.imageUrl}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px;">
                    <h4>${p.name}</h4>
                    <p style="color: #28a745; font-weight: bold;">PKR ${p.price}</p>
                    <button onclick='showMarketDetails("${productId}", ${productData})' 
                            style="width: 100%; background: #28a745; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer;">
                        View & Order
                    </button>
                </div>
            `;
            grid.innerHTML += card;
        });
        console.log("Products loaded successfully!");
    }, (error) => {
        console.error("Firestore Error:", error);
    });
}

// --- 2. POPUP MEIN DETAILS DIKHANA ---
function showMarketDetails(id, p) {
    document.getElementById("mName").innerText = p.name;
    document.getElementById("mPrice").innerText = p.price;
    const orderBtn = document.getElementById("orderBtn");
    orderBtn.onclick = () => placeOrder(id, p);
    document.getElementById("retailerDetailsModal").style.display = "block";
}

function closeRetailerModal() {
    document.getElementById("retailerDetailsModal").style.display = "none";
}

// --- 3. ORDER PLACE KARNA ---
async function placeOrder(productId, p) {
    const retailerId = auth.currentUser.uid;
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
            amount: Number(p.price),
            supplierId: p.supplierId, 
            retailerId: retailerId,
            customerName: cName,
            customerPhone: cPhone,
            customerAddress: cAddress,
            status: "pending",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Order Placed!");
        closeRetailerModal();
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// --- 4. AUTH INITIALIZATION ---
auth.onAuthStateChanged((user) => {
    if (user) {
        loadMarketplace();
    } else {
        window.location.href = "login.html";
    }
});
