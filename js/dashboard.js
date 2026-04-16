async function saveProduct() {
    const name = document.getElementById('prodName').value;
    const price = document.getElementById('prodPrice').value;
    const stock = document.getElementById('prodStock').value;
    const category = document.getElementById('prodCategory').value;
    const description = document.getElementById('prodDesc').value;
    const imageFile = document.getElementById('prodImageFile').files[0];
    const saveBtn = document.getElementById('saveBtn');

    if (!name || !price || !imageFile) {
        alert("Please fill Name, Price and select an Image!");
        return;
    }

    saveBtn.innerText = "Uploading...";
    saveBtn.disabled = true;

    // Image ko Text (Base64) mein convert karne ka tareeka
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    
    reader.onload = async () => {
        const base64Image = reader.result;

        try {
            await db.collection("products").add({
                name: name,
                price: Number(price),
                stock: Number(stock),
                category: category,
                description: description,
                imageUrl: base64Image, // Ab ye asali image data save hoga
                supplierId: auth.currentUser.uid,
                createdAt: new Date()
            });

            alert("Product Added Successfully!");
            location.reload(); // Page refresh taake stats update ho jayein
        } catch (error) {
            alert("Error: " + error.message);
            saveBtn.innerText = "Save Product";
            saveBtn.disabled = false;
        }
    };
}


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
// Dashboard Stats Load karne ka function
function loadDashboardStats(supplierId) {
    // Total Products Count
    db.collection("products").where("supplierId", "==", supplierId)
    .onSnapshot((snapshot) => {
        document.getElementById("stat-total-products").innerText = snapshot.size;
        // Jab stats load ho jayein, tabhi inventory table bharein
        loadInventory(supplierId);
    });
}

function loadInventory(supplierId) {
    const tableBody = document.getElementById("inventory-body");
    console.log("Loading inventory for:", supplierId); // Debugging line

    if (!tableBody) return;

    db.collection("products")
    .where("supplierId", "==", supplierId)
    .onSnapshot((snapshot) => {
        tableBody.innerHTML = ""; 
        console.log("Products found:", snapshot.size); // Check karein kitne products mile

        if (snapshot.empty) {
            tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'>No products found in your inventory.</td></tr>";
            return;
        }

        snapshot.forEach((doc) => {
            const product = doc.data();
            // Firestore mein 'imageUrl' (U capital) hai toh wahi use karein
            const imgPath = product.imageUrl || 'https://via.placeholder.com/50';
            
            const row = `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px;">
                        <img src="${imgPath}" width="50" height="50" style="border-radius: 5px; object-fit: cover;">
                    </td>
                    <td>${product.name || 'No Name'}</td>
                    <td>${product.category || 'N/A'}</td>
                    <td>PKR ${product.price || 0}</td>
                    <td>${product.stock || 0}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }, (error) => {
        console.error("Error loading inventory:", error);
    });
}
