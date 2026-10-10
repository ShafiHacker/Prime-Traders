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

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

let currentParcelCount = 1;

// Admin Custom Tracking IDs Pool Controls
function openCustomTrackModal() {
  const modal = document.getElementById('customTrackModal');
  if (modal) modal.classList.remove('hidden');
  checkAvailablePoolCount();
}

function closeCustomTrackModal() {
  const modal = document.getElementById('customTrackModal');
  if (modal) modal.classList.add('hidden');
}

async function checkAvailablePoolCount() {
  try {
    const snap = await db.collection('available_track_ids').where('status', '==', 'unused').get();
    if (document.getElementById('poolAvailableCount')) {
      document.getElementById('poolAvailableCount').innerText = `Unused Available: ${snap.size} IDs`;
    }
  } catch (e) { console.error(e); }
}

async function uploadCustomTrackingIDs() {
  const inputArea = document.getElementById('trackingIdListInput');
  if (!inputArea || !inputArea.value.trim()) {
    alert("Please enter Tracking IDs!");
    return;
  }

  const idsArray = inputArea.value.split(/[\n,]+/).map(id => id.trim()).filter(id => id.length > 0);
  const batch = db.batch();

  idsArray.forEach((trackId) => {
    const ref = db.collection('available_track_ids').doc(trackId);
    batch.set(ref, {
      trackId: trackId,
      status: "unused",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  try {
    await batch.commit();
    alert(`Total ${idsArray.length} Tracking IDs added to pool! 🎉`);
    inputArea.value = '';
    checkAvailablePoolCount();
  } catch (err) {
    alert("Error uploading tracking IDs: " + err.message);
  }
}

// Fetch Next Custom Tracking ID from Pool
async function getNextCustomTrackId() {
  try {
    const snapshot = await db.collection('available_track_ids')
      .where('status', '==', 'unused')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await db.collection('available_track_ids').doc(doc.id).update({ status: 'used' });
      return doc.data().trackId;
    } else {
      return "PT" + Math.floor(10000000 + Math.random() * 90000000);
    }
  } catch (e) {
    return "PT" + Math.floor(10000000 + Math.random() * 90000000);
  }
}

// Tab Switcher for Login / Register
function switchTab(type) {
  const lForm = document.getElementById('loginForm');
  const rForm = document.getElementById('registerForm');
  const tLog = document.getElementById('tabLogin');
  const tReg = document.getElementById('tabRegister');

  if (!lForm || !rForm) return;

  if (type === 'login') {
    lForm.classList.remove('hidden');
    rForm.classList.add('hidden');
    tLog.className = 'flex-1 py-2 text-center text-amber-400 border-b-2 border-amber-400 focus:outline-none';
    tReg.className = 'flex-1 py-2 text-center text-slate-400 hover:text-slate-200 focus:outline-none';
  } else {
    rForm.classList.remove('hidden');
    lForm.classList.add('hidden');
    tReg.className = 'flex-1 py-2 text-center text-amber-400 border-b-2 border-amber-400 focus:outline-none';
    tLog.className = 'flex-1 py-2 text-center text-slate-400 hover:text-slate-200 focus:outline-none';
  }
}

// Account Type Switcher (Business vs Self)
function setAccountType(type) {
  const accountTypeInput = document.getElementById('regAccountType');
  if (accountTypeInput) accountTypeInput.value = type;

  const bBtn = document.getElementById('btnTypeBusiness');
  const sBtn = document.getElementById('btnTypeSelf');
  const bNameField = document.getElementById('businessNameField');
  const ntnNumField = document.getElementById('ntnNumField');
  const ntnFileField = document.getElementById('ntnFileField');
  const ntnInput = document.getElementById('regNTN');
  const bNameInput = document.getElementById('regBusinessName');

  if (type === 'business') {
    if (bBtn) bBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg border border-amber-400 bg-amber-400 text-slate-900 transition flex items-center justify-center gap-1";
    if (sBtn) sBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white transition flex items-center justify-center gap-1";
    if (bNameField) bNameField.classList.remove('hidden');
    if (ntnNumField) ntnNumField.classList.remove('hidden');
    if (ntnFileField) ntnFileField.classList.remove('hidden');
    if (ntnInput) ntnInput.required = true;
    if (bNameInput) bNameInput.required = true;
  } else {
    if (sBtn) sBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg border border-amber-400 bg-amber-400 text-slate-900 transition flex items-center justify-center gap-1";
    if (bBtn) bBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-white transition flex items-center justify-center gap-1";
    if (bNameField) bNameField.classList.add('hidden');
    if (ntnNumField) ntnNumField.classList.add('hidden');
    if (ntnFileField) ntnFileField.classList.add('hidden');
    if (ntnInput) ntnInput.required = false;
    if (bNameInput) bNameInput.required = false;
  }
}

// Compress File to Base64
const fileToBase64 = (file, maxWidth = 800, quality = 0.6) => new Promise((resolve, reject) => {
  if (!file) return resolve("");
  if (file.type === "application/pdf") {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    return;
  }
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width, height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = error => reject(error);
  };
  reader.onerror = error => reject(error);
});

// User Registration Handler
async function handleRegister(e) {
  if (e && e.preventDefault) e.preventDefault();
  const submitBtn = document.getElementById('regSubmitBtn');
  const authMsg = document.getElementById('authMsg');

  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "Processing & Uploading..."; }

  const accountType = document.getElementById('regAccountType') ? document.getElementById('regAccountType').value : 'business';
  const name = document.getElementById('regName') ? document.getElementById('regName').value.trim() : "";
  const businessName = document.getElementById('regBusinessName') ? document.getElementById('regBusinessName').value.trim() : "";
  const email = document.getElementById('regEmail') ? document.getElementById('regEmail').value.trim() : "";
  const phone = document.getElementById('regPhone') ? document.getElementById('regPhone').value.trim() : "";
  const cnic = document.getElementById('regCNIC') ? document.getElementById('regCNIC').value.trim() : "";
  const ntn = document.getElementById('regNTN') ? document.getElementById('regNTN').value.trim() : "";
  const bank = document.getElementById('regBank') ? document.getElementById('regBank').value.trim() : "";
  const pass = document.getElementById('regPassword') ? document.getElementById('regPassword').value : "";

  const fCnicFront = document.getElementById('fileCnicFront') ? document.getElementById('fileCnicFront').files[0] : null;
  const fCnicBack = document.getElementById('fileCnicBack') ? document.getElementById('fileCnicBack').files[0] : null;
  const fNTN = document.getElementById('fileNTN') ? document.getElementById('fileNTN').files[0] : null;
  const fBank = document.getElementById('fileBank') ? document.getElementById('fileBank').files[0] : null;

  try {
    const cnicFrontBase64 = await fileToBase64(fCnicFront);
    const cnicBackBase64 = await fileToBase64(fCnicBack);
    const ntnDocBase64 = await fileToBase64(fNTN);
    const bankDocBase64 = await fileToBase64(fBank);

    const userCred = await auth.createUserWithEmailAndPassword(email, pass);
    
    await db.collection('users').doc(userCred.user.uid).set({
      uid: userCred.user.uid,
      accountType: accountType,
      name: name,
      businessName: accountType === 'business' ? businessName : 'N/A (Self Account)',
      email: email,
      phone: phone,
      address: '',
      logoUrl: '',
      cnic: cnic,
      ntn: accountType === 'business' ? ntn : 'N/A',
      bankDetails: bank,
      docs: { cnicFront: cnicFrontBase64, cnicBack: cnicBackBase64, ntnDoc: accountType === 'business' ? ntnDocBase64 : '', bankDoc: bankDocBase64 },
      role: 'customer',
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await auth.signOut();
    alert("Account Under Verification ⏳\n\nYour account has been submitted successfully for admin review.");
    window.location.href = "login.html";
  } catch (err) {
    let customErrorMsg = err.message;
    if (err.code === 'auth/email-already-in-use') customErrorMsg = "This email address is already registered.";
    else if (err.code === 'auth/weak-password') customErrorMsg = "Password is too weak. Enter at least 6 characters.";
    if (authMsg) { authMsg.innerText = customErrorMsg; authMsg.classList.remove('hidden'); }
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = "Create Account"; }
  }
}

// Login Handler with Role Routing
async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const authMsg = document.getElementById('authMsg');

  if (!emailInput || !passwordInput) return;
  const email = emailInput.value.trim(), password = passwordInput.value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.role === "admin" || email === "admin@primetraders.com") { window.location.href = "admin.html"; return; }
      if (userData.role === "rider") { window.location.href = "rider.html"; return; }
      if (userData.status === "pending") { await auth.signOut(); alert("Account Under Verification ⏳"); return; }
      if (userData.status === "rejected" || userData.status === "deleted") { await auth.signOut(); alert("Account Disabled ❌"); return; }
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    let customErrorMsg = "Invalid email or password. Please try again.";
    if (authMsg) { authMsg.innerText = customErrorMsg; authMsg.classList.remove('hidden'); }
    else alert(customErrorMsg);
  }
}

