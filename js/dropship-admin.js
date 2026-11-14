import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCRkKoE48FjYIjYfUNFEYzcxNueKUm6YOM",
    authDomain: "prime-traders-f3eec.firebaseapp.com",
    projectId: "prime-traders-f3eec",
    storageBucket: "prime-traders-f3eec.firebasestorage.app",
    messagingSenderId: "499740236001",
    appId: "1:499740236001:web:e623dfe11f6f96df22ffa0",
    measurementId: "G-6CGVKBZFJK"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const tableBody = document.getElementById('dropshipAdminTableBody');
const totalProductsEl = document.getElementById('adminTotalProducts');

function setupTableHeader() {
    const tableHead = document.querySelector('table thead tr');
    if (tableHead) {
        tableHead.innerHTML = `
            <th style="padding: 12px; text-align: left;">IMAGE</th>
            <th style="padding: 12px; text-align: left;">PRODUCT TITLE & CATEGORY</th>
            <th style="padding: 12px; text-align: left;">MAIN RATE</th>
            <th style="padding: 12px; text-align: left; color: #f59e0b;">HHC RATE</th>
            <th style="padding: 12px; text-align: left; color: #38bdf8;">OSHI RATE</th>
            <th style="padding: 12px; text-align: left; color: #10b981;">MARKAZ RATE</th>
            <th style="padding: 12px; text-align: left; color: #c084fc;">PRIME RATE</th>
            <th style="padding: 12px; text-align: left;">ACTION</th>
        `;
    }
}

async function loadCentralProductsForDropship() {
    if (!tableBody) return;
    setupTableHeader();
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#94a3b8;">Loading Central Products...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        let html = '';
        let count = 0;

        querySnapshot.forEach((docSnap) => {
            count++;
            const data = docSnap.data();
            const id = docSnap.id;

            const mainRate = data.price || data.wholesaleRate || data.wholesalePrice || 0;
            const hhcVal = data.hhcPrice !== undefined ? data.hhcPrice : mainRate;
            const oshiVal = data.oshiPrice !== undefined ? data.oshiPrice : mainRate;
            const markazVal = data.markazPrice !== undefined ? data.markazPrice : mainRate;
            const primeVal = data.primePrice !== undefined ? data.primePrice : mainRate;
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
                        <input type="number" id="hhc-input-${id}" value="${hhcVal}" 
                            style="width: 75px; padding: 6px 6px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #f59e0b; font-weight: 700;">
                    </td>
                    <td style="padding: 12px;">
                        <input type="number" id="oshi-input-${id}" value="${oshiVal}" 
                            style="width: 75px; padding: 6px 6px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #38bdf8; font-weight: 700;">
                    </td>
                    <td style="padding: 12px;">
                        <input type="number" id="markaz-input-${id}" value="${markazVal}" 
                            style="width: 75px; padding: 6px 6px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #10b981; font-weight: 700;">
                    </td>
                    <td style="padding: 12px;">
                        <input type="number" id="prime-input-${id}" value="${primeVal}" 
                            style="width: 75px; padding: 6px 6px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #c084fc; font-weight: 700;">
                    </td>
                    <td style="padding: 12px;">
                        <button onclick="updateDropshipRates('${id}')" id="btn-save-${id}"
                            style="background: #f59e0b; color: #0b132b; border: none; padding: 8px 12px; border-radius: 6px; font-weight: 700; cursor: pointer;">
                            Save Rates
                        </button>
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html || '<tr><td colspan="8" style="text-align:center; padding:20px; color:#94a3b8;">No products found in Central Database.</td></tr>';
        if (totalProductsEl) totalProductsEl.innerText = `Total Products: ${count}`;

    } catch (error) {
        console.error("Error loading central products:", error);
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#ef4444; padding:20px;">Error: ${error.message}</td></tr>`;
    }
}

window.updateDropshipRates = async function(productId) {
    const hhcInput = document.getElementById(`hhc-input-${productId}`);
    const oshiInput = document.getElementById(`oshi-input-${productId}`);
    const markazInput = document.getElementById(`markaz-input-${productId}`);
    const primeInput = document.getElementById(`prime-input-${productId}`);
    const btnEl = document.getElementById(`btn-save-${productId}`);

    const hhcPrice = Number(hhcInput.value);
    const oshiPrice = Number(oshiInput.value);
    const markazPrice = Number(markazInput.value);
    const primePrice = Number(primeInput.value);

    if (isNaN(hhcPrice) || isNaN(oshiPrice) || isNaN(markazPrice) || isNaN(primePrice)) {
        alert("Please enter valid amounts for all rates!");
        return;
    }

    btnEl.innerText = "Saving...";
    btnEl.disabled = true;

    try {
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, {
            hhcPrice: hhcPrice,
            oshiPrice: oshiPrice,
            markazPrice: markazPrice,
            primePrice: primePrice
        });

        btnEl.innerText = "Saved ✓";
        btnEl.style.background = "#10b981";
        btnEl.style.color = "#ffffff";

        setTimeout(() => {
            btnEl.innerText = "Save Rates";
            btnEl.style.background = "#f59e0b";
            btnEl.style.color = "#0b132b";
            btnEl.disabled = false;
        }, 2000);

    } catch (error) {
        console.error("Error updating dropship rates:", error);
        alert("Rates update karne mein masla aaya!");
        btnEl.innerText = "Save Rates";
        btnEl.disabled = false;
    }
};

document.addEventListener('DOMContentLoaded', loadCentralProductsForDropship);
