// OCR UI + Parsing + Rentalbook integration

// Reusable modal confirm με Bootstrap
function showConfirm(message, yesText = 'Ναι', noText = 'Άκυρο') {
  return new Promise((resolve) => {
    const modalEl = document.getElementById('confirmModal');
    const msgEl = document.getElementById('confirmModalMessage');
    const yesBtn = document.getElementById('confirmModalYes');
    const noBtn = document.getElementById('confirmModalNo');

    // fallback αν για κάποιο λόγο λείπει το modal
    if (!modalEl || !msgEl || !yesBtn || !noBtn || typeof bootstrap === 'undefined') {
      const res = window.confirm(message);
      resolve(res);
      return;
    }

    msgEl.textContent = message;
    yesBtn.textContent = yesText;
    noBtn.textContent = noText;

    const bsModal = new bootstrap.Modal(modalEl);

    const cleanup = () => {
      yesBtn.onclick = null;
      noBtn.onclick = null;
      modalEl.removeEventListener('hidden.bs.modal', onHide);
    };

    const onHide = () => {
      cleanup();
      resolve(false);
    };

    yesBtn.onclick = () => {
      cleanup();
      bsModal.hide();
      resolve(true);
    };

    noBtn.onclick = () => {
      cleanup();
      bsModal.hide();
      resolve(false);
    };

    modalEl.addEventListener('hidden.bs.modal', onHide);

    bsModal.show();
  });

}


// --------------------------------------
// main.js - OCR app (Camera + Upload + Vision + Parsing)
// --------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  console.log('App loaded');


  // -----------------------------
  // DOM Elements
  // -----------------------------
  const startCameraButton = document.getElementById('startCamera');
  const captureButton = document.getElementById('capture');
  const imageUpload = document.getElementById('imageUpload');
  const runVisionButton = document.getElementById('runVision');
  const downloadBtn = document.getElementById('downloadImage');
  const saveServerBtn = document.getElementById('saveToServer');

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const capturedDiv = document.getElementById('captured');
  const ocrResult = document.getElementById('ocrResult');
  const messageDiv = document.getElementById('message');
  const docSelector = document.getElementById('docSelector');

  const addDocumentBtn = document.getElementById('addDocument');
  const documentsListContainer = document.getElementById('documentsListContainer');
  const documentsList = document.getElementById('documentsList');

  const scanMoreBtn = document.getElementById('scanMore');
  const scanMoreWrapper = document.getElementById('scanMoreWrapper');

  const docDetailsCard = document.getElementById('docDetailsCard');

  const registerClientBtn = document.getElementById('registerClientData');


  const clientDataCollapse = document.getElementById('clientDataCollapse');
  const clientCollapseArrow = document.getElementById('clientCollapseArrow');
  // Inputs του footer (editable πίνακας "Στοιχεία πελάτη")
  const clientSurnameInput = document.getElementById('clientSurnameInput');
  const clientNameInput = document.getElementById('clientNameInput');
  const clientEmailFooterInput = document.getElementById('clientEmailInputFooter');
  const clientLicenseNumberInput = document.getElementById('clientLicenseNumberInput');
  const clientIdCardNumberInput = document.getElementById('clientIdCardNumberInput');
  const clientPassportNumberInput = document.getElementById('clientPassportNumberInput');
  const clientBirthDateInput = document.getElementById('clientBirthDateInput');
  const clientBirthPlaceInput = document.getElementById('clientBirthPlaceInput');
  const clientLicenseIssueDateInput = document.getElementById('clientLicenseIssueDateInput');
  const clientLicenseExpiryDateInput = document.getElementById('clientLicenseExpiryDateInput');
  const clientPassportNationalityInput = document.getElementById('clientPassportNationalityInput');
  const clientPassportIssuingCountryInput = document.getElementById('clientPassportIssuingCountryInput');
  const clientPassportExpiryDateInput = document.getElementById('clientPassportExpiryDateInput');


  const clientSurnameCell = document.getElementById('clientSurnameCell');
  const clientNameCell = document.getElementById('clientNameCell');
  const clientEmailCell = document.getElementById('clientEmailCell');
  const clientLicenseCell = document.getElementById('clientLicenseCell');
  const clientIdOrPassportCell = document.getElementById('clientIdOrPassportCell');
  const clientBirthDateCell = document.getElementById('clientBirthDateCell');
  const clientNationalityCell = document.getElementById('clientNationalityCell');
  const clientIssuingCountryCell = document.getElementById('clientIssuingCountryCell');

  const clientSexInput = document.getElementById('clientSexInput');

  const clientIdNationalityInput = document.getElementById('clientIdNationalityInput');
  const clientIdIssuingCountryInput = document.getElementById('clientIdIssuingCountryInput');
  const clientIdExpiryDateInput = document.getElementById('clientIdExpiryDateInput');
  const clientPhoneInput = document.getElementById('clientPhoneInput');

  const clientIdentificationIssueDateInput = document.getElementById('clientIdentificationIssueDateInput');
  const clientIdentificationExpiryDateInput = document.getElementById('clientIdentificationExpiryDateInput');
  const clientIdentificationCountryInput = document.getElementById('clientIdentificationCountryInput');


function setStarForInput(inputEl, showStar) {
  if (!inputEl) return;
  const tr = inputEl.closest('tr');
  if (!tr) return;
  const labelTd = tr.querySelector('td');
  if (!labelTd) return;

  let txt = (labelTd.textContent || '').replace(/\s*\*+\s*$/, '').trim(); // αφαιρεί trailing *
  if (showStar) txt += ' *';
  labelTd.textContent = txt;
}

function syncIdPassportStars() {
  const idVal = (clientIdCardNumberInput?.value || '').trim();
  const passVal = (clientPassportNumberInput?.value || '').trim();

  if (!idVal && !passVal) {
    // κανένα → και τα δύο *
    setStarForInput(clientIdCardNumberInput, true);
    setStarForInput(clientPassportNumberInput, true);
    return;
  }

  if (idVal && passVal) {
    // και τα δύο → * ΜΕΝΕΙ στην ταυτότητα (όπως θες)
    setStarForInput(clientIdCardNumberInput, true);
    setStarForInput(clientPassportNumberInput, false);
    return;
  }

  if (idVal) {
    setStarForInput(clientIdCardNumberInput, true);
    setStarForInput(clientPassportNumberInput, false);
  } else {
    setStarForInput(clientIdCardNumberInput, false);
    setStarForInput(clientPassportNumberInput, true);
  }
}

