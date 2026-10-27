// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRkKoE48FjYIjYfUNFEYzcxNueKUm6YOM",
  authDomain: "prime-traders-f3eec.firebaseapp.com",
  projectId: "prime-traders-f3eec",
  storageBucket: "prime-traders-f3eec.firebasestorage.app",
  messagingSenderId: "499740236001",
  appId: "1:499740236001:web:e623dfe11f6f96df22ffa0",
  measurementId: "G-6CGVKBZFJK"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

let currentParcelCount = 1;

// Predefined Karachi Areas Distance List
const karachiAreasData = [
    { sNo: 1, area: "Korangi Industrial Area", km: 5 },
    { sNo: 2, area: "Korangi No. 5", km: 7 },
    { sNo: 3, area: "Landhi", km: 12 },
    { sNo: 4, area: "Shah Faisal Colony", km: 12 },
    { sNo: 5, area: "Malir", km: 16 },
    { sNo: 6, area: "DHA Phase 2", km: 10 },
    { sNo: 7, area: "DHA Phase 5", km: 14 },
    { sNo: 8, area: "Clifton / Boat Basin", km: 17 },
    { sNo: 9, area: "Saddar", km: 18 },
    { sNo: 10, area: "I.I. Chundrigar Road", km: 21 },
    { sNo: 11, area: "PECHS", km: 16 },
    { sNo: 12, area: "Bahadurabad", km: 19 },
    { sNo: 13, area: "Gulshan-e-Iqbal", km: 19 },
    { sNo: 14, area: "Gulistan-e-Johar", km: 20 },
    { sNo: 15, area: "University Road", km: 21 },
    { sNo: 16, area: "NED University", km: 24 },
    { sNo: 17, area: "North Nazimabad", km: 24 },
    { sNo: 18, area: "Nazimabad", km: 22 },
    { sNo: 19, area: "Liaquatabad", km: 21 },
    { sNo: 20, area: "Federal B Area", km: 23 },
    { sNo: 21, area: "New Karachi", km: 29 },
    { sNo: 22, area: "Surjani Town", km: 33 },
    { sNo: 23, area: "Orangi Town", km: 29 },
    { sNo: 24, area: "SITE Area", km: 27 },
    { sNo: 25, area: "Baldia Town", km: 32 },
    { sNo: 26, area: "Keamari", km: 27 },
    { sNo: 27, area: "Manora (to ferry/boat point)", km: 30 },
    { sNo: 28, area: "Port Qasim", km: 24 },
    { sNo: 29, area: "Bahria Town Karachi", km: 43 },
    { sNo: 30, area: "Gadap / Super Highway side", km: 35 }
];

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const path = window.location.pathname;

    if (path.includes('dashboard.html')) {
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          const profilePicImg = document.getElementById('userProfilePic');
          if (profilePicImg) profilePicImg.src = uData.logoUrl || "https://via.placeholder.com/40";
          const nameDisplay = document.getElementById('userNameDisplay');
          if (nameDisplay) nameDisplay.innerText = uData.businessName || uData.name || 'Merchant';
          loadUserDashboard(user.uid);
          loadUserStats(user.uid);
        }
      } catch (e) {
        console.error("Error loading profile:", e);
      }
    }

    if (path.includes('admin.html')) {
      listenToUsersLive();
      loadAdminDashboard();
      loadAdminStats();
      loadLogisticsSettings(); // Load saved DC & Petrol settings on admin panel load
    }

    if (path.includes('rider.html')) {
      loadRiderDashboard();
    }

  } else {
    const path = window.location.pathname;
    if (path.includes('dashboard.html') || path.includes('admin.html') || path.includes('rider.html')) {
      window.location.href = 'login.html';
    }
  }
});

