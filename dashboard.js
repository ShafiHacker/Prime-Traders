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

// Helper: Convert File Object to Base64 String
const fileToBase64 = file => new Promise((resolve, reject) => {
  if (!file) return resolve("");
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

// EmailJS Notification Function
function sendEmailNotification(messageText) {
  const serviceID = "primetraders.express";
  const templateID = "7te01mn";

  const templateParams = {
    message_text: messageText
  };

  if (typeof emailjs !== "undefined") {
    emailjs.send(serviceID, templateID, templateParams)
      .then(() => {
        console.log('Email Notification Sent Successfully!');
      }, (err) => {
        console.error('Email Notification Failed:', err);
      });
  }
}

// User Registration Handler with Document Upload Support
async function handleRegister(e) {
  if (e && e.preventDefault) e.preventDefault();
  
  const submitBtn = document.getElementById('regSubmitBtn');
  const authMsg = document.getElementById('authMsg');

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing & Uploading...";
  }

  const accountType = document.getElementById('regAccountType') ? document.getElementById('regAccountType').value : 'business';
  const name = document.getElementById('regName') ? document.getElementById('regName').value.trim() : "";
  const businessName = document.getElementById('regBusinessName') ? document.getElementById('regBusinessName').value.trim() : "";
  const email = document.getElementById('regEmail') ? document.getElementById('regEmail').value.trim() : "";
  const phone = document.getElementById('regPhone') ? document.getElementById('regPhone').value.trim() : "";
  const cnic = document.getElementById('regCNIC') ? document.getElementById('regCNIC').value.trim() : "";
  const ntn = document.getElementById('regNTN') ? document.getElementById('regNTN').value.trim() : "";
  const bank = document.getElementById('regBank') ? document.getElementById('regBank').value.trim() : "";
  const pass = document.getElementById('regPassword') ? document.getElementById('regPassword').value : "";

  // Files
  const fCnicFront = document.getElementById('fileCnicFront') ? document.getElementById('fileCnicFront').files[0] : null;
  const fCnicBack = document.getElementById('fileCnicBack') ? document.getElementById('fileCnicBack').files[0] : null;
  const fNTN = document.getElementById('fileNTN') ? document.getElementById('fileNTN').files[0] : null;
  const fBank = document.getElementById('fileBank') ? document.getElementById('fileBank').files[0] : null;

  try {
    // Convert documents to Base64 strings for direct Firestore persistence
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
      cnic: cnic,
      ntn: accountType === 'business' ? ntn : 'N/A',
      bankDetails: bank,
      docs: {
        cnicFront: cnicFrontBase64,
        cnicBack: cnicBackBase64,
        ntnDoc: accountType === 'business' ? ntnDocBase64 : '',
        bankDoc: bankDocBase64
      },
      role: 'customer',
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    sendEmailNotification(`🔔 Prime Traders - New ${accountType.toUpperCase()} Account Registration\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nStatus: Pending Approval`);

    await auth.signOut();
    alert("Account Under Verification ⏳\n\nYour account and document proofs have been submitted successfully and are currently under review by the admin.");
    window.location.href = "login.html";

  } catch (err) {
    if (authMsg) {
      authMsg.innerText = err.message;
      authMsg.classList.remove('hidden');
    } else {
      alert("Registration Error: " + err.message);
    }
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = "Create Account";
    }
  }
}

// Unified Login Handler
async function handleLogin(e) {
  if (e && e.preventDefault) e.preventDefault();

  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const authMsg = document.getElementById('authMsg');

  if (!emailInput || !passwordInput) {
    alert("Error: Login fields missing in HTML.");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Direct Bypass for Admin Email
    if (email === "admin@primetraders.com") {
      window.location.href = "admin.html";
      return;
    }

    // Fetch User Data from Firestore
    const userDoc = await db.collection("users").doc(user.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();

      if (userData.role === "admin") {
        window.location.href = "admin.html";
        return;
      }

      if (userData.status === "pending") {
        await auth.signOut();
        alert("Account Under Verification ⏳\n\nYour account is currently under review by the admin team.");
        return;
      }

      if (userData.status === "rejected") {
        await auth.signOut();
        alert("Account Rejected ❌\n\nYour registration request has been rejected.");
        return;
      }

      sendEmailNotification(`🔓 Prime Traders - User Login Alert\nEmail: ${email}\nTime: ${new Date().toLocaleString()}`);
      window.location.href = "dashboard.html";

    } else {
      window.location.href = "dashboard.html";
    }

  } catch (error) {
    if (authMsg) {
      authMsg.innerText = error.message;
      authMsg.classList.remove('hidden');
    } else {
      alert("Login Error: " + error.message);
    }
  }
}