// Mobile-friendly events
['input','change','blur'].forEach(evt => {
  clientIdCardNumberInput?.addEventListener(evt, syncIdPassportStars);
  clientPassportNumberInput?.addEventListener(evt, syncIdPassportStars);
});

// αρχικό sync
syncIdPassportStars();

// προαιρετικό: για να μπορείς να το καλείς από παντού
window.syncIdPassportStars = syncIdPassportStars;





  const sendClientBtn = document.getElementById('sendClientData');

  if (docDetailsCard) {
    docDetailsCard.style.display = 'none';
  }

  if (scanMoreWrapper) {
    scanMoreWrapper.style.display = 'block';
  }

  // Στοιχεία πελάτη που γεμίζουμε από τα έγγραφα
  const clientData = {
    surname: '',
    name: '',
    email: '',
    driver_license_number: '',
    id_card_number: '',
    passport_number: '',
    birth_date: '',
    birth_place: '',
    license_issue_date: '',
    license_expiry_date: '',
    passport_nationality: '',
    passport_issuing_country: '',
    passport_expiry_date: '',
    sex: '',
    id_card_nationality: '',
    id_card_issuing_country: '',
    id_card_expiry_date: '',
    passport_sex: '',
  };



  // Κρύβουμε τα global κουμπιά λήψης/αποθήκευσης
  if (downloadBtn) downloadBtn.style.display = 'none';
  if (saveServerBtn) saveServerBtn.style.display = 'none';


  let stream = null;  // ροή κάμερας


  // Multi-document state: doc1 = π.χ. Δίπλωμα, doc2 = π.χ. Διαβατήριο
  const docs = {
    doc1: {
      imageDataUrl: null,
      rawText: '',
      parsed: null
    },
    doc2: {
      imageDataUrl: null,
      rawText: '',
      parsed: null
    }
  };

  let currentDocKey = 'doc1';

  function getCurrentDoc() {
    return docs[currentDocKey];
  }

  // Ανανεώνει UI (εικόνα, raw text, πεδία) με βάση το επιλεγμένο doc
  function refreshUiFromCurrentDoc() {
    const doc = getCurrentDoc();

    // Προεπισκόπηση εικόνας
    capturedDiv.innerHTML = '';
    if (doc.imageDataUrl) {
      const img = document.createElement('img');
      img.src = doc.imageDataUrl;
      capturedDiv.appendChild(img);
      runVisionButton.disabled = false;
      downloadBtn.disabled = false;
      saveServerBtn.disabled = false;
    } else {
      capturedDiv.textContent = 'Δεν έχει φορτωθεί ακόμη εικόνα για αυτό το έγγραφο.';
      runVisionButton.disabled = true;
      downloadBtn.disabled = true;
      saveServerBtn.disabled = true;
    }

    // Raw OCR text
    ocrResult.textContent = doc.rawText || '';

    // Parsed fields
    if (doc.parsed) {
      renderParsedFields(doc.parsed);
    } else {
      const parsedFieldsDiv = document.getElementById('parsedFields');
      if (parsedFieldsDiv) {
        parsedFieldsDiv.innerHTML = `
          <span class="text-muted" style="font-size: 13px;">
            Δεν έχουν φορτωθεί ακόμα στοιχεία για αυτό το έγγραφο.
          </span>
        `;
      }
      const label = document.getElementById('docTypeLabel');
      if (label) {
        label.textContent = 'Τύπος εγγράφου: —';
      }
    }
  }

  // Αν υπάρχει selector για έγγραφα, αλλάζουμε τρέχον doc
  if (docSelector) {
    docSelector.addEventListener('change', () => {
      currentDocKey = docSelector.value || 'doc1';
      refreshUiFromCurrentDoc();
    });
  }


  // Αρχικά κρυφό το capture
  captureButton.style.display = 'none';
  captureButton.disabled = true;

  // -----------------------------
  // Άνοιγμα κάμερας (mobile-friendly)
  // -----------------------------
  async function startCamera() {
    try {
      messageDiv.style.color = 'black';
      messageDiv.textContent = 'Προσπάθεια για κάμερα...';

      // Προσπάθεια με back camera όπου γίνεται
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      video.srcObject = stream;
      captureButton.disabled = false;
      captureButton.style.display = 'inline-block';

      messageDiv.style.color = 'green';
      messageDiv.textContent = 'Η κάμερα άνοιξε.';
    } catch (e) {
      console.warn('Back camera failed, trying any camera', e);
      try {
        // Fallback: οποιαδήποτε κάμερα
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        video.srcObject = stream;
        captureButton.disabled = false;
        captureButton.style.display = 'inline-block';

        messageDiv.style.color = 'green';
        messageDiv.textContent = 'Η κάμερα άνοιξε (fallback).';
      } catch (err) {
        console.error(err);
        alert('Παρουσιάστηκε σφάλμα κατά το άνοιγμα της κάμερας.');
      }
    }
  }

  startCameraButton.addEventListener('click', () => {
    startCamera();
  });

  // -----------------------------
  // Capture από την κάμερα με κεντρικό crop (για έγγραφο)
  // -----------------------------
  captureButton.addEventListener('click', () => {
    if (!stream) {
      alert('Δεν υπάρχει ενεργή κάμερα.');
      return;
    }

    const ctx = canvas.getContext('2d');

    // Ζωγραφίζουμε ΠΡΩΤΑ το full frame από την κάμερα στο κρυφό canvas
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Διαστάσεις πλήρους εικόνας
    const fullW = canvas.width;
    const fullH = canvas.height;

    // Αναλογία ταυτότητας/διπλώματος (περίπου 1.6 : 1)
    const targetRatio = 1.6;

    // Υπολογισμός κεντρικού crop (π.χ. ~98% του πλάτους)
    let cropW = fullW * 0.98;
    let cropH = cropW / targetRatio;

    // Αν το ύψος ξεφεύγει, προσαρμογή στο ύψος
    if (cropH > fullH) {
      cropH = fullH * 0.98;
      cropW = cropH * targetRatio;
    }

    // Κεντράρισμα
    const cropX = (fullW - cropW) / 2;
    const cropY = (fullH - cropH) / 2;

    // Νέο προσωρινό canvas μόνο για το έγγραφο
    const docCanvas = document.createElement('canvas');
    docCanvas.width = Math.round(cropW);
    docCanvas.height = Math.round(cropH);
    const docCtx = docCanvas.getContext('2d');

    // Κόψιμο από το full canvas στο docCanvas
    docCtx.drawImage(
      canvas,
      cropX, cropY, cropW, cropH,               // από πού κόβουμε
      0, 0, docCanvas.width, docCanvas.height  // πού το βάζουμε
    );

    // Τελική εικόνα (ΜΟΝΟ το έγγραφο)
    const dataUrl = docCanvas.toDataURL('image/jpeg', 0.9);

    // Αποθήκευση στην τρέχουσα θέση εγγράφου
    const doc = getCurrentDoc();
    doc.imageDataUrl = dataUrl;

    // Ενεργοποιούμε τα κουμπιά που χρειάζονται εικόνα
    runVisionButton.disabled = false;

    // Προεπισκόπηση στο div "captured"
    capturedDiv.innerHTML = '';
    const img = document.createElement('img');
    img.src = dataUrl;
    capturedDiv.appendChild(img);

    //  ΚΛΕΙΝΟΥΜΕ την κάμερα
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    video.srcObject = null;

    // Κρύβουμε το κουμπί λήψης (οπότε όταν θα ξαναπάει να σκανάρει, θα πατήσει πάλι "Άνοιγμα κάμερας")
    captureButton.disabled = true;
    captureButton.style.display = 'none';

    // Μήνυμα για τον χρήστη
    if (messageDiv) {
      messageDiv.style.color = '#6b7280';
      messageDiv.textContent = 'Για νέο σκανάρισμα πάτα "Άνοιγμα κάμερας".';
    }
  });


  // -----------------------------
  // Upload εικόνας από αρχείο
  // -----------------------------
  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;

      const doc = getCurrentDoc();
      doc.imageDataUrl = dataUrl;


      runVisionButton.disabled = false;
      downloadBtn.disabled = false;
      saveServerBtn.disabled = false;

      capturedDiv.innerHTML = '';
      const img = document.createElement('img');
      img.src = dataUrl;
      capturedDiv.appendChild(img);
    };
    reader.readAsDataURL(file);
  });

  // -----------------------------
  // OCR μέσω Google Vision (vision.php)
  // -----------------------------
  runVisionButton.addEventListener('click', async () => {
    const doc = getCurrentDoc();

    if (!doc.imageDataUrl) {
      alert('Δεν υπάρχει εικόνα για OCR στο επιλεγμένο έγγραφο.');
      return;
    }

    // --- Loading state στο κουμπί ---
    const originalHtml = runVisionButton.innerHTML;
    runVisionButton.disabled = true;
    runVisionButton.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      &nbsp; Γίνεται ανάγνωση...
    `;

    ocrResult.textContent = 'Γίνεται αναγνώριση κειμένου από Google Vision...';

    try {
      const res = await fetch('vision.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageDataUrl: doc.imageDataUrl })
      });

      const json = await res.json();
      console.log('Vision response:', json);

      if (!json.success) {
        ocrResult.textContent = 'Το OCR δεν επέστρεψε επιτυχία.';
        return;
      }

      const text = json.text || '';
      doc.rawText = text;
      ocrResult.textContent = text || '(Κενό κείμενο)';

      // 1) Προσπάθεια εντοπισμού MRZ (διαβατήριο κτλ.)
      const mrzBlock = extractMrzBlock(text);
      let parsed;

      if (mrzBlock) {
        console.log('MRZ detected:\n', mrzBlock);
        parsed = parseMrzBlock(mrzBlock);
        parsed.rawText = text.trim();
      } else {
        // 2) Αν δεν βρεθεί MRZ, χρησιμοποιούμε την γενική λογική αναγνώρισης
        parsed = analyzeDocument(text);
      }

      // Αποθηκεύουμε parsed και global (αν το θες)
      doc.parsed = parsed;
      window.lastParsed = parsed;

      // Εμφάνιση editable πεδίων σε πίνακα
      renderParsedFields(parsed);

      try {
        fetch('log_parsed.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            docType: parsed.docType || 'unknown',
            fields: parsed.fields || {}
          })
        }).catch(console.error);
      } catch (e) {
        console.error(e);
      }


      // Μόλις έχουμε αποτελέσματα OCR, δείξε το block "Στοιχεία εγγράφου"
      if (docDetailsCard) {
        docDetailsCard.style.display = 'block';
      }

      if (registerClientBtn) {
        registerClientBtn.disabled = false;
      }


      // Επιτρέπουμε την προσθήκη αυτού του εγγράφου στη λίστα
      if (addDocumentBtn) {
        addDocumentBtn.disabled = false;
      }

    } catch (err) {
      console.error(err);
      ocrResult.textContent = 'Σφάλμα στο αίτημα: ' + err.message;
    } finally {
      // --- Επαναφορά κουμπιού ---
      runVisionButton.disabled = false;
      runVisionButton.innerHTML = originalHtml;
    }
  });



  // -----------------------------
  // Κατέβασμα εικόνας (download)
  // -----------------------------
  downloadBtn.addEventListener('click', () => {
    const doc = getCurrentDoc();

    if (!doc.imageDataUrl) {
      alert('Δεν υπάρχει εικόνα για κατέβασμα στο επιλεγμένο έγγραφο.');
      return;
    }

    const a = document.createElement('a');
    a.href = doc.imageDataUrl;
    a.download = 'ocr-image-' + Date.now() + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  // -----------------------------
  // Αποθήκευση εικόνας στον server (save.php)
  // -----------------------------
  saveServerBtn.addEventListener('click', async () => {
    const doc = getCurrentDoc();

    if (!doc.imageDataUrl) {
      alert('Δεν υπάρχει εικόνα για αποθήκευση στο επιλεγμένο έγγραφο.');
      return;
    }

    try {
      // Μετατροπή dataURL -> Blob
      const response = await fetch(doc.imageDataUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'ocr-image-' + Date.now() + '.png');

      const res = await fetch('save.php', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      console.log('save.php response:', json);

      if (json.success) {
        alert('Η εικόνα αποθηκεύτηκε στον server ως: ' + json.file.name);
      } else {
        alert('Δεν αποθηκεύτηκε: ' + (json.error || 'Άγνωστο σφάλμα'));
      }
    } catch (err) {
      console.error(err);
      alert('Σφάλμα κατά την αποθήκευση στον server: ' + err.message);
    }
  });


  // Κουμπί στο τέλος: πάει τον χρήστη στην αρχή για νέο σκανάρισμα
  if (scanMoreBtn) {
    scanMoreBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  
  // ---------------------------------------------
  // Καταχώρηση στοιχείων πελάτη στον πίνακα footer
  // ---------------------------------------------
  if (registerClientBtn) {
    registerClientBtn.addEventListener('click', () => {
      const doc = getCurrentDoc();
      if (!doc || !doc.parsed) {
        alert('Δεν υπάρχουν στοιχεία εγγράφου για καταχώρηση.');
        return;
      }


      const fields = doc.parsed.fields || {};
      const docType = doc.parsed.docType || '';

      // Βασικά στοιχεία (κρατάμε ό,τι δεν έχει ήδη μπει)
      if (fields.surname && !clientData.surname) clientData.surname = fields.surname;
      if (fields.name && !clientData.name) clientData.name = fields.name;



      // ΔΙΠΛΩΜΑ
      if (docType === 'driver_license') {
        if (fields.id_number) clientData.driver_license_number = fields.id_number;
        if (fields.issue_date) clientData.license_issue_date = fields.issue_date;
        if (fields.expiry_date) clientData.license_expiry_date = fields.expiry_date;
        if (fields.birth_date && !clientData.birth_date) clientData.birth_date = fields.birth_date;
        if (fields.birth_place && !clientData.birth_place) clientData.birth_place = fields.birth_place;
      }

      // ΤΑΥΤΟΤΗΤΑ (παλιά / νέα)
      if (docType === 'new_id' || docType === 'old_id') {
        if (fields.id_number) clientData.id_card_number = fields.id_number;
        if (fields.birth_date && !clientData.birth_date) clientData.birth_date = fields.birth_date;
        if (fields.birth_place && !clientData.birth_place) clientData.birth_place = fields.birth_place;
        if (fields.nationality) clientData.id_card_nationality = fields.nationality;
        if (fields.issuing_country) clientData.id_card_issuing_country = fields.issuing_country;
        if (fields.expiry_date) clientData.id_card_expiry_date = fields.expiry_date;
        if (fields.sex && !clientData.sex) clientData.sex = fields.sex;

      }

      // ΔΙΑΒΑΤΗΡΙΟ από MRZ
      if (docType === 'passport') {
        if (fields.id_number) clientData.passport_number = fields.id_number;
        if (fields.nationality) clientData.passport_nationality = fields.nationality;
        if (fields.issuing_country) clientData.passport_issuing_country = fields.issuing_country;
        if (fields.expiry_date) clientData.passport_expiry_date = fields.expiry_date;
        if (fields.birth_date && !clientData.birth_date) clientData.birth_date = fields.birth_date;
        if (fields.sex) clientData.passport_sex = fields.sex;
        if (fields.sex && !clientData.sex) clientData.sex = fields.sex;

      }

      // 🔽 Γέμισμα editable inputs στο footer από το clientData
      if (clientSurnameInput) clientSurnameInput.value = clientData.surname || '';
      if (clientNameInput) clientNameInput.value = clientData.name || '';

      if (clientEmailFooterInput) clientEmailFooterInput.value = clientData.email || '';

      if (clientLicenseNumberInput) clientLicenseNumberInput.value = clientData.driver_license_number || '';
      if (clientIdCardNumberInput) clientIdCardNumberInput.value = clientData.id_card_number || '';
      if (clientPassportNumberInput) clientPassportNumberInput.value = clientData.passport_number || '';

      if (clientBirthDateInput) clientBirthDateInput.value = clientData.birth_date || '';
      if (clientBirthPlaceInput) clientBirthPlaceInput.value = clientData.birth_place || '';

      if (clientLicenseIssueDateInput) clientLicenseIssueDateInput.value = clientData.license_issue_date || '';
      if (clientLicenseExpiryDateInput) clientLicenseExpiryDateInput.value = clientData.license_expiry_date || '';

      if (clientPassportNationalityInput) clientPassportNationalityInput.value = clientData.passport_nationality || '';
      if (clientPassportIssuingCountryInput) clientPassportIssuingCountryInput.value = clientData.passport_issuing_country || '';
      if (clientPassportExpiryDateInput) clientPassportExpiryDateInput.value = clientData.passport_expiry_date || '';
      if (clientSexInput) clientSexInput.value = clientData.sex || '';

      if (clientIdNationalityInput) clientIdNationalityInput.value = clientData.id_card_nationality || '';
      if (clientIdIssuingCountryInput) clientIdIssuingCountryInput.value = clientData.id_card_issuing_country || '';
      if (clientIdExpiryDateInput) clientIdExpiryDateInput.value = clientData.id_card_expiry_date || '';

clientIdCardNumberInput?.dispatchEvent(new Event('input', { bubbles: true }));
clientPassportNumberInput?.dispatchEvent(new Event('input', { bubbles: true }));
syncIdPassportStars();

      // Ανοίγουμε το collapse για να τα δει
      if (clientDataCollapse && typeof bootstrap !== 'undefined') {
        const bsCol = bootstrap.Collapse.getOrCreateInstance(clientDataCollapse, { toggle: false });
        bsCol.show();
      }
    });
  }



  function toIsoDateFromGr(dmy) {
    const m = (dmy || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    return `${m[3]}-${m[2]}-${m[1]}`;
  }

  function addIf(obj, key, value) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      obj[key] = value;
    }
  }

  // ---------------------------------------------
  // Αποστολή στοιχείων πελάτη με έλεγχο υποχρεωτικών πεδίων
  // ---------------------------------------------
  if (sendClientBtn) {
    sendClientBtn.addEventListener('click', async () => {
      // Διαβάζουμε τις τρέχουσες τιμές από τα inputs του footer
      const surname = (clientSurnameInput?.value || '').trim();
      const name = (clientNameInput?.value || '').trim();
      const email = (clientEmailFooterInput?.value || '').trim();
      const licenseNo = (clientLicenseNumberInput?.value || '').trim();
      const idCardNo = (clientIdCardNumberInput?.value || '').trim();
      const passNo = (clientPassportNumberInput?.value || '').trim();

      // Reset validation classes
      setInvalidFooterInput(clientSurnameInput, false);
      setInvalidFooterInput(clientNameInput, false);
      setInvalidFooterInput(clientEmailFooterInput, false);
      setInvalidFooterInput(clientLicenseNumberInput, false);
      setInvalidFooterInput(clientIdCardNumberInput, false);
      setInvalidFooterInput(clientPassportNumberInput, false);

      const missing = [];

      if (!surname) {
        missing.push('Επώνυμο');
        setInvalidFooterInput(clientSurnameInput, true);
      }

      if (!name) {
        missing.push('Όνομα');
        setInvalidFooterInput(clientNameInput, true);
      }

      if (!email) {
        missing.push('E-mail');
        setInvalidFooterInput(clientEmailFooterInput, true);
      } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        missing.push('E-mail (μη έγκυρη μορφή)');
        setInvalidFooterInput(clientEmailFooterInput, true);
      }

      if (!licenseNo) {
        missing.push('Αριθμός διπλώματος');
        setInvalidFooterInput(clientLicenseNumberInput, true);
      }

      const hasIdOrPassport = !!idCardNo || !!passNo;
      if (!hasIdOrPassport) {
        missing.push('Αρ. ταυτότητας ή διαβατηρίου');
        setInvalidFooterInput(clientIdCardNumberInput, !idCardNo);
        setInvalidFooterInput(clientPassportNumberInput, !passNo);
      }

      if (missing.length > 0) {
        alert(
          'Συμπλήρωσε τα υποχρεωτικά πεδία:\n- ' +
          missing.join('\n- ')
        );
        return;
      }

      // Αν όλα είναι ΟΚ → επιβεβαίωση πριν την "αποστολή"
      const ok = await showConfirm(
        'Είστε σίγουρος ότι τα στοιχεία είναι σωστά και θέλετε να τα αποστείλετε;',
        'Αποστολή',
        'Άκυρο'
      );
      if (!ok) return;

      // ---------------------------
      // Rentalbook: create or get driver (FULL API MAPPING)
      // ---------------------------
      const identification_number = (idCardNo || passNo || '').trim();
      const phoneVal = (clientPhoneInput?.value || '').trim();

      // Identification fields (ID card / Passport)
      const identification_created = toIsoDateFromGr(clientIdentificationIssueDateInput?.value || '');
      const identification_expire = toIsoDateFromGr(clientIdExpiryDateInput?.value || '');
      const identification_country = (clientIdIssuingCountryInput?.value || '').trim();

      // Licence fields
      const licenceCountryVal = (document.getElementById('clientLicenceCountryInput')?.value || '').trim(); // αν έχεις πεδίο για χώρα έκδοσης διπλώματος

      const payload = {
        firstname: name,
        lastname: surname,
        email: email,
        role: "customer",

        // phone
        phone: phoneVal || undefined,

        // birthday
        birthday: toIsoDateFromGr(clientBirthDateInput?.value || '') || undefined,

        // licence
        licence_number: (licenseNo || '').trim() || undefined,
        licence_created: toIsoDateFromGr(clientLicenseIssueDateInput?.value || '') || undefined,
        licence_expire: toIsoDateFromGr(clientLicenseExpiryDateInput?.value || '') || undefined,
        licence_country: licenceCountryVal || undefined,

        // identification (ID/passport)
        identification_number: identification_number || undefined,
        identification_created: identification_created || undefined,
        identification_expire: identification_expire || undefined,
        identification_country: identification_country || undefined,
      };

      // καθάρισμα undefined (για να μη στέλνεις κενά)
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      // Debug (προαιρετικά)
      // console.log('RB payload:', payload);

      const res = await fetch('rentalbook_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_or_get_driver',
          email,
          identification_number,
          phone: phoneVal,   // περνάει και στο check_contact
          payload
        })
      });

      const j = await res.json();

      if (!j.success) {
        alert('Σφάλμα Rentalbook: ' + (j.error || j.raw || 'Unknown'));
        return;
      }

      const driverId = j.driver_id || j.data?.id || j.data?.driver_id;

      alert(
        j.mode === 'existing'
          ? `Ο πελάτης υπάρχει ήδη στο Rentalbook`
          : `Δημιουργήθηκε νέος πελάτης στο Rentalbook`
      );


    });
  }

  // Helper για κόκκινο border με Bootstrap .is-invalid
  function setInvalidFooterInput(input, isInvalid) {
    if (!input) return;
    if (isInvalid) {
      input.classList.add('is-invalid');
    } else {
      input.classList.remove('is-invalid');
    }
  }

});


function isLikelyDriverLicense(text) {
  const t = (text || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\r/g, '');

  // Strong keywords → 99% σίγουρο
  const strong = [
    'ΑΔΕΙΑ ΟΔΗΓΗΣΗΣ',
    'DRIVING LICENCE',
    'DRIVER LICENSE',
    'FUHRERSCHEIN',       // FÜHRERSCHEIN normalized
    'PRAWO JAZDY',
    'RIJBEWIJS',
    'PERMIS DE CONDUIRE',
    'KORKORT',            // KÖRKORT normalized
    'PATENTE DI GUIDA',
    'FUHRERAUSWEIS',
    'SURUCU BELGESI',     // SÜRÜCÜ BELGESİ normalized
  ];

  if (strong.some(k => t.includes(k))) {
    return true; // ή score += 4 αν προτιμάς
  }

  // --- αλλιώς scoring από patterns ---
  let score = 0;

  const has4abc = /(?:^|\s)4\s*[\.\-]?\s*[ABC]\b/m.test(t);
  const has123 = /(?:^|\s)1[\.\:]?\s/m.test(t) && /(?:^|\s)2[\.\:]?\s/m.test(t) && /(?:^|\s)3[\.\:]?\s/m.test(t);
  if (has4abc) score += 3;
  if (has123) score += 1;

  const dates = t.match(/\b\d{2}[\/\.\-]\d{2}[\/\.\-]\d{2,4}\b/g) || [];
  if (dates.length >= 2) score += 1;
  if (dates.length >= 3) score += 1;

  if (/\bAM\b|\bA1\b|\bA2\b|\bA\b|\bB\b|\bBE\b|\bC1\b|\bC\b|\bCE\b|\bD1\b|\bD\b/.test(t)) score += 1;

  return score >= 4;
}




// helper: κάνει normalize για να μη σε “σκοτώσουν” τόνοι/διαλυτικά
function normalizeForMatch(str) {
  return (str || '')
    .toUpperCase()
    .normalize('NFD')                // σπάει γράμμα+τόνο
    .replace(/[\u0300-\u036f]/g, ''); // αφαιρεί diacritics
}

function containsAnyKeyword(text, keywords) {
  const hay = normalizeForMatch(text);
  return keywords.some(k => hay.includes(normalizeForMatch(k)));
}

// ===================================================================
// 1. Ανάλυση εγγράφου (χωρίς MRZ) → τύπος + επιμέρους parsers
// ===================================================================
function analyzeDocument(text) {
  const cleaned = text.replace(/\r/g, '').trim();
  const upper = cleaned.toUpperCase();

  let docType = 'unknown';

  // Προσπάθεια να αναγνωρίσουμε αν είναι δίπλωμα, νέα/παλιά ταυτότητα
  if (isLikelyDriverLicense(cleaned)) {
    docType = 'driver_license';
  }
  else if (
    upper.includes('ΔΕΛΤΙΟ ΤΑΥΤΟΤΗΤΑΣ') ||
    upper.includes('IDENTITY CARD')
  ) {
    if (upper.includes('HELLENIC REPUBLIC') || upper.includes('EUROPEAN UNION')) {
      docType = 'new_id';
    } else {
      docType = 'old_id';
    }
  }

  let fields = {};

  switch (docType) {
    case 'driver_license':
      fields = parseDriverLicense(cleaned);
      break;
    case 'new_id':
      fields = parseNewGreekId(cleaned);
      break;
    case 'old_id':
      fields = parseOldGreekId(cleaned);
      break;
    default:
      // default κενό set πεδίων
      fields = {
        id_number: '',
        surname: '',
        name: '',
        father_name: '',
        mother_name: '',
        birth_date: '',
        birth_place: '',
        issue_date: ''
      };
  }

  const result = {
    docType,
    fields,
    rawText: cleaned
  };

  // Κρατάμε global αν το χρειαστείς μετά (π.χ. για save στον server)
  window.lastParsed = result;

  return result;
}


// ===================================================================
// 2. Parsing Διπλώματος Οδήγησης (Ελληνικό / Ευρωπαϊκό format)
// ===================================================================
function parseDriverLicense(text) {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  let surname = '';
  let name = '';
  let birthDate = '';
  let birthPlace = '';
  let issueDate = '';
  let expiryDate = '';
  let idNumber = '';

  const dateRegex = /(\d{2})[./-](\d{2})[./-](\d{2,4})/;
  const dateRegexGlobal = /(\d{2})[./-](\d{2})[./-](\d{2,4})/g;
  const datesIn4 = []; // ημερομηνίες από γραμμές που έχουν 4...


  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Επώνυμο → ό,τι περιέχει "1." και μετά κείμενο (μπορεί να έχει κάτι πριν)
    const m1 = line.match(/1\.\s*(.+)$/);
    if (m1 && !surname) {
      surname = pickLatinNameFromBlock(i, lines, m1[1]);
    }

    // 2. Όνομα → ό,τι περιέχει "2." και μετά κείμενο
    const m2 = line.match(/2\.\s*(.+)$/);
    if (m2 && !name) {
      name = pickLatinNameFromBlock(i, lines, m2[1]);
    }

    // 3. Ημ/νία + πιθανός τόπος γέννησης → γραμμές με "3."
    const m3 = line.match(/3\.\s*(.+)$/);
    if (m3) {
      const without3 = m3[1]; // ό,τι υπάρχει μετά το "3."
      const mDate = without3.match(dateRegex);

      if (mDate) {
        birthDate = normalizeDate(mDate[0]);
        let afterDate = without3.slice(mDate.index + mDate[0].length).trim();

        // 1η προσπάθεια: τόπος στην ίδια γραμμή
        if (isProbablyPlace(afterDate, surname, name)) {
          birthPlace = afterDate;
        }

        // 2η προσπάθεια: τόπος σε επόμενη γραμμή
        if (!birthPlace) {
          for (let j = i + 1; j < lines.length; j++) {
            const cand = lines[j].trim();
            if (isProbablyPlace(cand, surname, name)) {
              birthPlace = cand;
              break;
            }
          }
        }
      }
    }

    // Γραμμές που έχουν "4" στην αρχή → ημερομηνίες έκδοσης/λήξης, αριθμός κτλ.
    if (/^4/.test(line)) {

      // Πάρε ΟΛΕΣ τις ημερομηνίες που υπάρχουν στη γραμμή (4a, 4b κλπ)
      dateRegexGlobal.lastIndex = 0;
      const matches = [...line.matchAll(dateRegexGlobal)];
      for (const m of matches) {
        const norm = normalizeDate(m[0]);
        datesIn4.push(norm);
      }

      // Ειδικά για αριθμό διπλώματος 4d / 4δ, π.χ. "ΤΟ 4δ. ΑΒ123456"
      if (/4\s*[dδ]\s*[.)]?/iu.test(line)) {
        const rest = line.replace(/.*4\s*[dδ]\s*[.)]?\s*/iu, '');
        idNumber = cleanupId(rest);
      }
    }


    // Backup: αν για κάποιο λόγο ο αριθμός είναι στο 5.
    if (/^5\./.test(line) && !idNumber) {
      const rest = line.replace(/^5\.\s*/, '');
      if (/\d/.test(rest)) {
        idNumber = cleanupId(rest);
      }
    }
  }

  // Ορίζουμε issue/expiry από τις ημερομηνίες που βρήκαμε στις γραμμές με 4...
  if (datesIn4.length > 0 && !issueDate) {
    issueDate = datesIn4[0]; // 1η ημερομηνία → έκδοση
  }
  if (datesIn4.length > 1 && !expiryDate) {
    expiryDate = datesIn4[1]; // 2η ημερομηνία → λήξη
  }

  return {
    id_number: cleanupId(idNumber),
    surname: cleanupName(surname),
    name: cleanupName(name),
    birth_date: birthDate,
    issue_date: issueDate,
    expiry_date: expiryDate,
    birth_place: cleanupName(birthPlace)
  };
}

function pickLatinNameFromBlock(index, lines, textAfterLabel) {
  let base = textAfterLabel.trim();

  // Αν ήδη είναι λατινικά (δεν έχει ελληνικά και έχει A-Z) → το κρατάμε
  if (!hasGreek(base) && /[A-Z]/i.test(base)) {
    return base;
  }

  // Αλλιώς κοιτάμε τις επόμενες 2–3 γραμμές για πιθανό λατινικό όνομα
  for (let j = index + 1; j < Math.min(index + 4, lines.length); j++) {
    const cand = lines[j].trim();
    if (!cand) continue;

    // Αν ξεκινάει με άλλο νούμερο (π.χ. 2., 3., 4.) σταματάμε – πήγαμε σε άλλο πεδίο
    if (/^\d+\s*[.\)]/.test(cand)) break;

    // Αν έχει νούμερα, μάλλον δεν είναι καθαρό όνομα
    if (/\d/.test(cand)) continue;

    // Αν έχει ελληνικά → δεν είναι η λατινική εκδοχή
    if (hasGreek(cand)) continue;

    // Αν έχει λατινικά γράμματα → αυτό θέλουμε
    if (/[A-Z]/i.test(cand)) {
      return cand;
    }
  }

  // Αν δεν βρήκαμε τίποτα καλύτερο, κράτα την αρχική
  return base;
}


// Βοηθός: heuristics για να καταλάβουμε αν μια γραμμή πιθανόν είναι τόπος γέννησης
function isProbablyPlace(line, surname, name) {
  if (!line) return false;
  const l = line.trim();
  if (!l) return false;

  const u = l.toUpperCase();

  // Αν ξεκινάει με "νούμερο." (π.χ. 4a., 6.) τότε είναι άλλο πεδίο
  if (/^\d+\s*[\.\)]/.test(u)) return false;

  // Αν έχει νούμερα, δύσκολα είναι τόπος (συνήθως)
  if (/\d/.test(u)) return false;

  // Πολύ μικρή λέξη
  if (l.length < 3) return false;

  // Μην πάρουμε ξανά όνομα/επώνυμο
  if (surname && u.includes(surname.toUpperCase().replace(/\s+/g, ' '))) return false;
  if (name && u.includes(name.toUpperCase().replace(/\s+/g, ' '))) return false;

  // Μην πάρουμε κατηγορίες διπλώματος ή labels
  if (/SIGNATURE|SPECIMEN|AM,| A1| B,| C,| D,/.test(u)) return false;

  return true;
}


// ===================================================================
// 5. Βοηθητικές συναρτήσεις parsing (κοινές)
// ===================================================================
function matchOne(text, regex) {
  const m = text.match(regex);
  if (!m) return '';
  // Αν έχει 2η ομάδα (π.χ. μετά label), παίρνουμε αυτή
  return m[2] || m[1] || '';
}

function matchAfterLabel(text, regex) {
  const m = text.match(regex);
  if (!m) return '';
  return m[2] || '';
}

function cleanupName(str) {
  if (!str) return '';
  return str
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanupId(str) {
  if (!str) return '';
  // κλασικό: Vision μπερδεύει O με 0
  return str
    .replace(/Ο/g, '0')
    .replace(/ /g, '')
    .trim();
}

function hasGreek(str) {
  return /[Α-Ωα-ωΆ-Ώά-ώ]/.test(str);
}


function normalizeDate(str) {
  if (!str) return '';

  // Δέχεται: 15-05-1975, 15/05/75, 15.05.1975 κτλ.
  const m = str.match(/(\d{2})[\/\-.](\d{2})[\/\-.](\d{2,4})/);
  if (!m) return str.trim();

  const dd = m[1];
  const mm = m[2];
  let yy = m[3];

  // Αν είναι 2-ψήφιο το έτος → διάλεξε σωστό αιώνα με heuristic
  if (yy.length === 2) {
    const two = parseInt(yy, 10);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100; // π.χ. 2000

    // ξεκινάμε από τον ίδιο αιώνα με το σήμερα
    let year = currentCentury + two;

    // αν βγει πολύ μπροστά (π.χ. 2064), πήγαινε στον προηγούμενο αιώνα (1964)
    if (year > currentYear + 20) year -= 100;

    // αν βγει πολύ πίσω (π.χ. 1936) και απέχει υπερβολικά, πήγαινε στον επόμενο αιώνα (2036)
    else if (year < currentYear - 80) year += 100;

    yy = String(year);
  }

  return `${dd}/${mm}/${yy}`;
}


// Ελέγχει αν μια ημερομηνία dd/mm/yyyy ή dd-mm-yyyy έχει λήξει
function isExpiredDateString(str) {
  if (!str) return false;

  const m = str.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (!m) return false;

  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10) - 1; // 0-based
  const yyyy = parseInt(m[3], 10);

  const expiry = new Date(yyyy, mm, dd, 23, 59, 59, 999);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return expiry < today;
}


// ===================================================================
// 6. MRZ (Machine Readable Zone) block detection & parsing (Passport)
// ===================================================================
function extractMrzBlock(fullText) {
  const lines = fullText
    .replace(/\r/g, '')
    .split('\n')
    .map(l => l.trim().toUpperCase())
    .filter(l => l.length > 0);

  // Γραμμές που μοιάζουν με MRZ: μόνο A-Z0-9<, έχει <, και είναι σχετικά μεγάλες
  const mrzCandidates = lines
    .map(l => l.replace(/\s+/g, '')) // πετάμε κενά μέσα στη γραμμή
    .filter(l => {
      if (l.length < 25) return false;        // TD1 είναι ~30, TD3 ~44
      if (!l.includes('<')) return false;
      if (!/^[A-Z0-9<]+$/.test(l)) return false;
      return true;
    });

  // 1) TD1 (ID card): 3 γραμμές x ~30 chars
  if (mrzCandidates.length >= 3) {
    const lastThree = mrzCandidates.slice(-3);
    // sanity check: συνήθως η 1η γραμμή ξεκινάει με I/ID/A/C (π.χ. I<)
    if (lastThree[0].length <= 36) {
      return lastThree.join('\n');
    }
  }

  // 2) TD3 (Passport): 2 γραμμές x ~44 chars
  if (mrzCandidates.length >= 2) {
    const lastTwo = mrzCandidates.slice(-2);
    return lastTwo.join('\n');
  }

  return null;
}



function parseMrzBlock(block) {
  const lines = block
    .replace(/\r/g, '')
    .split('\n')
    .map(l => l.trim().toUpperCase())
    .filter(l => l.length > 0);

  const fallback = {
    docType: 'mrz_unknown',
    fields: {
      id_number: '',
      surname: '',
      name: '',
      nationality: '',
      birth_date: '',
      sex: '',
      expiry_date: '',
      issuing_country: '',
      raw_mrz: block
    }
  };

  // -----------------------------------------
  // TD3 (Passport) → 2 γραμμές x 44
  // (το υπάρχον σου, το κρατάμε)
  // -----------------------------------------
  if (lines.length === 2) {
    const L1 = lines[0].padEnd(44, '<');
    const L2 = lines[1].padEnd(44, '<');

    try {
      const issuingCountry = L1.substring(2, 5).replace(/</g, '').trim();

      const namesRaw = L1.substring(5).trim();
      const [surnameRaw, givenRaw] = namesRaw.split('<<');
      const surname = (surnameRaw || '').replace(/</g, ' ').replace(/\s+/g, ' ').trim();
      const name = (givenRaw || '').replace(/</g, ' ').replace(/\s+/g, ' ').trim();

      const passportNumber = L2.substring(0, 9).replace(/</g, '').trim();
      const nationality = L2.substring(10, 13).replace(/</g, '').trim();

      const birthDate = parseMrzDate(L2.substring(13, 19));
      const sexChar = L2.charAt(20);
      const sex = (sexChar === 'M' || sexChar === 'F') ? sexChar : '';

      const expiryDate = parseMrzDate(L2.substring(21, 27));

      return {
        docType: 'passport',
        fields: {
          id_number: passportNumber,
          surname: cleanupName(surname),
          name: cleanupName(name),
          nationality,
          birth_date: birthDate,
          sex,
          expiry_date: expiryDate,
          issuing_country: issuingCountry
        }
      };
    } catch (e) {
      console.warn('MRZ TD3 parse error:', e);
      return fallback;
    }
  }

  // -----------------------------------------
  // TD1 (ID Card) → 3 γραμμές x 30
  // -----------------------------------------
  if (lines.length === 3) {
    const L1 = lines[0].padEnd(30, '<');
    const L2 = lines[1].padEnd(30, '<');
    const L3 = lines[2].padEnd(30, '<');

    try {
      // L1: 0-1 doc type, 2-4 issuing country, 5-13 document number (συχνά)
      const issuingCountry = L1.substring(2, 5).replace(/</g, '').trim();
      const docNumber = L1.substring(5, 14).replace(/</g, '').trim(); // 9 chars τυπικά

      // L2: birth 0-5, sex 7, expiry 8-13, nationality 15-17
      const birthDate = parseMrzDate(L2.substring(0, 6));
      const sexChar = L2.charAt(7);
      const sex = (sexChar === 'M' || sexChar === 'F') ? sexChar : '';

      const expiryDate = parseMrzDate(L2.substring(8, 14));
      const nationality = L2.substring(15, 18).replace(/</g, '').trim();

      // L3: SURNAME<<GIVEN<NAMES
      const [surnameRaw, givenRaw] = L3.split('<<');
      const surname = (surnameRaw || '').replace(/</g, ' ').replace(/\s+/g, ' ').trim();
      const name = (givenRaw || '').replace(/</g, ' ').replace(/\s+/g, ' ').trim();

      // Για να “κουμπώσει” στο υπάρχον flow σου σαν ταυτότητα:
      return {
        docType: 'new_id', // έτσι θα δουλέψει άμεσα και το registerClientData που έχεις
        fields: {
          id_number: docNumber,
          surname: cleanupName(surname),
          name: cleanupName(name),
          nationality,
          birth_date: birthDate,
          sex,
          expiry_date: expiryDate,
          issuing_country: issuingCountry
        }
      };
    } catch (e) {
      console.warn('MRZ TD1 parse error:', e);
      return fallback;
    }
  }

  return fallback;
}

// Μετατροπή YYMMDD → DD/MM/YYYY
function parseMrzDate(yyMMdd) {
  const s = (yyMMdd || '').replace(/[^0-9]/g, '');
  if (s.length !== 6) return '';

  const yy = parseInt(s.substring(0, 2), 10);
  const mm = s.substring(2, 4);
  const dd = s.substring(4, 6);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100; // π.χ. 2000

  // αρχικά βάζουμε τον ίδιο αιώνα με το σήμερα
  let year = currentCentury + yy;

  // Αν βγήκε πάρα πολύ μπροστά (π.χ. 2075 ενώ είμαστε 2025),
  // θεωρούμε ότι ανήκει στον προηγούμενο αιώνα → 1975
  if (year > currentYear + 20) {
    year -= 100;
  }
  // Αν βγήκε πάρα πολύ πίσω (π.χ. 1934 όταν είμαστε 2025),
  // και απέχει πάνω από 80 χρόνια, πάμε στον επόμενο αιώνα → 2034
  else if (year < currentYear - 80) {
    year += 100;
  }

  return `${dd}/${mm}/${year}`;
}


// ===================================================================
// 7. Απόδοση parsed πεδίων σε editable πίνακα (HTML table)
// ===================================================================
function renderParsedFields(parsed) {
  const container = document.getElementById('parsedFields');
  const typeLabel = document.getElementById('docTypeLabel');

  if (!container) return;

  const docType = parsed.docType || 'unknown';

  // Label τύπου εγγράφου
  let typeText = 'Άγνωστος τύπος εγγράφου';
  if (docType === 'driver_license') typeText = 'Άδεια οδήγησης';
  if (docType === 'new_id') typeText = 'Ταυτότητα (νέα)';
  if (docType === 'old_id') typeText = 'Ταυτότητα (παλιά)';
  if (docType === 'passport') typeText = 'Διαβατήριο';

  if (typeLabel) {
    typeLabel.textContent = 'Τύπος εγγράφου: ' + typeText;
  }

  const fields = parsed.fields || {};
  const entries = Object.entries(fields);

  if (!entries.length) {
    container.textContent = 'Δεν βρέθηκαν πεδία προς επεξεργασία.';
    return;
  }

  // Δημιουργία φόρμας με table layout
  let html = '<table style="width:100%; border-collapse:collapse; font-size:13px;">';
  html += '<tbody>';

  entries.forEach(([key, value]) => {
    const label = fieldLabel(key, docType);

    // extra info κάτω από το input (π.χ. "Το έγγραφο έχει λήξει")
    let extraInfoHtml = '';

    if (key === 'expiry_date' && value) {
      if (isExpiredDateString(value)) {
        extraInfoHtml = `
        <div style="margin-top:4px; font-size:12px; color:#b91c1c;">
          Το έγγραφο έχει λήξει
        </div>
      `;
      }
    }

    html += `
    <tr>
      <td style="padding:4px 6px; width:35%; color:#374151;">
        ${label}
      </td>
      <td style="padding:4px 6px;">
        <input 
          type="text" 
          data-field="${key}"
          value="${escapeHtml(value)}"
          style="
            width:100%;
            padding:6px 8px;
            border-radius:6px;
            border:1px solid #d1d5db;
            font-size:13px;
          "
        />
        ${extraInfoHtml}
      </td>
    </tr>
  `;
  });


  html += '</tbody></table>';
  container.innerHTML = html;

  // -------------------------
  // Local helpers
  // -------------------------
  function fieldLabel(key, docType) {
    switch (key) {
      case 'id_number':
        if (docType === 'driver_license') return 'Αριθμός διπλώματος';
        if (docType === 'passport') return 'Αριθμός διαβατηρίου';
        if (docType === 'new_id' || docType === 'old_id') return 'Αριθμός ταυτότητας';
        return 'Αριθμός εγγράφου';

      case 'surname': return 'Επώνυμο';
      case 'name': return 'Όνομα';
      case 'sex': return 'Φύλο';
      case 'birth_date': return 'Ημ/νία γέννησης';
      case 'nationality': return 'Ιθαγένεια';
      case 'birth_place': return 'Τόπος γέννησης';
      case 'issue_date': return 'Ημ/νία έκδοσης';
      case 'expiry_date': return 'Ημ/νία λήξης';
      case 'issuing_authority': return 'Αρχή έκδοσης';
      case 'issuing_country': return 'Χώρα έκδοσης';
      default: return key;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

