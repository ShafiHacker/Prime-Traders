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

// EmailJS Notification
function sendEmailNotification(messageText) {
  const serviceID = "primetraders.express";
  const templateID = "7te01mn";
  if (typeof emailjs !== "undefined") {
    emailjs.send(serviceID, templateID, { message_text: messageText });
  }
}

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

    sendEmailNotification(`🔔 Prime Traders - New ${accountType.toUpperCase()} Account Registration\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`);
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

// Login Handler
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
    if (email === "admin@primetraders.com") { window.location.href = "admin.html"; return; }

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.role === "admin") { window.location.href = "admin.html"; return; }
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

// Admin Section Switcher (Active Users vs Deleted Users vs Tracking)
function showAdminSection(sectionType) {
  const activeSection = document.getElementById('activeUsersSection') || document.getElementById('userTableBody')?.closest('div.overflow-x-auto')?.parentElement;
  const deletedSection = document.getElementById('deletedUsersSection') || document.getElementById('deletedUserTableBody')?.closest('div.overflow-x-auto')?.parentElement;
  const trackingSection = document.getElementById('trackingSection');

  if (sectionType === 'active') {
    if (activeSection) activeSection.style.display = 'block';
    if (deletedSection) deletedSection.style.display = 'none';
    if (trackingSection) trackingSection.style.display = 'none';
  } else if (sectionType === 'deleted') {
    if (activeSection) activeSection.style.display = 'none';
    if (deletedSection) deletedSection.style.display = 'block';
    if (trackingSection) trackingSection.style.display = 'none';
  } else if (sectionType === 'tracking') {
    if (activeSection) activeSection.style.display = 'none';
    if (deletedSection) deletedSection.style.display = 'none';
    if (trackingSection) trackingSection.style.display = 'block';
  }
}

// Enter Key Login Listener & Card Click Listeners
document.addEventListener("DOMContentLoaded", () => {
  const loginPass = document.getElementById("loginPassword");
  const loginEmail = document.getElementById("loginEmail");
  if (loginPass) loginPass.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); handleLogin(e); } });
  if (loginEmail) loginEmail.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); handleLogin(e); } });

  // Top Navigation Cards Click Handlers
  const cardActive = document.getElementById('cardUsers')?.parentElement;
  const cardDeleted = document.getElementById('cardDeletedUsers')?.parentElement;
  const cardTotal = document.getElementById('cardTotalShipments')?.parentElement;
  const cardPending = document.getElementById('cardPendingParcels')?.parentElement;

  if (cardActive) {
    cardActive.style.cursor = 'pointer';
    cardActive.addEventListener('click', () => showAdminSection('active'));
  }
  if (cardDeleted) {
    cardDeleted.style.cursor = 'pointer';
    cardDeleted.addEventListener('click', () => showAdminSection('deleted'));
  }
  if (cardTotal) {
    cardTotal.style.cursor = 'pointer';
    cardTotal.addEventListener('click', () => showAdminSection('tracking'));
  }
  if (cardPending) {
    cardPending.style.cursor = 'pointer';
    cardPending.addEventListener('click', () => showAdminSection('tracking'));
  }
});

