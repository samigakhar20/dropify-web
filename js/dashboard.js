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

function loadDashboardData(supplierId) {
    // Stats aur Inventory dono ko handle karne ke liye single listener flow
    
    // A. Total Products & Inventory Table
    db.collection("products")
      .where("supplierId", "==", supplierId)
      .onSnapshot((snapshot) => {
          // Update Stats
          document.getElementById("stat-total-products").innerText = snapshot.size;

          // Update Table
          const tableBody = document.getElementById("inventory-body");
          if (tableBody) {
              tableBody.innerHTML = "";
              if (snapshot.empty) {
                  tableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:20px;'>No products found.</td></tr>";
              } else {
                  snapshot.forEach((doc) => {
                      const product = doc.data();
                      const row = `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px;">
                                <img src="${product.imageUrl || 'https://via.placeholder.com/50'}" width="50" height="50" style="border-radius: 5px; object-fit: cover;">
                            </td>
                            <td>${product.name || 'N/A'}</td>
                            <td>${product.category || 'N/A'}</td>
                            <td>PKR ${product.price || 0}</td>
                            <td>${product.stock || 0}</td>
                        </tr>`;
                      tableBody.innerHTML += row;
                  });
              }
          }
      });

    // B. Total & Pending Orders
    db.collection("orders")
      .where("supplierId", "==", supplierId)
      .onSnapshot((snapshot) => {
          document.getElementById("stat-total-orders").innerText = snapshot.size;
          let pending = snapshot.docs.filter(doc => doc.data().status === "pending").length;
          document.getElementById("stat-pending-orders").innerText = pending;
      });
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
