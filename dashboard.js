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

// Tab Switcher
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

// Account Type Switcher
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

// Enter Key Login Listener
document.addEventListener("DOMContentLoaded", () => {
  const loginPass = document.getElementById("loginPassword");
  const loginEmail = document.getElementById("loginEmail");
  if (loginPass) loginPass.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); handleLogin(e); } });
  if (loginEmail) loginEmail.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); handleLogin(e); } });
});

// Profile Editing Functions (User & Admin)
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
  } catch (err) {
    alert("Error updating profile: " + err.message);
  }
}

// User Logout
function handleLogout() {
  auth.signOut().then(() => { window.location.href = 'login.html'; });
}

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
  const path = window.location.pathname;
  if (user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data() || {};
    if (document.getElementById('userNameDisplay')) {
      document.getElementById('userNameDisplay').innerText = userData.name || user.email;
    }
    if (path.includes('dashboard.html')) loadUserDashboard(user.uid);
    else if (path.includes('admin.html')) { loadAdminDashboard(); loadUsersTable('active'); }
  } else {
    if (path.includes('dashboard.html') || path.includes('admin.html')) window.location.href = 'login.html';
  }
});
