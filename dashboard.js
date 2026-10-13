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

// Auth State Listener for Dashboard Pages
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Fetch and Display User Profile & Image on Dashboard
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        
        // Render Profile Picture in Header
        const profilePicImg = document.getElementById('userProfilePic');
        if (profilePicImg) {
          profilePicImg.src = uData.logoUrl || "https://via.placeholder.com/40";
        }

        // Render Name/Business Name
        const nameDisplay = document.getElementById('userNameDisplay');
        if (nameDisplay) {
          nameDisplay.innerText = uData.businessName || uData.name || 'Merchant';
        }

        // Load Dashboard Parcels & Stats
        loadUserDashboard(user.uid);
        loadUserStats(user.uid);
      }
    } catch (e) {
      console.error("Error loading profile data:", e);
    }
  } else {
    // If on dashboard and not logged in, redirect to login
    if (window.location.pathname.includes('dashboard.html')) {
      window.location.href = 'login.html';
    }
  }
});

// ---------------- PUBLIC TRACKING TIMELINE LOGIC ---------------- //

async function searchPublicParcel() {
  const input = document.getElementById('publicTrackInput');
  const resultCard = document.getElementById('trackingResult');
  const timelineBox = document.getElementById('trackingTimeline');

  if (!input || !input.value.trim()) {
    alert("Karam karke Tracking ID enter karein!");
    return;
  }

  const trackIdSearch = input.value.trim();

  try {
    const snap = await db.collection('parcels').where('trackId', '==', trackIdSearch).get();

    if (snap.empty) {
      alert("Koi parcel record nahi mila! Kripya Tracking ID check karein.");
      if (resultCard) resultCard.classList.add('hidden');
      return;
    }

    const data = snap.docs[0].data();

    document.getElementById('resTrackId').innerText = data.trackId || trackIdSearch;
    document.getElementById('resReceiver').innerText = `${data.custName || 'N/A'} (${data.custCity || 'N/A'})`;
    document.getElementById('resCod').innerText = `PKR ${data.totalCod || 0}`;
    document.getElementById('resAddress').innerText = data.custAddress || 'N/A';
    document.getElementById('resStatusBadge').innerText = (data.status || 'Pending').toUpperCase();

    const formatTime = (ts) => ts ? new Date(ts.seconds * 1000).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Processing...';

    let timelineHtml = `
      <div class="relative pl-4 border-l-2 border-amber-400 space-y-0.5 pb-2">
        <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-amber-400"></div>
        <p class="font-bold text-white text-xs">Parcel Booked & Submitted</p>
        <p class="text-[10px] text-slate-400">${formatTime(data.createdAt)}</p>
      </div>
    `;

    if (data.approvedByAdmin) {
      timelineHtml += `
        <div class="relative pl-4 border-l-2 border-blue-400 space-y-0.5 pb-2">
          <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-400"></div>
          <p class="font-bold text-white text-xs">Approved & Unfrozen by Admin</p>
          <p class="text-[10px] text-slate-400">In Transit Hub</p>
        </div>
      `;
    }

    if (data.status === 'Picked Up from Office' || data.status === 'Out for Delivery / On The Way' || data.status === 'Delivered') {
      timelineHtml += `
        <div class="relative pl-4 border-l-2 border-purple-400 space-y-0.5 pb-2">
          <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-purple-400"></div>
          <p class="font-bold text-white text-xs">Picked Up by Courier Rider</p>
          <p class="text-[10px] text-slate-400">Rider Collected Shipment</p>
        </div>
      `;
    }

    if (data.status === 'Out for Delivery / On The Way' || data.status === 'Delivered') {
      timelineHtml += `
        <div class="relative pl-4 border-l-2 border-blue-500 space-y-0.5 pb-2">
          <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500"></div>
          <p class="font-bold text-white text-xs">Out for Delivery (On The Way)</p>
          <p class="text-[10px] text-slate-400">Rider Dispatched to Customer Address</p>
        </div>
      `;
    }

    if (data.status === 'Delivered') {
      timelineHtml += `
        <div class="relative pl-4 border-l-2 border-emerald-400 space-y-0.5">
          <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-emerald-400"></div>
          <p class="font-bold text-emerald-400 text-xs">Parcel Delivered Successfully 🎉</p>
          <p class="text-[10px] text-slate-400">${formatTime(data.deliveredAt)}</p>
        </div>
      `;
    } else if (data.status && (data.status.includes('Hold') || data.status.includes('Failed') || data.status.includes('Rejected'))) {
      timelineHtml += `
        <div class="relative pl-4 border-l-2 border-rose-400 space-y-0.5">
          <div class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-rose-400"></div>
          <p class="font-bold text-rose-400 text-xs">${data.status}</p>
          <p class="text-[10px] text-rose-300">Remark: ${data.returnReason || 'No remark added'}</p>
        </div>
      `;
    }

    if (timelineBox) timelineBox.innerHTML = timelineHtml;
    if (resultCard) resultCard.classList.remove('hidden');

  } catch (err) {
    alert("Tracking error: " + err.message);
  }
}

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