// Load Active Users and Deleted Users Table in Admin Dashboard
async function loadUsersTable() {
  const activeTableBody = document.getElementById('userTableBody');
  const deletedTableBody = document.getElementById('deletedUserTableBody');
  const cardActiveCount = document.getElementById('cardUsers');
  const cardDeletedCount = document.getElementById('cardDeletedUsers');

  try {
    const snapshot = await db.collection('users').get();
    let activeUsersHtml = '';
    let deletedUsersHtml = '';
    let activeCount = 0;
    let deletedCount = 0;

    snapshot.forEach((doc) => {
      const u = doc.data();
      const uid = doc.id;
      const status = u.status || 'approved';
      const role = u.role || 'customer';
      const type = u.accountType || 'business';

      if (status === 'deleted') {
        deletedCount++;
        deletedUsersHtml += `
          <tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition text-xs">
            <td class="p-3">
              <div class="font-bold text-slate-100">${u.name || 'N/A'}</div>
              <div class="text-[11px] text-amber-400">${u.businessName || 'N/A'}</div>
              <div class="text-[10px] text-slate-400">${u.phone || 'No Phone'}</div>
            </td>
            <td class="p-3 text-slate-300">${u.email || 'N/A'}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                type === 'business' ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30' : 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
              }">${type}</span>
            </td>
            <td class="p-3">
              <span class="px-2 py-1 rounded-full text-[10px] font-bold bg-rose-900/50 text-rose-300 border border-rose-500/30">DELETED / REJECTED</span>
            </td>
            <td class="p-3 text-center flex items-center justify-center gap-1">
              <button onclick="viewUserData('${uid}')" class="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2.5 py-1.5 rounded font-bold text-xs shadow transition flex items-center gap-1">
                <i class="fa-solid fa-eye"></i> View
              </button>
              <button onclick="restoreUser('${uid}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded font-bold text-xs shadow transition flex items-center gap-1">
                <i class="fa-solid fa-rotate-left"></i> Restore
              </button>
            </td>
          </tr>
        `;
      } else {
        activeCount++;
        activeUsersHtml += `
          <tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition text-xs">
            <td class="p-3">
              <div class="font-bold text-slate-100">${u.name || 'N/A'}</div>
              <div class="text-[11px] text-amber-400">${u.businessName || 'N/A'}</div>
              <div class="text-[10px] text-slate-400">${u.phone || 'No Phone'}</div>
            </td>
            <td class="p-3 text-slate-300">${u.email || 'N/A'}</td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                type === 'business' ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30' : 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
              }">${type}</span>
            </td>
            <td class="p-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                role === 'admin' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' : 'bg-slate-700 text-slate-300'
              }">${role}</span>
            </td>
            <td class="p-3">
              <span class="px-2 py-1 rounded-full text-[10px] font-bold ${
                status === 'approved' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' :
                status === 'pending' ? 'bg-amber-900/40 text-amber-400 border border-amber-500/30' :
                'bg-rose-900/40 text-rose-400 border border-rose-500/30'
              }">${status.toUpperCase()}</span>
            </td>
            <td class="p-3 text-center flex items-center justify-center gap-1.5">
              <button onclick="viewUserData('${uid}')" class="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2 py-1 rounded font-bold text-[11px] shadow transition flex items-center gap-1">
                <i class="fa-solid fa-eye"></i> View
              </button>
              <button onclick="updateUserStatus('${uid}', 'approved')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded font-bold text-[11px] shadow transition flex items-center gap-1">
                <i class="fa-solid fa-check"></i> Approve
              </button>
              <button onclick="updateUserStatus('${uid}', 'rejected')" class="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded font-bold text-[11px] shadow transition flex items-center gap-1">
                <i class="fa-solid fa-xmark"></i> Reject
              </button>
              <button onclick="softDeleteUser('${uid}')" title="Delete & Move to Archive" class="bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white px-2 py-1 rounded font-bold text-[11px] shadow transition flex items-center gap-1">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </td>
          </tr>
        `;
      }
    });

    if (cardActiveCount) cardActiveCount.innerText = activeCount;
    if (cardDeletedCount) cardDeletedCount.innerText = deletedCount;

    if (activeTableBody) {
      activeTableBody.innerHTML = activeUsersHtml !== '' ? activeUsersHtml : `<tr><td colspan="6" class="p-4 text-center text-slate-400">No active users found.</td></tr>`;
    }

    if (deletedTableBody) {
      deletedTableBody.innerHTML = deletedUsersHtml !== '' ? deletedUsersHtml : `<tr><td colspan="5" class="p-4 text-center text-slate-400">No deleted users in archive.</td></tr>`;
    }

  } catch (err) {
    console.error("Error loading users:", err);
  }
}

