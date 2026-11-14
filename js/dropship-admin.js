// Import Firebase from CDN just like admin.html uses
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase Configuration (Matching Prime Traders Setup)
const firebaseConfig = {
    apiKey: "AIzaSyD-YourAPIKeyHere-Placeholder", // Agar aapke paas config alag file mein hai toh wohi use karein
    authDomain: "prime-traders.firebaseapp.com",
    projectId: "prime-traders",
    storageBucket: "prime-traders.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456:web:abcdef"
};

// Initialize Firebase safely
let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    // Fallback if app is already initialized
    db = getFirestore();
}

const tableBody = document.getElementById('dropshipAdminTableBody');
const totalProductsEl = document.getElementById('adminTotalProducts');

// Central Products Load Karne Ka Function
async function loadCentralProductsForDropship() {
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">Loading Central Products...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        let html = '';
        let count = 0;

        querySnapshot.forEach((docSnap) => {
            count++;
            const data = docSnap.data();
            const id = docSnap.id;

            const mainRate = data.price || data.wholesaleRate || data.wholesalePrice || 0;
            const currentDropshipRate = data.dropshipPrice !== undefined ? data.dropshipPrice : mainRate;
            const imgUrl = (data.images && data.images.length > 0) ? data.images[0] : (data.image || 'logo.png');

            html += `
                <tr style="border-bottom: 1px solid #1f2937;">
                    <td style="padding: 12px;">
                        <img src="${imgUrl}" alt="product" style="width: 45px; height: 45px; object-fit: cover; border-radius: 8px; border: 1px solid #374151;">
                    </td>
                    <td style="padding: 12px;">
                        <div style="font-weight: 700; color: #f8fafc;">${data.title || 'Untitled Product'}</div>
                        <div style="font-size: 12px; color: #94a3b8;">${data.category || 'Uncategorized'}</div>
                    </td>
                    <td style="padding: 12px; color: #cbd5e1; font-weight: 600;">
                        PKR ${mainRate}
                    </td>
                    <td style="padding: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="color: #f59e0b; font-weight: 700;">PKR</span>
                            <input type="number" id="rate-input-${id}" value="${currentDropshipRate}" 
                                style="width: 110px; padding: 7px 10px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #ffffff; font-weight: 700;">
                        </div>
                    </td>
                    <td style="padding: 12px;">
                        <button onclick="updateDropshipRate('${id}')" id="btn-save-${id}"
                            style="background: #f59e0b; color: #0b132b; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 700; cursor: pointer;">
                            Save Rate
                        </button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html || '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No products found in Central Database.</td></tr>';
        if (totalProductsEl) totalProductsEl.innerText = `Total Products: ${count}`;

    } catch (error) {
        console.error("Error loading central products:", error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444; padding:20px;">Database connection error! Console check karein.</td></tr>';
    }
}

// Dropship Price Update Karne Ka Function
window.updateDropshipRate = async function(productId) {
    const inputEl = document.getElementById(`rate-input-${productId}`);
    const btnEl = document.getElementById(`btn-save-${productId}`);
    const newRate = Number(inputEl.value);

    if (isNaN(newRate) || newRate < 0) {
        alert("Please enter a valid amount!");
        return;
    }

    btnEl.innerText = "Saving...";
    btnEl.disabled = true;

    try {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, {
            dropshipPrice: newRate
        });

        btnEl.innerText = "Saved ✓";
        btnEl.style.background = "#10b981";
        btnEl.style.color = "#ffffff";

        setTimeout(() => {
            btnEl.innerText = "Save Rate";
            btnEl.style.background = "#f59e0b";
            btnEl.style.color = "#0b132b";
            btnEl.disabled = false;
        }, 2000);

    } catch (error) {
        console.error("Error updating dropship rate:", error);
        alert("Rate update karne mein masla aaya!");
        btnEl.innerText = "Save Rate";
        btnEl.disabled = false;
    }
};

document.addEventListener('DOMContentLoaded', loadCentralProductsForDropship);
