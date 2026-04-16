// REGISTER SUPPLIER
function registerSupplier() {
    const name = document.getElementById("supplierName").value;
    const email = document.getElementById("supplierEmail").value;
    const password = document.getElementById("supplierPassword").value;

    const supplier = {
        name,
        email,
        password,
        role: "supplier"
    };

    localStorage.setItem("supplierUser", JSON.stringify(supplier));

    alert("Supplier Registered!");
    window.location.href = "supplier-dashboard.html";
}


// REGISTER RETAILER
function registerRetailer() {
    const name = document.getElementById("retailerName").value;
    const email = document.getElementById("retailerEmail").value;
    const password = document.getElementById("retailerPassword").value;

    const retailer = {
        name,
        email,
        password,
        role: "retailer"
    };

    localStorage.setItem("retailerUser", JSON.stringify(retailer));

    alert("Retailer Registered!");
    window.location.href = "retailer-dashboard.html";
}



// LOGIN
function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const supplier = JSON.parse(localStorage.getItem("supplierUser"));
    const retailer = JSON.parse(localStorage.getItem("retailerUser"));

    if (supplier && supplier.email === email && supplier.password === password) {
        localStorage.setItem("loggedIn", "supplier");
        window.location.href = "supplier-dashboard.html";
        return;
    }

    if (retailer && retailer.email === email && retailer.password === password) {
        localStorage.setItem("loggedIn", "retailer");
        window.location.href = "retailer-dashboard.html";
        return;
    }

    alert("Invalid Email or Password");
}