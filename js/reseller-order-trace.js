// js/reseller-order-trace.js
(function initResellerOrderTrace() {
  const STORAGE_KEY = "pt_reseller_orders_trace_v1";

  function readLocalOrders() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (_) {
      return [];
    }
  }

  function writeLocalOrders(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  window.ptTraceResellerOrder = async function (reseller, containerEl) {
    const inputs = containerEl ? Array.from(containerEl.querySelectorAll("input, textarea")) : [];
    const customerName =
      (inputs.find((i) => /name/i.test(i.placeholder || i.name || i.id || ""))?.value || "").trim();
    const phone =
      (inputs.find((i) => /phone|mobile|03/i.test(i.placeholder || i.name || i.id || ""))?.value || "").trim();
    const city =
      (inputs.find((i) => /city/i.test(i.placeholder || i.name || i.id || ""))?.value || "").trim();
    const address =
      (inputs.find((i) => /address|house|street/i.test(i.placeholder || i.name || i.id || ""))?.value || "").trim();

    const record = {
      id: "ORD-" + Date.now(),
      resellerUid: reseller.uid || "",
      resellerEmail: (reseller.email || "").toLowerCase(),
      resellerName: reseller.resellerName || reseller.email || "Reseller",
      parcelRecipient: customerName || "N/A",
      parcelPhone: phone || "N/A",
      parcelCity: city || "N/A",
      parcelAddress: address || "N/A",
      createdAt: new Date().toISOString()
    };

    const existing = readLocalOrders();
    existing.unshift(record);
    writeLocalOrders(existing);

    if (window.firebase && firebase.firestore) {
      try {
        await firebase.firestore().collection("reseller_orders").doc(record.id).set(record);
      } catch (e) {
        console.warn("Firestore reseller_orders write skipped:", e.message);
      }
    }

    return record;
  };

  window.ptGetResellerOrders = async function (filterEmail) {
    const normalized = (filterEmail || "").trim().toLowerCase();
    let combined = readLocalOrders();

    if (window.firebase && firebase.firestore) {
      try {
        const snap = await firebase.firestore().collection("reseller_orders").get();
        const remote = snap.docs.map((d) => d.data());
        const byId = new Map();
        [...remote, ...combined].forEach((item) => {
          if (item && item.id) byId.set(item.id, item);
        });
        combined = Array.from(byId.values());
      } catch (_) {}
    }

    if (!normalized) return combined;
    return combined.filter((o) => (o.resellerEmail || "").toLowerCase() === normalized);
  };
})();