// Open Customer Bulk COD Modal (Freezed Shipper Details)
async function openUserCodModal() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const doc = await db.collection('users').doc(user.uid).get();
    if (doc.exists) {
      const u = doc.data();
      if (document.getElementById('freezeShipperName')) document.getElementById('freezeShipperName').value = u.businessName || u.name || 'Prime Traders Merchant';
      if (document.getElementById('freezeShipperPhone')) document.getElementById('freezeShipperPhone').value = u.phone || 'N/A';
      if (document.getElementById('freezeShipperAddress')) document.getElementById('freezeShipperAddress').value = u.address || 'Karachi, Pakistan';
    }
    const modal = document.getElementById('userCodModal');
    if (modal) modal.classList.remove('hidden');
  } catch (err) {
    console.error("Error fetching shipper profile:", err);
  }
}

function closeUserCodModal() {
  const modal = document.getElementById('userCodModal');
  if (modal) modal.classList.add('hidden');
}

// Add Dynamic Row for Multi-Parcel Booking (Up to 10)
function addMoreParcelRow() {
  if (currentParcelCount >= 10) {
    alert("Maximum limit reached! You can book up to 10 parcels at a time.");
    return;
  }
  currentParcelCount++;

  const container = document.getElementById('parcelEntriesContainer');
  if (!container) return;

  const newRow = document.createElement('div');
  newRow.className = "parcel-item bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3 relative text-xs";
  newRow.innerHTML = `
    <div class="flex justify-between items-center">
      <span class="font-bold text-amber-400 text-xs">Parcel #${currentParcelCount} Details</span>
      <button type="button" onclick="removeParcelRow(this)" class="text-rose-400 hover:text-rose-200 font-bold text-xs"><i class="fa-solid fa-trash"></i> Remove</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <input type="text" placeholder="Consignee Full Name *" required class="cust-name p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white outline-none">
      <input type="text" placeholder="Consignee Phone *" required class="cust-phone p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white outline-none">
      <input type="text" placeholder="Destination City *" required class="cust-city p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white outline-none">
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <input type="number" placeholder="COD Amount (PKR) *" required class="cust-cod p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white outline-none">
      <input type="text" placeholder="Complete Delivery Address *" required class="cust-address md:col-span-2 p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white outline-none">
    </div>
  `;
  container.appendChild(newRow);
  if (document.getElementById('parcelCounterBadge')) {
    document.getElementById('parcelCounterBadge').innerText = `${currentParcelCount} / 10 Parcels Added`;
  }
}

