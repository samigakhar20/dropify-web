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
        console.error("Error:", error);
        alert("Order Failed!");
    } finally {
        orderBtn.innerText = "Confirm & Place Order";
        orderBtn.disabled = false;
    }
}
// Baaki loadMarketplace aur Auth functions niche waise hi rahenge
