document.addEventListener('DOMContentLoaded', () => {
  // 1. Copy Tracking ID to clipboard
  const copyBtns = document.querySelectorAll('.btn-copy-tracking');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const trackingId = btn.getAttribute('data-tracking-id');
      if (trackingId) {
        navigator.clipboard.writeText(trackingId).then(() => {
          const originalText = btn.innerHTML;
          btn.innerHTML = '<i class="bi bi-check2"></i> Copied!';
          btn.classList.remove('btn-outline-primary', 'btn-outline-secondary');
          btn.classList.add('btn-success');
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-primary');
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy tracking ID:', err);
        });
      }
    });
  });

  // 2. Dynamic Delivery Charge Estimator on Booking Form
  const receiverPincodeInput = document.getElementById('receiverPincode');
  const weightInput = document.getElementById('weight');
  const estimateDisplay = document.getElementById('estimateDisplay');
  const estimateZone = document.getElementById('estimateZone');
  const estimateCharge = document.getElementById('estimateCharge');
  const estimateFormula = document.getElementById('estimateFormula');

  async function fetchLiveEstimate() {
    if (!receiverPincodeInput || !weightInput || !estimateDisplay) return;

    const pincode = receiverPincodeInput.value.trim();
    const weight = parseFloat(weightInput.value);

    if (pincode.length >= 4 && weight > 0) {
      try {
        const res = await fetch(`/customer/estimate?pincode=${encodeURIComponent(pincode)}&weight=${encodeURIComponent(weight)}`);
        if (res.ok) {
          const data = await res.json();
          estimateDisplay.classList.remove('d-none');
          if (estimateZone) estimateZone.innerText = data.zoneName;
          if (estimateCharge) estimateCharge.innerText = `₹${data.charge}`;
          if (estimateFormula) {
            estimateFormula.innerText = `Base ₹${data.baseFee} + (${weight} kg × ₹${data.perKgRate}/kg)`;
          }
        }
      } catch (err) {
        console.error('Error fetching live estimate:', err);
      }
    } else if (estimateDisplay) {
      estimateDisplay.classList.add('d-none');
    }
  }

  if (receiverPincodeInput && weightInput) {
    receiverPincodeInput.addEventListener('input', fetchLiveEstimate);
    weightInput.addEventListener('input', fetchLiveEstimate);
  }

  // 3. Auto-dismiss flash alerts after 5 seconds
  setTimeout(() => {
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(alert => {
      const bsAlert = bootstrap.Alert.getInstance(alert) || new bootstrap.Alert(alert);
      bsAlert.close();
    });
  }, 5000);
});
