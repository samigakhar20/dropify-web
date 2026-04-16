// --- 1. MARKETPLACE PRODUCTS LOAD KARNA ---
function loadMarketplace() {
    const grid = document.getElementById("market-grid");
    if (!grid) return;

    db.collection("products").onSnapshot((snapshot) => {
        grid.innerHTML = ""; 
        if (snapshot.empty) {
            grid.innerHTML = "<p style='text-align:center;'>Marketplace khali hai. Koi products nahi mile.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const p = doc.data();
            const productId = doc.id;
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
        console.log("Products loaded successfully!");
    });
}

// --- 2. POPUP MEIN DETAILS DIKHANA ---
function showMarketDetails(id, p) {
    // Check if elements exist before setting values
    if(document.getElementById("mName")) document.getElementById("mName").innerText = p.name;
    if(document.getElementById("mPrice")) document.getElementById("mPrice").innerText = p.price;
    
    // Order button handling
    const orderBtn = document.getElementById("orderBtn");
    if(orderBtn) {
        orderBtn.onclick = () => placeOrder(id, p);
    }
    
    document.getElementById("retailerDetailsModal").style.display = "block";
}

// --- 3. ORDER PLACE KARNA (Fixed Syntax) ---
async function placeOrder(productId, p) {
    const retailerId = auth.currentUser.uid;
    const orderBtn = document.getElementById("orderBtn");

    const cName = document.getElementById("custName").value;
    const cPhone = document.getElementById("custPhone").value;
    const cAddress = document.getElementById("custAddress").value;

    if(!cName || !cPhone || !cAddress) {
        alert("Please fill all fields!");
        return;
    }

    // Button UI Update
    orderBtn.innerText = "Processing...";
    orderBtn.disabled = true;

    try {
        await db.collection("orders").add({
            productId: productId,
            productName: p.name,
            productImage: p.imageUrl,
            amount: Number(p.price),
            supplierId: p.supplierId, 
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
    } finally {
        if(orderBtn) {
            orderBtn.innerText = "Confirm & Place Order";
            orderBtn.disabled = false;
        }
    }
}

function closeRetailerModal() {
    document.getElementById("retailerDetailsModal").style.display = "none";
}

// --- 4. AUTH STATUS & INITIALIZATION ---
auth.onAuthStateChanged((user) => {
    if (user) {
        loadMarketplace();
    } else {
        window.location.href = "login.html";
    }
});

// Search Logic
const searchBar = document.getElementById("marketSearch");
if(searchBar) {
    searchBar.addEventListener("keyup", function() {
        let value = this.value.toLowerCase();
        let cards = document.querySelectorAll(".product-card");

        cards.forEach(card => {
            let name = card.querySelector("h4").innerText.toLowerCase();
            card.style.display = name.includes(value) ? "" : "none";
        });
    });
}