// User Logout
function handleLogout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  });
}

// Global Auth State Listener
auth.onAuthStateChanged(async (user) => {
  const path = window.location.pathname;

  if (user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};

    if (document.getElementById('userNameDisplay')) {
      document.getElementById('userNameDisplay').innerText = userData.name || user.email;
    }

    if (path.includes('dashboard.html')) {
      loadUserDashboard(user.uid);
    } else if (path.includes('admin.html')) {
      loadAdminDashboard();
    }
  } else {
    if (path.includes('dashboard.html') || path.includes('admin.html')) {
      window.location.href = 'login.html';
    }
  }
});

// Load Customer Statistics & Graphs
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
      <tr class="border-b hover:bg-slate-50">
        <td class="p-3.5 font-bold font-mono">${data.trackId || 'N/A'}</td>
        <td class="p-3.5">${data.custName || 'N/A'}</td>
        <td class="p-3.5">${data.custCity || 'N/A'}</td>
        <td class="p-3.5 font-bold">PKR ${data.totalCod || 0}</td>
        <td class="p-3.5">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
            data.status === 'Delivered' ? 'bg-green-100 text-green-700' :
            data.status === 'In Transit' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          }">${data.status || 'Pending'}</span>
        </td>
      </tr>
    `;
  });

  if (document.getElementById('cardTotal')) document.getElementById('cardTotal').innerText = total;
  if (document.getElementById('cardPending')) document.getElementById('cardPending').innerText = pending;
  if (document.getElementById('cardInTransit')) document.getElementById('cardInTransit').innerText = inTransit;
  if (document.getElementById('cardDelivered')) document.getElementById('cardDelivered').innerText = delivered;

  renderPieChart(pending, inTransit, delivered);
  renderBarChart(total);
}

// Render Pie Chart
function renderPieChart(p, t, d) {
  const ctx = document.getElementById('statusPieChart');
  if (!ctx || typeof Chart === "undefined") return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'In Transit', 'Delivered'],
      datasets: [{
        data: [p, t, d],
        backgroundColor: ['#d97706', '#2563eb', '#059669']
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

// Render Bar Chart
function renderBarChart(total) {
  const ctx = document.getElementById('monthlyBarChart');
  if (!ctx || typeof Chart === "undefined") return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Current Month'],
      datasets: [{
        label: 'Total Shipments',
        data: [total],
        backgroundColor: '#1e3a8a'
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

// Load Admin Panel Data
async function loadAdminDashboard() {
  const snapshot = await db.collection('parcels').get();
  const tableBody = document.getElementById('adminParcelTable');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  snapshot.forEach((doc) => {
    const data = doc.data();
    tableBody.innerHTML += `
      <tr class="border-b border-slate-700">
        <td class="p-3 font-bold font-mono text-amber-400">${data.trackId || 'N/A'}</td>
        <td class="p-3">${data.senderName || 'Merchant'}</td>
        <td class="p-3">${data.custName || 'N/A'} (${data.custCity || ''})</td>
        <td class="p-3 font-bold">PKR ${data.totalCod || 0}</td>
        <td class="p-3">
          <select onchange="updateStatus('${doc.id}', this.value)" class="bg-slate-900 border border-slate-600 text-xs text-white p-1 rounded">
            <option value="Pending" ${data.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="In Transit" ${data.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
            <option value="Delivered" ${data.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          </select>
        </td>
        <td class="p-3">
          <button onclick="deleteParcel('${doc.id}')" class="text-red-400 hover:text-red-300 text-xs"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

// Update Parcel Status (Admin Action)
async function updateStatus(docId, newStatus) {
  try {
    await db.collection('parcels').doc(docId).update({ status: newStatus });
    alert('Status updated successfully!');
  } catch (err) {
    alert('Error updating status: ' + err.message);
  }
}

// Delete Parcel Record (Admin Action)
async function deleteParcel(docId) {
  if (confirm('Are you sure you want to delete this parcel?')) {
    try {
      await db.collection('parcels').doc(docId).delete();
      loadAdminDashboard();
    } catch (err) {
      alert('Error deleting parcel: ' + err.message);
    }
  }
}

// Automatic 5-Minute Inactivity Logout
(function() {
  const TIMEOUT_DURATION = 5 * 60 * 1000;
  let inactivityTimer;

  function autoLogout() {
    auth.signOut().then(() => {
      alert("Aap 5 minute se inactive thay, safety ke liye automatic logout kar diya gaya hai.");
      window.location.href = "login.html";
    }).catch((error) => {
      console.error("Auto logout error:", error);
    });
  }

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(autoLogout, TIMEOUT_DURATION);
  }

  window.addEventListener('mousemove', resetInactivityTimer);
  window.addEventListener('keypress', resetInactivityTimer);
  window.addEventListener('click', resetInactivityTimer);
  window.addEventListener('scroll', resetInactivityTimer);

  resetInactivityTimer();
})();

// ==========================================
// LOAD REGISTERED USERS DIRECTORY (ADMIN)
// ==========================================
async function loadUsersTable() {
  const tableBody = document.getElementById('userTableBody') || document.querySelector('tbody');
  const userCardCount = document.getElementById('cardUsers') || document.getElementById('totalUsersCount');

  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Loading users list...</td></tr>`;

  try {
    const snapshot = await db.collection('users').get();
    tableBody.innerHTML = '';

    if (snapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">No registered users found.</td></tr>`;
      if (userCardCount) userCardCount.innerText = '0';
      return;
    }

    if (userCardCount) userCardCount.innerText = snapshot.size;

    snapshot.forEach((doc) => {
      const u = doc.data();
      const uid = doc.id;
      const status = u.status || 'approved';
      const role = u.role || 'customer';
      const type = u.accountType || 'business';

      tableBody.innerHTML += `
        <tr class="border-b border-slate-700/50 hover:bg-slate-800/50 transition text-xs">
          <td class="p-3.5">
            <div class="font-bold text-slate-100">${u.name || 'N/A'}</div>
            <div class="text-[11px] text-amber-400">${u.businessName || 'N/A'}</div>
            <div class="text-[10px] text-slate-400">${u.phone || 'No Phone'}</div>
          </td>
          <td class="p-3.5 text-slate-300">${u.email || 'N/A'}</td>
          <td class="p-3.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
              type === 'business' ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30' : 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
            }">${type}</span>
          </td>
          <td class="p-3.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
              role === 'admin' ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30' : 'bg-slate-700 text-slate-300'
            }">${role}</span>
          </td>
          <td class="p-3.5">
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 rounded-full text-[10px] font-bold ${
                status === 'approved' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' :
                status === 'pending' ? 'bg-amber-900/40 text-amber-400 border border-amber-500/30' :
                'bg-rose-900/40 text-rose-400 border border-rose-500/30'
              }">${status.toUpperCase()}</span>
              
              ${role !== 'admin' ? `
                <select onchange="updateUserStatus('${uid}', this.value)" class="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-amber-400">
                  <option value="approved" ${status === 'approved' ? 'selected' : ''}>Approve</option>
                  <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
                  <option value="rejected" ${status === 'rejected' ? 'selected' : ''}>Reject</option>
                </select>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("Error loading users:", err);
    tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-rose-400">Error loading users: ${err.message}</td></tr>`;
  }
}

// Update User Account Status (Approve / Reject)
async function updateUserStatus(uid, newStatus) {
  try {
    await db.collection('users').doc(uid).update({ status: newStatus });
    alert(`User status updated to ${newStatus.toUpperCase()} successfully!`);
    loadUsersTable();
  } catch (err) {
    alert("Error updating status: " + err.message);
  }
}

// Global Tab Handler for Admin
function showAdminTab(tabName) {
  if (tabName === 'users') {
    loadUsersTable();
  } else if (tabName === 'parcels') {
    loadAdminDashboard();
  }
}
