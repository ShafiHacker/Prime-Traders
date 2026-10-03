// Prime Traders Custom Script

// Auto Generate Tracking ID on COD Form Load
document.addEventListener("DOMContentLoaded", function() {
    const trackInput = document.getElementById('customTrackId');
    if (trackInput) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        trackInput.value = 'PT-' + randomNum;
    }
});

// Calculate Total COD Amount
function calculateTotal() {
    const prodAmt = parseFloat(document.getElementById('prodAmount').value) || 0;
    const delAmt = parseFloat(document.getElementById('delCharges').value) || 0;
    const total = prodAmt + delAmt;
    const totalDisplay = document.getElementById('totalCodDisplay');
    if (totalDisplay) {
        totalDisplay.innerText = 'PKR ' + total.toLocaleString();
    }
}

// Generate Printable Slip
function generateSlip(e) {
    e.preventDefault();
    
    const custName = document.getElementById('custName').value;
    const custPhone = document.getElementById('custPhone').value;
    const custPhone2 = document.getElementById('custPhone2').value;
    const custAddress = document.getElementById('custAddress').value;
    const custCity = document.getElementById('custCity').value;
    const prodDesc = document.getElementById('prodDesc').value;
    const parcelWeight = document.getElementById('parcelWeight').value;
    const trackId = document.getElementById('customTrackId').value;
    const riderNote = document.getElementById('riderNote').value;

    const prodAmt = parseFloat(document.getElementById('prodAmount').value) || 0;
    const delAmt = parseFloat(document.getElementById('delCharges').value) || 0;
    const total = prodAmt + delAmt;

    // Set Values to Slip
    document.getElementById('slipTrackId').innerText = trackId;
    document.getElementById('slipCustName').innerText = custName;
    document.getElementById('slipCustPhone').innerText = custPhone + (custPhone2 ? ' / ' + custPhone2 : '');
    document.getElementById('slipCustAddress').innerText = custAddress;
    document.getElementById('slipCustCity').innerText = 'City: ' + custCity;
    document.getElementById('slipProdDesc').innerText = prodDesc;
    document.getElementById('slipWeight').innerText = parcelWeight + ' Kg';
    document.getElementById('slipTotalCod').innerText = 'PKR ' + total.toLocaleString();
    document.getElementById('slipRiderNote').innerText = riderNote;

    // Show Printable Slip
    const wrapper = document.getElementById('printableSlipWrapper');
    wrapper.classList.remove('hidden');
    wrapper.scrollIntoView({ behavior: 'smooth' });
}

// Track Parcel Logic
function trackParcel() {
    const id = document.getElementById('trackingId').value.trim();
    const resultDiv = document.getElementById('trackingResult');
    
    if(!id) {
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = "<span class='text-red-600 font-semibold'>Please enter a valid Tracking ID!</span>";
        return;
    }

    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `<span class='font-bold text-brandBlue'>Status for [${id}]:</span> In Transit - Package dispatched and heading to destination hub.`;
}