// Admin Section Switcher
function showAdminSection(sectionType) {
  const activeSection = document.getElementById('activeUsersSection');
  const deletedSection = document.getElementById('deletedUsersSection');
  const trackingSection = document.getElementById('trackingSection');
  const wholesellerSection = document.getElementById('wholesellerSection');

  if (activeSection) activeSection.classList.add('hidden');
  if (deletedSection) deletedSection.classList.add('hidden');
  if (trackingSection) trackingSection.classList.add('hidden');
  if (wholesellerSection) wholesellerSection.classList.add('hidden');

  if (sectionType === 'active' && activeSection) activeSection.classList.remove('hidden');
  else if (sectionType === 'deleted' && deletedSection) deletedSection.classList.remove('hidden');
  else if (sectionType === 'tracking' && trackingSection) trackingSection.classList.remove('hidden');
  else if (sectionType === 'wholeseller' && wholesellerSection) {
    wholesellerSection.classList.remove('hidden');
    loadWholesellerOrdersTable();
  }
}

// LIVE Realtime Users Listener (Active Users & Deleted Archive)
function listenToUsersLive() {
  const activeTableBody = document.getElementById('userTableBody');
  const deletedTableBody = document.getElementById('deletedUserTableBody');

  if (!activeTableBody && !deletedTableBody) return;

  db.collection('users').onSnapshot((snapshot) => {
    let activeUsersHtml = '';
    let deletedUsersHtml = '';
    let activeCount = 0;
    let deletedCount = 0;

    snapshot.forEach((doc) => {
      const u = doc.data();
      const uid = doc.id;
      const status = (u.status || 'approved').toLowerCase();
      const role = u.role || 'customer';
      const type = u.accountType || 'business';

      if (status === 'deleted' || status === 'archived') {
        deletedCount++;
        deletedUsersHtml += `
          <tr class="border-b border-slate-700/50 text-xs">
            <td class="p-3">
              <div class="font-bold text-slate-100">${u.name || 'N/A'}</div>
              <div class="text-[10px] text-slate-400">${u.businessName || ''}</div>
            </td>
            <td class="p-3 text-slate-300">${u.email || 'N/A'}</td>
            <td class="p-3 text-slate-400">${type}</td>
            <td class="p-3"><span class="text-rose-400 font-bold uppercase">DELETED</span></td>
            <td class="p-3 text-center">
              <button onclick="restoreUser('${uid}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold transition shadow">Restore</button>
            </td>
          </tr>
        `;
      } else {
        activeCount++;
        const statusColor = status === 'approved' ? 'text-emerald-400' : status === 'rejected' ? 'text-rose-400' : 'text-amber-400';
        
        activeUsersHtml += `
          <tr class="border-b border-slate-700/50 text-xs">
            <td class="p-3">
              <div class="font-bold text-slate-100">${u.name || 'N/A'}</div>
              <div class="text-[10px] text-amber-400">${u.businessName || ''}</div>
            </td>
            <td class="p-3 text-slate-300">${u.email || 'N/A'}</td>
            <td class="p-3 text-slate-400">${type}</td>
            <td class="p-3 text-slate-300 font-medium">${role}</td>
            <td class="p-3"><span class="${statusColor} font-bold uppercase">${status}</span></td>
            <td class="p-3 text-center flex justify-center gap-1.5">
              <button onclick="updateUserStatus('${uid}', 'approved')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold transition shadow">Approve</button>
              <button onclick="updateUserStatus('${uid}', 'rejected')" class="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[10px] font-bold transition shadow">Reject</button>
              <button onclick="updateUserStatus('${uid}', 'deleted')" class="bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded text-[10px] font-bold transition">Delete</button>
            </td>
          </tr>
        `;
      }
    });

    if (activeTableBody) {
      activeTableBody.innerHTML = activeUsersHtml !== '' ? activeUsersHtml : `<tr><td colspan="6" class="p-4 text-center text-slate-400">No active users registered.</td></tr>`;
    }
    if (deletedTableBody) {
      deletedTableBody.innerHTML = deletedUsersHtml !== '' ? deletedUsersHtml : `<tr><td colspan="5" class="p-4 text-center text-slate-400">No deleted users in archive.</td></tr>`;
    }

    if (document.getElementById('cardUsers')) document.getElementById('cardUsers').innerText = activeCount;
    if (document.getElementById('cardDeletedUsers')) document.getElementById('cardDeletedUsers').innerText = deletedCount;

  }, err => {
    console.error("Users live sync error:", err);
  });
}

async function updateUserStatus(uid, newStatus) {
  try {
    await db.collection('users').doc(uid).update({ status: newStatus });
  } catch (e) {
    alert("Error updating status: " + e.message);
  }
}

