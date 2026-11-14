import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const productsGrid = document.getElementById('dropshipProductsGrid');
const totalItemsBadge = document.getElementById('totalItemsBadge');
const categoryList = document.getElementById('categoryList');

let allProducts = [];

// Public Dropship Products Load Karna
async function fetchDropshipCatalog() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">Loading Dropship Catalog...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = [];

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // Sirf Active products dikhayein
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

// Products ko Grid mein Render Karna
function renderProducts(productsArray) {
    if (totalItemsBadge) {
        totalItemsBadge.innerText = `Total: ${productsArray.length} Items`;
    }

    if (productsArray.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">No products available in this category.</p>';
        return;
    }

    let cardsHTML = '';
    productsArray.forEach(item => {
        // Yahan Dropship Rate priority par uthaya ja raha hai
        const finalPrice = item.dropshipPrice !== undefined ? item.dropshipPrice : (item.price || item.wholesalePrice || 0);
        const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : (item.image || 'logo.png');

        cardsHTML += `
            <div class="product-card">
                <div class="product-img-box">
                    <span class="badge-tag">Dropship Rate</span>
                    <img src="${imgUrl}" alt="${item.title}" onerror="this.src='logo.png'">
                </div>
                <div class="product-info">
                    <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:3px;">
                        ${item.category || 'General'}
                    </div>
                    <div class="product-title">${item.title}</div>
                    <div class="product-desc">${item.description ? item.description.substring(0, 60) + '...' : 'Available for immediate dropshipping.'}</div>
                    
                    <div class="product-footer">
                        <div class="price-row">
                            <div>
                                <span class="price-label">Dropship Price</span>
                                <span class="price-val">PKR ${finalPrice}</span>
                            </div>
                        </div>
                        <div class="card-buttons">
                            <button class="btn-cart-sm" onclick="addToDropshipCart('${item.id}', '${item.title.replace(/'/g, "\\'")}', ${finalPrice})">
                                <i class="fas fa-shopping-cart"></i> Cart
                            </button>
                            <button class="btn-buynow-sm" onclick="buyNowDropship('${item.id}', '${item.title.replace(/'/g, "\\'")}', ${finalPrice})">
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

// Dynamic Category Counts Update Karna
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

// Category Filter Click Listener
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

// Cart & Buy Now Functions (Aap inhein apne order system se link kar sakte hain)
let cartCount = 0;
window.addToDropshipCart = function(id, title, price) {
    cartCount++;
    const badge = document.getElementById('cartCount');
    if (badge) badge.innerText = cartCount;
    alert(`"${title}" (PKR ${price}) Cart mein add ho gaya hai!`);
};

window.buyNowDropship = function(id, title, price) {
    alert(`Direct Order: ${title} - Rate: PKR ${price}`);
    // Yahan checkout modal ya WhatsApp order link open karwa sakte hain
};

document.addEventListener('DOMContentLoaded', fetchDropshipCatalog);
