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
        alert("Please fill Name, Price and select an Image!");
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
            // Modal band karne ke liye agar function hai, warna reload
            location.reload(); 
        } catch (error) {
            alert("Error: " + error.message);
            saveBtn.innerText = "Save Product";
            saveBtn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

// --- 2. DATA LOADERS ---

function loadInventory(supplierId) {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    db.collection("products").where("supplierId", "==", supplierId)
    .onSnapshot((snapshot) => {
        grid.innerHTML = ""; 
        if (snapshot.empty) {
            grid.innerHTML = "<p>No products yet.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const p = doc.data();
            // Card design
            const card = `
                <div class="product-card" onclick='showDetails(${JSON.stringify(p)})' 
                     style="background: white; border-radius: 12px; padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); cursor: pointer; transition: 0.3s;">
                    <img src="${p.imageUrl}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
                    <h4 style="margin: 10px 0 5px 0; color: #333;">${p.name}</h4>
                    <p style="color: #ff6600; font-weight: bold; margin: 0;">PKR ${p.price}</p>
                    <small style="color: #777;">Stock: ${p.stock}</small>
                </div>
            `;
            grid.innerHTML += card;
        });
    });
}

// Click karne par details dikhane ka function
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
        console.log("Supplier Logged In:", user.uid);
        loadDashboardData(user.uid); // Ek hi function sab load kar dega
    } else {
        window.location.href = "login.html";
    }
});

function logout() {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
}