// View Specific User Details Modal
async function viewUserData(uid) {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) { alert("User record not found!"); return; }
    const u = userDoc.data();
    const docs = u.docs || {};

    const modalDetails = document.getElementById('modalUserDetails');
    const modalDocs = document.getElementById('modalUserDocs');
    const modalActions = document.getElementById('modalActions');

    if (modalDetails) {
      modalDetails.innerHTML = `
        <div><strong class="text-slate-400">Full Name:</strong> <span class="text-white font-bold">${u.name || 'N/A'}</span></div>
        <div><strong class="text-slate-400">Account Type:</strong> <span class="text-amber-400 font-bold uppercase">${u.accountType || 'business'}</span></div>
        <div><strong class="text-slate-400">Business Name:</strong> <span class="text-white">${u.businessName || 'N/A'}</span></div>
        <div><strong class="text-slate-400">Email:</strong> <span class="text-white">${u.email || 'N/A'}</span></div>
        <div><strong class="text-slate-400">Mobile / WhatsApp:</strong> <span class="text-white">${u.phone || 'N/A'}</span></div>
        <div><strong class="text-slate-400">CNIC No:</strong> <span class="text-white">${u.cnic || 'N/A'}</span></div>
        <div><strong class="text-slate-400">NTN No:</strong> <span class="text-white">${u.ntn || 'N/A'}</span></div>
        <div><strong class="text-slate-400">Bank Details:</strong> <span class="text-white">${u.bankDetails || 'N/A'}</span></div>
      `;
    }

    const renderDocPreview = (title, src) => {
      if (!src) return `<div class="bg-slate-900 p-3 rounded border border-slate-700 text-slate-500 text-center">No ${title} Provided</div>`;
      if (src.startsWith('data:application/pdf')) {
        return `<div class="bg-slate-900 p-3 rounded border border-slate-700"><p class="font-bold text-slate-300 text-xs mb-2">${title}</p><a href="${src}" download="${title}.pdf" class="bg-blue-600 text-white text-xs px-3 py-1.5 rounded inline-block">Download PDF</a></div>`;
      }
      return `<div class="bg-slate-900 p-2 rounded border border-slate-700"><p class="font-bold text-slate-300 text-xs mb-2">${title}</p><a href="${src}" target="_blank"><img src="${src}" class="w-full h-36 object-cover rounded hover:opacity-80 transition cursor-pointer border border-slate-800" /></a></div>`;
    };

    if (modalDocs) {
      modalDocs.innerHTML = `
        ${renderDocPreview('CNIC Front', docs.cnicFront)}
        ${renderDocPreview('CNIC Back', docs.cnicBack)}
        ${renderDocPreview('NTN Document', docs.ntnDoc)}
        ${renderDocPreview('Bank Cheque / Proof', docs.bankDoc)}
      `;
    }

    if (modalActions) {
      if (u.status === 'deleted') {
        modalActions.innerHTML = `<button onclick="restoreUser('${uid}'); closeModal();" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1"><i class="fa-solid fa-rotate-left"></i> Restore Account</button>`;
      } else {
        modalActions.innerHTML = `
          <button onclick="updateUserStatus('${uid}', 'approved'); closeModal();" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1"><i class="fa-solid fa-check"></i> Approve</button>
          <button onclick="updateUserStatus('${uid}', 'rejected'); closeModal();" class="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1"><i class="fa-solid fa-xmark"></i> Reject</button>
          <button onclick="softDeleteUser('${uid}'); closeModal();" class="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1"><i class="fa-solid fa-trash-can"></i> Archive</button>
        `;
      }
    }

    const modal = document.getElementById('userModal');
    if (modal) modal.classList.remove('hidden');

  } catch (err) {
    alert("Error fetching user data: " + err.message);
  }
}

// Soft Delete User
async function softDeleteUser(uid) {
  if (confirm("Move user to Deleted Users Archive?")) {
    try {
      await db.collection('users').doc(uid).update({ status: 'deleted' });
      loadUsersTable();
    } catch (err) { alert("Error: " + err.message); }
  }
}

// Restore User
async function restoreUser(uid) {
  if (confirm("Restore user to Active List?")) {
    try {
      await db.collection('users').doc(uid).update({ status: 'pending' });
      loadUsersTable();
    } catch (err) { alert("Error: " + err.message); }
  }
}

