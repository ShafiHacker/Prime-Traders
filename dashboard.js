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

// User Registration
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const pass = document.getElementById('regPassword').value;
    const msg = document.getElementById('authMsg');

    try {
        const userCred = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection('users').doc(userCred.user.uid).set({
            name: name,
            email: email,
            phone: phone,
            role: 'customer',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        window.location.href = 'dashboard.html';
    } catch (err) {
        msg.innerText = err.message;
        msg.classList.remove('hidden');
    }
}

// User Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    const msg = document.getElementById('authMsg');

    try {
        const userCred = await auth.signInWithEmailAndPassword(email, pass);
        const userDoc = await db.collection('users').doc(userCred.user.uid).get();
        const userData = userDoc.data();

        if (userData && userData.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        msg.innerText = err.message;
        msg.classList.remove('hidden');
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
    if (!ctx) return;
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
    if (!ctx) return;
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
// ==========================================
// 5-MINUTE AUTOMATIC LOGOUT ON INACTIVITY
// ==========================================
(function() {
  const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 Minutes in milliseconds
  let inactivityTimer;

  // Function to perform auto logout
  function autoLogout() {
    firebase.auth().signOut().then(() => {
      alert("Aap 5 minute se inactive thay, is liye safety ke liye automatic logout kar diya gaya hai.");
      window.location.href = "login.html";
    }).catch((error) => {
      console.error("Auto logout error:", error);
    });
  }

  // Function to reset timer on user activity
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(autoLogout, TIMEOUT_DURATION);
  }

  // Listen for user interactions
  window.addEventListener('mousemove', resetInactivityTimer);
  window.addEventListener('keypress', resetInactivityTimer);
  window.addEventListener('click', resetInactivityTimer);
  window.addEventListener('scroll', resetInactivityTimer);

  // Initialize timer on page load
  resetInactivityTimer();
})();
// --- Pending Approval & Registration Handler ---
async function handleSignUp(e) {
  if (e) e.preventDefault();
  
  const email = document.getElementById("regEmail") ? document.getElementById("regEmail").value : "";
  const password = document.getElementById("regPassword") ? document.getElementById("regPassword").value : "";
  const phone = document.getElementById("regPhone") ? document.getElementById("regPhone").value : "";

  try {
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await firebase.firestore().collection("users").doc(user.uid).set({
      uid: user.uid,
      email: email,
      phone: phone,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await firebase.auth().signOut();
    alert("Aapka account register ho gaya hai! Admin approval ke baad 24 ghante ke andar aapki email par notification bhej diya jayega.");

  } catch (error) {
    alert("Registration Error: " + error.message);
  }
}

// --- Login Check for Pending Status ---
async function handleLogin(email, password) {
  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();

      if (userData.status === "pending") {
        await firebase.auth().signOut();
        alert("Aapka account abhi pending hai. Admin approval ke baad activate hoga.");
        return;
      }

      if (userData.status === "rejected") {
        await firebase.auth().signOut();
        alert("Aapki registration request reject ho chuki hai.");
        return;
      }

      window.location.href = "dashboard.html";
    }
  } catch (error) {
    alert("Login Error: " + error.message);
  }
}