function removeParcelRow(btn) {
  btn.closest('.parcel-item').remove();
  currentParcelCount--;
  if (document.getElementById('parcelCounterBadge')) {
    document.getElementById('parcelCounterBadge').innerText = `${currentParcelCount} / 10 Parcels Added`;
  }
}

// Submit Bulk Parcels (Auto Sequential Custom Tracking ID)
async function handleBulkParcelSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const items = document.querySelectorAll('.parcel-item');
  const sName = document.getElementById('freezeShipperName') ? document.getElementById('freezeShipperName').value : 'Prime Traders Merchant';
  const sPhone = document.getElementById('freezeShipperPhone') ? document.getElementById('freezeShipperPhone').value : 'N/A';
  const sAddress = document.getElementById('freezeShipperAddress') ? document.getElementById('freezeShipperAddress').value : 'Pakistan';

  for (let item of items) {
    const cName = item.querySelector('.cust-name').value.trim();
    const cPhone = item.querySelector('.cust-phone').value.trim();
    const cCity = item.querySelector('.cust-city').value.trim();
    const cCod = item.querySelector('.cust-cod').value.trim();
    const cAddress = item.querySelector('.cust-address').value.trim();

    const trackId = await getNextCustomTrackId();

    await db.collection('parcels').add({
      trackId: trackId,
      userId: user.uid,
      shipperName: sName,
      shipperPhone: sPhone,
      shipperAddress: sAddress,
      custName: cName,
      custPhone: cPhone,
      custCity: cCity,
      custAddress: cAddress,
      totalCod: parseFloat(cCod),
      status: 'Pending Admin Approval',
      approvedByAdmin: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  alert(`Successfully booked ${items.length} parcel(s) with sequential tracking IDs! 🎉`);
  closeUserCodModal();
  loadUserDashboard(user.uid);
}

// Print Airway Bill Slip (Leopards Barcode Layout)
function printThermalSlip(trackId, name, phone, city, address, cod, shipper, origin) {
  const url = `cod_bill.html?trackId=${trackId}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}&address=${encodeURIComponent(address)}&cod=${cod}&shipper=${encodeURIComponent(shipper)}&origin=${encodeURIComponent(origin)}`;
  window.open(url, '_blank', 'width=500,height=700');
}

// Admin Section Switcher
function showAdminSection(sectionType) {
  const activeSection = document.getElementById('activeUsersSection');
  const deletedSection = document.getElementById('deletedUsersSection');
  const trackingSection = document.getElementById('trackingSection');

  if (sectionType === 'active') {
    if (activeSection) activeSection.classList.remove('hidden');
    if (deletedSection) deletedSection.classList.add('hidden');
    if (trackingSection) trackingSection.classList.add('hidden');
  } else if (sectionType === 'deleted') {
    if (activeSection) activeSection.classList.add('hidden');
    if (deletedSection) deletedSection.classList.remove('hidden');
    if (trackingSection) trackingSection.classList.add('hidden');
  } else if (sectionType === 'tracking') {
    if (activeSection) activeSection.classList.add('hidden');
    if (deletedSection) deletedSection.classList.add('hidden');
    if (trackingSection) trackingSection.classList.remove('hidden');
  }
}

// Admin Add COD Modal Controls
function openAddCodModal() {
  const modal = document.getElementById('addCodModal');
  if (modal) modal.classList.remove('hidden');
}

function closeAddCodModal() {
  const modal = document.getElementById('addCodModal');
  if (modal) modal.classList.add('hidden');
}

// Handle Admin Manual Parcel Creation
async function handleAdminCreateParcel(e) {
  if (e && e.preventDefault) e.preventDefault();

  const cName = document.getElementById('adminCustName').value.trim();
  const cPhone = document.getElementById('adminCustPhone').value.trim();
  const cCity = document.getElementById('adminCustCity').value.trim();
  const cCod = document.getElementById('adminTotalCod').value.trim();
  const cAddress = document.getElementById('adminCustAddress').value.trim();
  const itemDetail = document.getElementById('adminItemDetail') ? document.getElementById('adminItemDetail').value.trim() : '';

  const trackId = await getNextCustomTrackId();

  try {
    await db.collection('parcels').add({
      trackId: trackId,
      custName: cName,
      custPhone: cPhone,
      custCity: cCity,
      custAddress: cAddress,
      totalCod: parseFloat(cCod),
      itemDetail: itemDetail,
      status: 'Approved / In Transit',
      approvedByAdmin: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert(`COD Parcel Booked & Approved Successfully! 🎉\nTracking ID: ${trackId}`);
    closeAddCodModal();
    loadAdminDashboard();
  } catch (err) {
    alert("Error booking parcel: " + err.message);
  }
}

// Load Active Users Table
async function loadUsersTable() {
  const activeTableBody = document.getElementById('userTableBody');
  const deletedTableBody = document.getElementById('deletedUserTableBody');

  try {
    const snapshot = await db.collection('users').get();
    let activeUsersHtml = '';
    let deletedUsersHtml = '';

    snapshot.forEach((doc) => {
      const u = doc.data();
      const uid = doc.id;
      const status = u.status || 'approved';
      const role = u.role || 'customer';
      const type = u.accountType || 'business';

      if (status === 'deleted') {
        deletedUsersHtml += `
          <tr class="border-b border-slate-700/50 text-xs">
            <td class="p-3"><div class="font-bold text-slate-100">${u.name || 'N/A'}</div></td>
            <td class="p-3">${u.email || 'N/A'}</td>
            <td class="p-3">${type}</td>
            <td class="p-3"><span class="text-rose-400 font-bold">DELETED</span></td>
            <td class="p-3 text-center">
              <button onclick="restoreUser('${uid}')" class="bg-emerald-600 text-white px-2 py-1 rounded text-xs font-bold">Restore</button>
            </td>
          </tr>
        `;
      } else {
        activeUsersHtml += `
          <tr class="border-b border-slate-700/50 text-xs">
            <td class="p-3"><div class="font-bold text-slate-100">${u.name || 'N/A'}</div></td>
            <td class="p-3">${u.email || 'N/A'}</td>
            <td class="p-3">${type}</td>
            <td class="p-3">${role}</td>
            <td class="p-3"><span class="text-emerald-400 font-bold">${status.toUpperCase()}</span></td>
            <td class="p-3 text-center flex justify-center gap-1">
              <button onclick="updateUserStatus('${uid}', 'approved')" class="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold">Approve</button>
              <button onclick="updateUserStatus('${uid}', 'rejected')" class="bg-rose-600 text-white px-2 py-1 rounded text-[10px] font-bold">Reject</button>
            </td>
          </tr>
        `;
      }
    });

    if (activeTableBody) activeTableBody.innerHTML = activeUsersHtml !== '' ? activeUsersHtml : `<tr><td colspan="6" class="p-4 text-center">No active users.</td></tr>`;
    if (deletedTableBody) deletedTableBody.innerHTML = deletedUsersHtml !== '' ? deletedUsersHtml : `<tr><td colspan="5" class="p-4 text-center">No archived users.</td></tr>`;
  } catch (err) { console.error(err); }
}

async function updateUserStatus(uid, newStatus) {
  await db.collection('users').doc(uid).update({ status: newStatus });
  loadUsersTable();
}

async function restoreUser(uid) {
  await db.collection('users').doc(uid).update({ status: 'pending' });
  loadUsersTable();
}

// Load Customer Parcels (Dashboard)
async function loadUserDashboard(uid) {
  const snapshot = await db.collection('parcels').where('userId', '==', uid).get();
  const tableBody = document.getElementById('userParcelTable');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  snapshot.forEach((doc) => {
    const data = doc.data();
    tableBody.innerHTML += `
      <tr class="border-b border-slate-700/50 text-xs">
        <td class="p-3 font-bold text-amber-400 font-mono">${data.trackId || 'N/A'}</td>
        <td class="p-3">${data.custName || 'N/A'}</td>
        <td class="p-3">${data.custCity || 'N/A'}</td>
        <td class="p-3 font-bold">PKR ${data.totalCod || 0}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
            data.status === 'Delivered' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' :
            data.status === 'Out for Delivery / On The Way' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' :
            data.status.includes('Hold') ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30' :
            'bg-amber-900/50 text-amber-300 border border-amber-500/30'
          }">${data.status || 'Pending'}</span>
          ${data.returnReason ? `<div class="text-[10px] text-rose-300 mt-0.5">Remark: ${data.returnReason}</div>` : ''}
        </td>
        <td class="p-3 text-center">
          <button onclick="printThermalSlip('${data.trackId}', '${data.custName}', '${data.custPhone}', '${data.custCity}', '${data.custAddress}', '${data.totalCod}', '${data.shipperName}', '${data.shipperAddress}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded font-bold text-[10px] shadow">
            Print Slip
          </button>
        </td>
      </tr>
    `;
  });
}

// Load Admin Parcels
async function loadAdminDashboard() {
  const snapshot = await db.collection('parcels').get();
  const adminParcelTable = document.getElementById('adminParcelTable');
  let parcelRowsHtml = '';

  snapshot.forEach((doc) => {
    const data = doc.data();
    const docId = doc.id;

    if (adminParcelTable) {
      parcelRowsHtml += `
        <tr class="border-b border-slate-700/50 text-xs">
          <td class="p-3 font-bold text-amber-400 font-mono">${data.trackId || docId}</td>
          <td class="p-3">${data.custName || 'N/A'}</td>
          <td class="p-3">${data.custCity || 'N/A'}</td>
          <td class="p-3 font-bold">PKR ${data.totalCod || 0}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              data.status === 'Delivered' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' :
              data.status === 'Out for Delivery / On The Way' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' :
              'bg-amber-900/50 text-amber-300 border border-amber-500/30'
            }">${data.status || 'Pending'}</span>
            ${data.returnReason ? `<div class="text-[10px] text-rose-300 mt-0.5">Remark: ${data.returnReason}</div>` : ''}
          </td>
          <td class="p-3 text-center flex justify-center gap-1">
            ${!data.approvedByAdmin ? `<button onclick="approveParcelByAdmin('${docId}')" class="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-bold">Approve & Unfreeze</button>` : `<span class="text-emerald-400 font-bold text-[10px]">Unfrozen / Assigned</span>`}
            <button onclick="deleteParcel('${docId}')" class="bg-rose-600 text-white px-2 py-1 rounded text-[10px]">Delete</button>
          </td>
        </tr>
      `;
    }
  });

  if (adminParcelTable) adminParcelTable.innerHTML = parcelRowsHtml !== '' ? parcelRowsHtml : `<tr><td colspan="6" class="p-4 text-center">No parcels found.</td></tr>`;
}

async function approveParcelByAdmin(docId) {
  await db.collection('parcels').doc(docId).update({ status: 'Approved / In Transit', approvedByAdmin: true });
  loadAdminDashboard();
}

async function deleteParcel(docId) {
  if (confirm("Delete parcel?")) {
    await db.collection('parcels').doc(docId).delete();
    loadAdminDashboard();
  }
}

// ---------------- RIDER PORTAL FUNCTIONS ---------------- //

// Quick Rider Actions (Collect Parcel / On The Way)
async function updateRiderQuickStatus(docId, newStatus) {
  try {
    await db.collection('parcels').doc(docId).update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert(`Status updated to: ${newStatus} ✅`);
    loadRiderDashboard();
  } catch (err) {
    alert("Error updating status: " + err.message);
  }
}

// Load Rider Dashboard Data (Shows Only Approved Unfrozen Parcels)
async function loadRiderDashboard() {
  const tableBody = document.getElementById('riderParcelTable');
  if (!tableBody) return;

  try {
    const snapshot = await db.collection('parcels').get();
    let pendingCount = 0, onWayCount = 0, deliveredCount = 0, totalCodCollected = 0;
    let tableHtml = '';

    snapshot.forEach((doc) => {
      const p = doc.data();
      const docId = doc.id;

      // Only show unfrozen/approved parcels to rider
      if (p.approvedByAdmin) {
        if (p.status === 'Delivered') {
          deliveredCount++;
          totalCodCollected += parseFloat(p.totalCod || 0);
        } else if (p.status === 'Out for Delivery / On The Way') {
          onWayCount++;
        } else {
          pendingCount++;
        }

        let actionButtons = '';

        if (p.status === 'Delivered') {
          actionButtons = `<span class="text-emerald-400 font-bold text-xs"><i class="fa-solid fa-circle-check"></i> Delivered</span>`;
        } else {
          actionButtons = `
            <div class="flex flex-wrap items-center justify-center gap-1">
              ${p.status !== 'Picked Up from Office' && p.status !== 'Out for Delivery / On The Way' ? 
                `<button onclick="updateRiderQuickStatus('${docId}', 'Picked Up from Office')" class="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded font-bold text-[10px] shadow">
                  <i class="fa-solid fa-box-archive"></i> Collect Parcel
                 </button>` : ''
              }
              ${p.status !== 'Out for Delivery / On The Way' ? 
                `<button onclick="updateRiderQuickStatus('${docId}', 'Out for Delivery / On The Way')" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded font-bold text-[10px] shadow">
                  <i class="fa-solid fa-motorcycle"></i> On The Way
                 </button>` : ''
              }
              <button onclick="openRiderActionModal('${docId}', 'delivered')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded font-bold text-[10px] shadow">
                <i class="fa-solid fa-camera"></i> Delivered
              </button>
              <button onclick="openRiderActionModal('${docId}', 'rejected')" class="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded font-bold text-[10px] shadow">
                <i class="fa-solid fa-triangle-exclamation"></i> Hold / Reject
              </button>
            </div>
          `;
        }

        tableHtml += `
          <tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition text-xs">
            <td class="p-3">
              <div class="font-bold text-amber-400 font-mono">${p.trackId || docId}</div>
            </td>
            <td class="p-3">
              <div class="font-bold text-slate-100">${p.custName || 'N/A'}</div>
              <div class="text-emerald-400 font-semibold"><i class="fa-solid fa-phone"></i> ${p.custPhone || 'N/A'}</div>
            </td>
            <td class="p-3">
              <div class="text-slate-200">${p.custAddress || 'N/A'}</div>
              <div class="text-[10px] text-amber-400 font-bold">${p.custCity || 'N/A'}</div>
            </td>
            <td class="p-3 font-bold text-white">PKR ${p.totalCod || 0}</td>
            <td class="p-3">
              <span class="px-2 py-1 rounded-full text-[10px] font-bold ${
                p.status === 'Delivered' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30' :
                p.status === 'Out for Delivery / On The Way' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' :
                p.status.includes('Hold') ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30' :
                'bg-slate-800 text-slate-300 border border-slate-700'
              }">${p.status || 'Assigned'}</span>
              ${p.returnReason ? `<div class="text-[10px] text-rose-300 mt-1">Remark: ${p.returnReason}</div>` : ''}
            </td>
            <td class="p-3 text-center">
              ${actionButtons}
            </td>
          </tr>
        `;
      }
    });

    tableBody.innerHTML = tableHtml !== '' ? tableHtml : `<tr><td colspan="6" class="p-4 text-center text-slate-400">No approved/unfrozen deliveries assigned yet.</td></tr>`;

    if (document.getElementById('riderPendingCount')) document.getElementById('riderPendingCount').innerText = pendingCount;
    if (document.getElementById('riderOnWayCount')) document.getElementById('riderOnWayCount').innerText = onWayCount;
    if (document.getElementById('riderDeliveredCount')) document.getElementById('riderDeliveredCount').innerText = deliveredCount;
    if (document.getElementById('riderTotalCod')) document.getElementById('riderTotalCod').innerText = `PKR ${totalCodCollected}`;

  } catch (err) {
    console.error("Error loading rider parcels:", err);
  }
}

// Modal Action Toggles for Rider
function openRiderActionModal(docId, actionType) {
  document.getElementById('selectedParcelDocId').value = docId;
  document.getElementById('selectedActionType').value = actionType;

  const title = document.getElementById('modalRiderTitle');
  const delSec = document.getElementById('deliveredSection');
  const rejSec = document.getElementById('rejectedSection');

  if (actionType === 'delivered') {
    title.innerText = "Confirm Delivery & Snap Camera Photo";
    title.className = "text-base font-bold text-emerald-400";
    delSec.classList.remove('hidden');
    rejSec.classList.add('hidden');
  } else {
    title.innerText = "Select Remark / Hold Reason";
    title.className = "text-base font-bold text-amber-400";
    delSec.classList.add('hidden');
    rejSec.classList.remove('hidden');
  }

  document.getElementById('riderActionModal').classList.remove('hidden');
}

function closeRiderModal() {
  document.getElementById('riderActionModal').classList.add('hidden');
}

// Submit Live Rider Status Update (Evidence / Remarks Sync)
async function submitRiderStatusUpdate() {
  const docId = document.getElementById('selectedParcelDocId').value;
  const actionType = document.getElementById('selectedActionType').value;
  const proofFile = document.getElementById('riderProofFile').files[0];
  const reason = document.getElementById('riderReturnReason').value;
  const comment = document.getElementById('riderReturnComment').value.trim();

  try {
    let updatePayload = {};

    if (actionType === 'delivered') {
      let proofBase64 = "";
      if (proofFile) proofBase64 = await fileToBase64(proofFile, 600, 0.6);
      
      updatePayload = {
        status: 'Delivered',
        proofImage: proofBase64,
        deliveredAt: firebase.firestore.FieldValue.serverTimestamp()
      };
    } else {
      updatePayload = {
        status: reason.includes('Hold') ? 'On Hold (Re-attempt Request)' : 'Delivery Failed / Rejected',
        returnReason: reason + (comment ? ` - ${comment}` : ''),
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
    }

    await db.collection('parcels').doc(docId).update(updatePayload);
    alert(`Status updated successfully! ✅`);
    closeRiderModal();
    loadRiderDashboard();

  } catch (err) {
    alert("Error updating status: " + err.message);
  }
}

// Profile Editing Controls
async function openProfileModal() {
  const user = auth.currentUser;
  if (!user) return;
  const doc = await db.collection('users').doc(user.uid).get();
  if (doc.exists) {
    const data = doc.data();
    if (document.getElementById('editName')) document.getElementById('editName').value = data.name || '';
    if (document.getElementById('editBusinessName')) document.getElementById('editBusinessName').value = data.businessName || '';
    if (document.getElementById('editPhone')) document.getElementById('editPhone').value = data.phone || '';
    if (document.getElementById('editAddress')) document.getElementById('editAddress').value = data.address || '';
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.remove('hidden');
  }
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('hidden');
}

async function saveProfileUpdate(e) {
  if (e && e.preventDefault) e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const newName = document.getElementById('editName').value.trim();
  const newBusiness = document.getElementById('editBusinessName').value.trim();
  const newPhone = document.getElementById('editPhone').value.trim();
  const newAddress = document.getElementById('editAddress').value.trim();

  try {
    await db.collection('users').doc(user.uid).update({ name: newName, businessName: newBusiness, phone: newPhone, address: newAddress });
    alert("Profile Updated Successfully! ✨");
    closeProfileModal();
    location.reload();
  } catch (err) { alert("Error updating profile: " + err.message); }
}

function handleLogout() {
  auth.signOut().then(() => { window.location.href = 'login.html'; });
}

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
  const path = window.location.pathname;
  if (user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};
    if (document.getElementById('userNameDisplay')) document.getElementById('userNameDisplay').innerText = userData.name || user.email;
    if (path.includes('dashboard.html')) loadUserDashboard(user.uid);
    else if (path.includes('admin.html')) { loadAdminDashboard(); loadUsersTable(); }
    else if (path.includes('rider.html')) { loadRiderDashboard(); }
  } else {
    if (path.includes('dashboard.html') || path.includes('admin.html') || path.includes('rider.html')) window.location.href = 'login.html';
  }
});