// Update User Status (Approve / Reject)
async function updateUserStatus(uid, newStatus) {
  try {
    await db.collection('users').doc(uid).update({ status: newStatus });
    alert(`Status updated to ${newStatus.toUpperCase()}!`);
    loadUsersTable();
  } catch (err) { alert("Error updating status: " + err.message); }
}

function closeModal() {
  const modal = document.getElementById('userModal');
  if (modal) modal.classList.add('hidden');
}

// Load Customer Parcels (Dashboard)
async function loadUserDashboard(uid) {
  const snapshot = await db.collection('parcels').where('userId', '==', uid).get();
  let total = 0, pending = 0, inTransit = 0, delivered = 0;
  const tableBody = document.getElementById('userParcelTable');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  if (snapshot.empty) {
    tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">No parcels booked yet.</td></tr>`;
  }

  snapshot.forEach((doc) => {
    const data = doc.data();
    total++;
    if (data.status === 'Pending') pending++;
    else if (data.status === 'In Transit') inTransit++;
    else if (data.status === 'Delivered') delivered++;

    tableBody.innerHTML += `
      <tr class="border-b hover:bg-slate-800/50 text-xs">
        <td class="p-3 font-bold font-mono text-amber-400">${data.trackId || 'N/A'}</td>
        <td class="p-3">${data.custName || 'N/A'}</td>
        <td class="p-3">${data.custCity || 'N/A'}</td>
        <td class="p-3 font-bold">PKR ${data.totalCod || 0}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
            data.status === 'Delivered' ? 'bg-green-900/50 text-green-300' :
            data.status === 'In Transit' ? 'bg-blue-900/50 text-blue-300' : 'bg-amber-900/50 text-amber-300'
          }">${data.status || 'Pending'}</span>
        </td>
      </tr>
    `;
  });

  if (document.getElementById('cardTotal')) document.getElementById('cardTotal').innerText = total;
  if (document.getElementById('cardPending')) document.getElementById('cardPending').innerText = pending;
  if (document.getElementById('cardInTransit')) document.getElementById('cardInTransit').innerText = inTransit;
  if (document.getElementById('cardDelivered')) document.getElementById('cardDelivered').innerText = delivered;
}

// Load Admin Parcels
async function loadAdminDashboard() {
  const snapshot = await db.collection('parcels').get();
  let totalParcels = 0, pendingParcels = 0;
  snapshot.forEach((doc) => {
    const data = doc.data();
    totalParcels++;
    if (data.status === 'Pending') pendingParcels++;
  });
  if (document.getElementById('cardTotalShipments')) document.getElementById('cardTotalShipments').innerText = totalParcels;
  if (document.getElementById('cardPendingParcels')) document.getElementById('cardPendingParcels').innerText = pendingParcels;
}

// Profile Editing
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
  const logoFile = document.getElementById('editLogoFile') ? document.getElementById('editLogoFile').files[0] : null;

  try {
    let updateData = { name: newName, businessName: newBusiness, phone: newPhone, address: newAddress };
    if (logoFile) {
      const logoBase64 = await fileToBase64(logoFile, 400, 0.7);
      updateData.logoUrl = logoBase64;
    }
    await db.collection('users').doc(user.uid).update(updateData);
    alert("Profile Updated Successfully! ✨");
    closeProfileModal();
    location.reload();
  } catch (err) { alert("Error updating profile: " + err.message); }
}

// Logout
function handleLogout() {
  auth.signOut().then(() => { window.location.href = 'login.html'; });
}

// Auth Listener
auth.onAuthStateChanged(async (user) => {
  const path = window.location.pathname;
  if (user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};
    if (document.getElementById('userNameDisplay')) {
      document.getElementById('userNameDisplay').innerText = userData.name || user.email;
    }
    if (path.includes('dashboard.html')) loadUserDashboard(user.uid);
    else if (path.includes('admin.html')) { loadAdminDashboard(); loadUsersTable(); }
  } else {
    if (path.includes('dashboard.html') || path.includes('admin.html')) window.location.href = 'login.html';
  }
});