async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const authMsg = document.getElementById('authMsg');

  if (!emailInput || !passwordInput) return;
  const email = emailInput.value.trim().toLowerCase(), password = passwordInput.value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    if (email === "admin@primetraders.com") { window.location.href = "admin.html"; return; }
    if (email.includes("rider")) { window.location.href = "rider.html"; return; }

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.role === "admin") { window.location.href = "admin.html"; return; }
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

function handleLogout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}

// Profile Modal Controls
async function openProfileModal() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const doc = await db.collection('users').doc(user.uid).get();
    if (doc.exists) {
      const u = doc.data();
      if (document.getElementById('editName')) document.getElementById('editName').value = u.name || '';
      if (document.getElementById('editBusinessName')) document.getElementById('editBusinessName').value = u.businessName || '';
      if (document.getElementById('editPhone')) document.getElementById('editPhone').value = u.phone || '';
      if (document.getElementById('editAddress')) document.getElementById('editAddress').value = u.address || '';
    }
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.remove('hidden');
  } catch (e) {
    console.error(e);
  }
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('hidden');
}

// Save Profile Update (including Logo/Profile Picture)
async function saveProfileUpdate(e) {
  if (e && e.preventDefault) e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const name = document.getElementById('editName').value.trim();
  const businessName = document.getElementById('editBusinessName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  const address = document.getElementById('editAddress').value.trim();
  const logoFile = document.getElementById('editLogoFile').files[0];

  try {
    let updateData = { name, businessName, phone, address };
    if (logoFile) {
      const logoBase64 = await fileToBase64(logoFile, 400, 0.7);
      updateData.logoUrl = logoBase64;
    }

    await db.collection('users').doc(user.uid).update(updateData);
    alert("Profile updated successfully! 🎉");
    closeProfileModal();
    location.reload();
  } catch (err) {
    alert("Error updating profile: " + err.message);
  }
}

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
  loadUserStats(user.uid);
}

function printThermalSlip(trackId, name, phone, city, address, cod, shipper, origin) {
  const url = `cod_bill.html?trackId=${trackId}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}&address=${encodeURIComponent(address)}&cod=${cod}&shipper=${encodeURIComponent(shipper)}&origin=${encodeURIComponent(origin)}`;
  window.open(url, '_blank', 'width=500,height=700');
}

// Load Customer Stats Counter Cards
async function loadUserStats(uid) {
  try {
    const snap = await db.collection('parcels').where('userId', '==', uid).get();
    let total = snap.size;
    let pending = 0;
    let inTransit = 0;
    let delivered = 0;

    snap.forEach(doc => {
      const d = doc.data();
      const st = d.status || '';
      if (st.includes('Pending')) pending++;
      else if (st.includes('Delivered')) delivered++;
      else inTransit++;
    });

    if (document.getElementById('cardTotal')) document.getElementById('cardTotal').innerText = total;
    if (document.getElementById('cardPending')) document.getElementById('cardPending').innerText = pending;
    if (document.getElementById('cardInTransit')) document.getElementById('cardInTransit').innerText = inTransit;
    if (document.getElementById('cardDelivered')) document.getElementById('cardDelivered').innerText = delivered;
  } catch (e) {
    console.error(e);
  }
}

async function loadUserDashboard(uid) {
  const snapshot = await db.collection('parcels').where('userId', '==', uid).get();
  const tableBody = document.getElementById('userParcelTable');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (snapshot.empty) {
    tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">No parcels found.</td></tr>`;
    return;
  }

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
