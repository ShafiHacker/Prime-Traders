import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCRkKoE48FjYIjYfUNFEYzcxNueKUm6YOM",
    authDomain: "prime-traders-f3eec.firebaseapp.com",
    projectId: "prime-traders-f3eec",
    storageBucket: "prime-traders-f3eec.firebasestorage.app",
    messagingSenderId: "499740236001",
    appId: "1:499740236001:web:e623dfe11f6f96df22ffa0",
    measurementId: "G-6CGVKBZFJK"
};

let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    db = getFirestore();
}

const productsGrid = document.getElementById('dropshipProductsGrid');
const totalItemsBadge = document.getElementById('totalItemsBadge');
const categoryList = document.getElementById('categoryList');

let allProducts = [];

async function fetchDropshipCatalog() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">Loading Dropship Catalog...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = [];

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.status !== 'Inactive') {
                allProducts.push({ id: docSnap.id, ...data });
            }
        });

        renderProducts(allProducts);
        updateCategoryCounts(allProducts);

    } catch (error) {
        console.error("Error fetching dropship products:", error);
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#ef4444;">Failed to load products.</p>';
    }
}

function renderProducts(productsArray) {
    if (totalItemsBadge) {
        totalItemsBadge.innerText = `Total: ${productsArray.length} Items`;
    }

    if (productsArray.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">No products available.</p>';
        return;
    }

    let cardsHTML = '';
    productsArray.forEach(item => {
        const mainRate = item.price || item.wholesaleRate || item.wholesalePrice || 0;
        const hhcVal = item.hhcPrice !== undefined ? item.hhcPrice : mainRate;
        const oshiVal = item.oshiPrice !== undefined ? item.oshiPrice : mainRate;
        const markazVal = item.markazPrice !== undefined ? item.markazPrice : mainRate;
        const primeVal = item.primePrice !== undefined ? item.primePrice : mainRate;

        const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : (item.image || 'logo.png');
        const safeTitle = (item.title || 'Product').replace(/'/g, "\\'");

        cardsHTML += `
            <div class="product-card">
                <div class="product-img-box">
                    <span class="badge-tag">Wholesale</span>
                    <img src="${imgUrl}" alt="${item.title}" onerror="this.src='logo.png'">
                </div>
                <div class="product-info">
                    <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:3px;">
                        ${item.category || 'General'}
                    </div>
                    <div class="product-title">${item.title || 'Untitled'}</div>
                    
                    <!-- 3 Platform Rates Box -->
                    <div style="background: #0f172a; padding: 8px; border-radius: 8px; margin: 8px 0; border: 1px solid #1e293b; font-size: 11px;">
                        <div style="display: flex; justify-content: space-between; color: #94a3b8; padding: 2px 0;">
                            <span>HHC Dropshipping:</span> <strong style="color: #f59e0b;">PKR ${hhcVal}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #94a3b8; padding: 2px 0;">
                            <span>Oshi Dropshipping:</span> <strong style="color: #38bdf8;">PKR ${oshiVal}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; color: #94a3b8; padding: 2px 0;">
                            <span>Markaz Dropshipping:</span> <strong style="color: #10b981;">PKR ${markazVal}</strong>
                        </div>
                    </div>

                    <!-- PRIME RATE right above the Cart button -->
                    <div style="background: #2e1065; padding: 8px 10px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #7c3aed; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                        <span style="color: #e9d5ff; font-weight: 700;">PRIME RATE:</span>
                        <strong style="color: #c084fc; font-size: 14px;">PKR ${primeVal}</strong>
                    </div>
                    
                    <div class="product-footer">
                        <div class="card-buttons" style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <button class="btn-cart-sm" onclick="addToDropshipCart('${item.id}', '${safeTitle}', ${primeVal})">
                                <i class="fas fa-shopping-cart"></i> Cart
                            </button>
                            <button class="btn-buynow-sm" onclick="buyNowDropship('${item.id}', '${safeTitle}', ${primeVal})">
                                <i class="fas fa-bolt"></i> Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    productsGrid.innerHTML = cardsHTML;
}

function updateCategoryCounts(products) {
    const countAllEl = document.getElementById('count-all');
    if (countAllEl) countAllEl.innerText = products.length;

    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(li => {
        const catName = li.getAttribute('data-category');
        if (catName && catName !== 'all') {
            const count = products.filter(p => p.category === catName).length;
            const badge = li.querySelector('.cat-count');
            if (badge) badge.innerText = count;
        }
    });
}

if (categoryList) {
    categoryList.addEventListener('click', (e) => {
        const item = e.target.closest('.category-item');
        if (!item) return;

        document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        const selectedCat = item.getAttribute('data-category');
        if (selectedCat === 'all') {
            renderProducts(allProducts);
        } else {
            const filtered = allProducts.filter(p => p.category === selectedCat);
            renderProducts(filtered);
        }
    });
}

let cartCount = 0;
window.addToDropshipCart = function(id, title, price) {
    cartCount++;
    const badge = document.getElementById('cartCount');
    if (badge) badge.innerText = cartCount;
    alert(`"${title}" (PKR ${price}) Cart mein add ho gaya hai!`);
};

window.buyNowDropship = function(id, title, price) {
    alert(`Direct Order: ${title} - Rate: PKR ${price}`);
};

document.addEventListener('DOMContentLoaded', fetchDropshipCatalog);