async function restoreUser(uid) {
  try {
    await db.collection('users').doc(uid).update({ status: 'approved' });
  } catch (e) {
    alert("Error restoring user: " + e.message);
  }
}

// KM-Based DC Rates Setting Functions
async function openKmSettingsModal() {
    document.getElementById('kmSettingsModal').classList.remove('hidden');
    await loadKmSettingsFromFirebase();
}

function closeKmSettingsModal() {
    document.getElementById('kmSettingsModal').classList.add('hidden');
}

async function loadKmSettingsFromFirebase() {
    try {
        const doc = await db.collection('settings').doc('km_dc_rates').get();
        let rate = 11;
        if (doc.exists && doc.data().perKmRate) {
            rate = doc.data().perKmRate;
        }
        if (document.getElementById('globalPerKmRate')) {
            document.getElementById('globalPerKmRate').value = rate;
        }
        renderKmTable(rate);
    } catch (e) {
        renderKmTable(11);
    }
}

function renderKmTable(rate) {
    const tbody = document.getElementById('kmSettingsTableBody');
    if (!tbody) return;

    let html = '';
    karachiAreasData.forEach(item => {
        let dcCharged = item.km * rate;
        html += `
            <tr class="border-b border-slate-800 text-xs">
                <td class="p-3 text-slate-400">${item.sNo}</td>
                <td class="p-3 font-bold text-white">${item.area}</td>
                <td class="p-3 text-amber-400">${item.km} km</td>
                <td class="p-3 text-slate-300 font-bold">${rate}</td>
                <td class="p-3 text-right font-black text-emerald-400">PKR ${dcCharged}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function recalculateAllKmCharges() {
    const rate = parseFloat(document.getElementById('globalPerKmRate').value) || 11;
    renderKmTable(rate);
}

async function saveKmSettingsToFirebase() {
    const rate = parseFloat(document.getElementById('globalPerKmRate').value) || 11;
    try {
        await db.collection('settings').doc('km_dc_rates').set({
            perKmRate: rate,
            areas: karachiAreasData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("KM-based DC rates successfully save ho gaye hain! 🎉");
        closeKmSettingsModal();
    } catch (e) {
        alert("Error saving rates: " + e.message);
    }
}

// Auto Detect DC amount by Address/Area in booking forms
async function autoDetectDCByAddress(enteredAddressOrArea) {
    try {
        const doc = await db.collection('settings').doc('km_dc_rates').get();
        let rate = 11;
        let areas = karachiAreasData;
        if (doc.exists) {
            rate = doc.data().perKmRate || 11;
            areas = doc.data().areas || karachiAreasData;
        }

        let matchedDC = 250; // Default fallback
        let lowerInput = enteredAddressOrArea.toLowerCase();

        for (let item of areas) {
            if (lowerInput.includes(item.area.toLowerCase())) {
                matchedDC = item.km * rate;
                break;
            }
        }

        const delChargesInput = document.getElementById('delCharges');
        if (delChargesInput) {
            delChargesInput.value = matchedDC;
            if (typeof calculateTotal === 'function') calculateTotal();
        }
    } catch (e) {
        console.error("Auto DC calculation error:", e);
    }
}

// Logistics & DC Rates Management Functions
async function loadLogisticsSettings() {
    try {
        const doc = await db.collection('settings').doc('logistics').get();
        if (doc.exists) {
            const data = doc.data();
            if (document.getElementById('settingPerKm')) document.getElementById('settingPerKm').value = data.perKm || 20;
            if (document.getElementById('settingPerKg')) document.getElementById('settingPerKg').value = data.perKg || 50;
            if (document.getElementById('settingOuterCityDC')) document.getElementById('settingOuterCityDC').value = data.outerCityDC || 450;
        }

        // Load Petrol Rate
        const petrolDoc = await db.collection('settings').doc('petrol_rate').get();
        if (petrolDoc.exists) {
            const pData = petrolDoc.data();
            if (document.getElementById('settingPetrolRate')) document.getElementById('settingPetrolRate').value = pData.rate || 0;
            if (document.getElementById('displayLivePetrolRate')) document.getElementById('displayLivePetrolRate').innerText = 'PKR ' + (pData.rate || 0) + ' / Liter';
        }
    } catch (e) {
        console.error("Error loading logistics settings:", e);
    }
}

async function saveLogisticsSettings() {
    const perKm = parseFloat(document.getElementById('settingPerKm').value) || 0;
    const perKg = parseFloat(document.getElementById('settingPerKg').value) || 0;
    const outerCityDC = parseFloat(document.getElementById('settingOuterCityDC').value) || 450;

    try {
        await db.collection('settings').doc('logistics').set({
            perKm,
            perKg,
            outerCityDC,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Logistics Rates Saved Successfully! 🚚");
    } catch (err) {
        alert("Error saving settings: " + err.message);
    }
}

// Save Daily Petrol Rate & Log History
async function savePetrolRate() {
    const rate = parseFloat(document.getElementById('settingPetrolRate').value) || 0;
    if (rate <= 0) {
        alert("Baraye meherbani sahi petrol rate enter karein!");
        return;
    }

    try {
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('settings').doc('petrol_rate').set({
            rate,
            updatedAt: timestamp
        });

        await db.collection('petrol_history').add({
            rate,
            date: new Date().toISOString().split('T')[0],
            createdAt: timestamp
        });

        alert("Daily Petrol Rate Saved Successfully! ⛽");
        loadLogisticsSettings();
    } catch (err) {
        alert("Error saving petrol rate: " + err.message);
    }
}

// Download Old Rates Report based on Date Range
async function downloadOldRatesReport() {
    const startDate = document.getElementById('rateStartDate').value;
    const endDate = document.getElementById('rateEndDate').value;

    if (!startDate || !endDate) {
        alert("Baraye meherbani Start Date aur End Date dono select karein!");
        return;
    }

    try {
        const snapshot = await db.collection('petrol_history')
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();

        if (snapshot.empty) {
            alert("Is date range mein koi record nahi mila.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,Date,Petrol Rate (PKR)\n";
        snapshot.forEach(doc => {
            const d = doc.data();
            csvContent += `${d.date},${d.rate}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `petrol_rates_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (e) {
        alert("Error downloading report: " + e.message);
    }
}

// Admin Parcels Dashboard
async function loadAdminDashboard() {
  const adminParcelTable = document.getElementById('adminParcelTable');
  if (!adminParcelTable) return;

  db.collection('parcels').onSnapshot((snapshot) => {
    let parcelRowsHtml = '';

    snapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;

      parcelRowsHtml += `
        <tr class="border-b border-slate-700/50 text-xs">
          <td class="p-3 font-bold text-amber-400 font-mono">${data.trackId || docId}</td>
          <td class="p-3 font-medium text-slate-200">
            ${data.custName || 'N/A'}
            ${data.custPhone ? `<div class="text-[10px] text-slate-400 mt-0.5">${data.custPhone}</div>` : ''}
          </td>
          <td class="p-3">
            <div class="font-bold text-slate-200">${data.custCity || 'N/A'}</div>
            <div class="text-[10px] text-slate-400 mt-0.5 max-w-xs break-words">${data.custAddress || 'Address N/A'}</div>
          </td>
          <td class="p-3 font-bold text-amber-300">PKR ${data.totalCod || 0}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              data.status === 'Delivered' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' :
              data.status && data.status.includes('Out for Delivery') ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' :
              'bg-amber-900/50 text-amber-300 border border-amber-500/30'
            }">${data.status || 'Pending'}</span>
          </td>
          <td class="p-3 text-center flex justify-center gap-1.5 flex-wrap">
            <button onclick='openShippingSlipModal(${JSON.stringify(data).replace(/'/g, "&#39;")})' class="bg-amber-500 hover:bg-amber-600 text-slate-950 px-2 py-1 rounded text-[10px] font-black shadow flex items-center gap-1">
                <i class="fa-solid fa-print"></i> Slip
            </button>
            ${!data.approvedByAdmin ? `
              <button onclick="approveParcelToRider('${docId}', 'rider.k@primetraders.com', 'Rider Korangi Section')" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-bold shadow">Approve -> Korangi</button>
              <button onclick="approveParcelToRider('${docId}', 'rider.s@primetraders.com', 'Rider Shah-e-Faisal Section')" class="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-[10px] font-bold shadow">Approve -> Shah-e-Faisal</button>
            ` : `<span class="text-emerald-400 font-bold text-[10px]">Assigned: ${data.assignedRiderName || 'Rider'}</span>`}
            <button onclick="deleteParcel('${docId}')" class="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[10px] font-bold">Delete</button>
          </td>
        </tr>
      `;
    });

    adminParcelTable.innerHTML = parcelRowsHtml !== '' ? parcelRowsHtml : `<tr><td colspan="6" class="p-4 text-center">No parcels found.</td></tr>`;
  });
}

async function approveParcelToRider(docId, riderEmail, riderName) {
  try {
    await db.collection('parcels').doc(docId).update({
      status: `Approved / In Transit (${riderName})`,
      approvedByAdmin: true,
      assignedRiderEmail: riderEmail,
      assignedRiderName: riderName
    });
    loadAdminStats();
  } catch(e) {
    alert("Error approving parcel: " + e.message);
  }
}

async function deleteParcel(docId) {
  if (confirm("Delete this parcel?")) {
    await db.collection('parcels').doc(docId).delete();
    loadAdminStats();
  }
}

// Wholeseller Orders Loader
function loadWholesellerOrdersTable() {
  const tbody = document.getElementById('wholesellerOrdersTable');
  if (!tbody) return;

  db.collection('orders').onSnapshot(snapshot => {
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">No wholeseller orders received yet.</td></tr>`;
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const id = doc.id;

      let itemsStr = '';
      if (data.items && Array.isArray(data.items)) {
        itemsStr = data.items.map(i => `${i.title} (x${i.qty || 1})`).join(', ');
      } else {
        itemsStr = data.itemDetail || 'N/A';
      }

      html += `
        <tr class="border-b border-slate-700/50 text-xs">
          <td class="p-3 font-bold text-white">
            ${data.customerName || data.custName || 'N/A'}
            <div class="text-[10px] text-amber-400">${data.customerPhone || data.custPhone || ''}</div>
            <div class="text-[10px] text-slate-400">${data.customerAddress || data.custAddress || ''}</div>
          </td>
          <td class="p-3 text-slate-200">${itemsStr}</td>
          <td class="p-3 font-bold text-amber-300">PKR ${data.totalAmount || data.totalCod || 0}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/50 text-amber-300 border border-amber-500/30">${data.status || 'Pending'}</span>
          </td>
          <td class="p-3 text-center">
            <button onclick="deleteWholesellerOrder('${id}')" class="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[10px] font-bold">Delete</button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  });
}

async function deleteWholesellerOrder(id) {
  if (confirm("Delete this wholeseller order?")) {
    await db.collection('orders').doc(id).delete();
  }
}

// Upload Custom Tracking IDs Pool
async function uploadCustomTrackingIDs() {
  const textarea = document.getElementById('trackingIdListInput');
  if (!textarea || !textarea.value.trim()) {
    alert("Karam karke tracking IDs enter karein!");
    return;
  }

  const lines = textarea.value.split('\n');
  let count = 0;

  try {
    for (let line of lines) {
      const trackId = line.trim();
      if (trackId !== '') {
        await db.collection('available_track_ids').add({
          trackId: trackId,
          status: 'unused',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        count++;
      }
    }

    alert(`Success! ${count} tracking IDs pool mein save ho gayi hain. 🎉`);
    textarea.value = '';
    closeCustomTrackModal();
  } catch (err) {
    alert("Error uploading tracking IDs: " + err.message);
  }
}

// Stats Overview Loader
async function loadAdminStats() {
  try {
    const pSnap = await db.collection('parcels').get();
    let totalParcels = pSnap.size;
    let pendingParcels = 0;
    pSnap.forEach(doc => {
      if (!doc.data().approvedByAdmin) pendingParcels++;
    });

    if (document.getElementById('cardTotalShipments')) document.getElementById('cardTotalShipments').innerText = totalParcels;
    if (document.getElementById('cardPendingParcels')) document.getElementById('cardPendingParcels').innerText = pendingParcels;
  } catch (e) {
    console.error("Stats Error:", e);
  }
}

function handleLogout() {
  auth.signOut().then(() => window.location.href = "login.html");
}

function openAddCodModal() {
  const modal = document.getElementById('addCodModal');
  if (modal) modal.classList.remove('hidden');
}

function closeAddCodModal() {
  const modal = document.getElementById('addCodModal');
  if (modal) modal.classList.add('hidden');
}

function openCustomTrackModal() {
  const modal = document.getElementById('customTrackModal');
  if (modal) modal.classList.remove('hidden');
}

function closeCustomTrackModal() {
  const modal = document.getElementById('customTrackModal');
  if (modal) modal.classList.add('hidden');
}

// Open Shipping Label Slip Modal for Admin
function openShippingSlipModal(parcelData) {
    document.getElementById('slipShipperName').innerText = "PRIME TRADERS LOGISTICS";
    document.getElementById('slipShipperAddress').innerText = "Main Office Karachi, Pakistan";
    document.getElementById('slipShipperPhone').innerText = "0300-1234567";

    document.getElementById('slipCustName').innerText = parcelData.custName || 'N/A';
    document.getElementById('slipCustPhone').innerText = parcelData.custPhone || 'N/A';
    document.getElementById('slipCustAddress').innerText = parcelData.custAddress || 'N/A';
    document.getElementById('slipTrackId').innerText = parcelData.trackId || 'PT-100000';
    document.getElementById('slipCity').innerText = parcelData.custCity || 'Karachi';
    document.getElementById('slipWeight').innerText = (parcelData.weightKg || 0.5) + ' Kg';
    document.getElementById('slipCodAmount').innerText = 'PKR ' + (parcelData.totalCod || 0);

    const dateStr = parcelData.createdAt?.toDate ? parcelData.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString();
    document.getElementById('slipDate').innerText = dateStr;

    let itemsText = '';
    if (parcelData.items && Array.isArray(parcelData.items)) {
        itemsText = parcelData.items.map(i => `${i.title} (${i.selectedSize || 'Std'}, x${i.qty || 1})`).join(', ');
    } else {
        itemsText = parcelData.itemDetail || 'General E-Commerce Parcel';
    }
    document.getElementById('slipItemsDesc').innerText = itemsText;

    document.getElementById('shippingSlipModal').classList.remove('hidden');
}

function closeShippingSlipModal() {
    document.getElementById('shippingSlipModal').classList.add('hidden');
}

// Custom Modal Alert Function
function showCustomAlert(title, message, type = 'success', callback = null) {
    const modal = document.getElementById('customAlertModal');
    if (!modal) {
        alert(message);
        return;
    }

    const titleEl = document.getElementById('customAlertTitle');
    const msgEl = document.getElementById('customAlertMessage');
    const iconEl = document.getElementById('customAlertIcon');
    const btnEl = document.getElementById('customAlertBtn');

    titleEl.innerText = title || (type === 'success' ? 'SUCCESS' : 'ERROR!');
    msgEl.innerText = message || '';

    if (type === 'success') {
        titleEl.className = "text-xl font-black uppercase tracking-wider text-emerald-600";
        iconEl.className = "flex justify-center text-emerald-500 text-5xl mb-2";
        iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        btnEl.className = "w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs tracking-wider uppercase shadow-lg transition transform active:scale-95";
    } else {
        titleEl.className = "text-xl font-black uppercase tracking-wider text-rose-600";
        iconEl.className = "flex justify-center text-rose-500 text-5xl mb-2";
        iconEl.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
        btnEl.className = "w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs tracking-wider uppercase shadow-lg transition transform active:scale-95";
    }

    btnEl.onclick = function() {
        closeCustomAlert();
        if (typeof callback === 'function') callback();
    };

    modal.classList.remove('hidden');
}

function closeCustomAlert() {
    const modal = document.getElementById('customAlertModal');
    if (modal) modal.classList.add('hidden');
}

window.alert = function(msg) {
    let isError = msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('enter');
    showCustomAlert(isError ? "ERROR!" : "SUCCESS", msg, isError ? "error" : "success");
};
