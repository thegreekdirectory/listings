const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';
const FORM_STORAGE_KEY = 'tgd_submit_form_draft_v4';

let SUBCATEGORY_MAP = {
  'Automotive & Transportation': ['Auto Detailer','Auto Repair Shop','Car Dealer','Taxi & Limo Service'],
  'Beauty & Health': ['Barbershops','Esthetician','Hair Salons','Nail Salon','Spas','Chiropractor','Dentist','Doctor','Nutritionist','Optometrist','Orthodontist','Physical Therapist','Physical Trainer'],
  'Church & Religious Organization': ['Church'],
  'Cultural/Fraternal Organization': ['Dance Troupe','Non-Profit','Philanthropic Group','Society','Youth Organization'],
  'Education & Community': ['Childcare','Greek School','Senior Care','Tutor'],
  'Entertainment, Arts & Recreation': ['Band','DJs','Entertainment Group','Photographer','Art'],
  'Food & Hospitality': ['Banquet Hall','Catering Service','Event Venue','Bakeries','Deli','Pastry Shop','Bar','Breakfast','Coffee','Lunch','Dinner','Restaurant','Hotel','Airbnb'],
  'Grocery & Imports': ['Butcher Shop','Liquor Shop','Market','Greek Alcohol','Honey','Olive Oil','Food Distribution','Food Manufacturer'],
  'Home & Construction': ['Carpenter','Electrician','General Contractor','Handyman','HVAC','Landscaping','Painter','Plumber','Roofing','Tile & Stone Specialist'],
  'Industrial & Manufacturing': ['Food Manufacturer'],
  'Pets & Veterinary': ['Veterinarian','Pet Accessories Maker'],
  'Professional & Business Services': ['Business Services','Consultant','CPA','Financial Advisor','Insurance Agent','IT Service & Repair','Lawyer','Marketing & Creative Agency','Notaries','Wedding Planner','Travel Agency'],
  'Real Estate & Development': ['Appraiser','Broker','Developer','Lender','Property Management','Real Estate Agent'],
  'Retail & Shopping': ['Boutique Shop','ECommerce','Jewelry','Souvenir Shop']
};

const MAIN_CATEGORIES = [
  'Automotive & Transportation','Beauty & Health','Church & Religious Organization','Cultural/Fraternal Organization','Education & Community','Entertainment, Arts & Recreation','Food & Hospitality','Grocery & Imports','Home & Construction','Industrial & Manufacturing','Pets & Veterinary','Professional & Business Services','Real Estate & Development','Retail & Shopping'
];

const US_STATES = {'':'Select State','AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California','CO':'Colorado','CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland','MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri','MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont','VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming'};
const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let map, marker;
let selectedPrimarySubcategory = null;
let descriptionEditor = null;
let submissionRequestId = null;

const onlyDigits = (v='') => v.replace(/\D/g, '');
const stripProtocol = (v='') => v.trim().replace(/^https?:\/\//i, '').replace(/^\/+/, '');
const normalizeHttpsUrl = (v='') => {
  const clean = stripProtocol(v);
  return clean ? `https://${clean}` : null;
};
const formatUSPhoneNoCode = (v='') => {
  const d = onlyDigits(v).slice(0, 10);
  if (!d) return '';
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
};
const normalizePhone = (id) => {
  const d = onlyDigits(document.getElementById(id)?.value || '');
  if (!d) return null;
  if (d.length !== 10) return null;
  return `+1${d}`;
};

function lockHttpsInputs() {
  document.querySelectorAll('input[type="url"]').forEach((input) => {
    if (input.dataset.lockedHttps === '1') return;
    input.dataset.lockedHttps = '1';
    const wrap = document.createElement('div');
    wrap.className = 'url-prefix-wrap';
    const span = document.createElement('span');
    span.textContent = 'https://';
    const replacement = document.createElement('input');
    replacement.type = 'text';
    replacement.id = input.id;
    replacement.value = stripProtocol(input.value || '');
    replacement.placeholder = input.placeholder || 'example.com';
    replacement.autocomplete = input.autocomplete || 'off';
    replacement.className = input.className;
    replacement.addEventListener('input', () => {
      replacement.value = stripProtocol(replacement.value);
      saveDraft();
    });
    wrap.appendChild(span);
    wrap.appendChild(replacement);
    input.replaceWith(wrap);
  });
}

function attachPhoneMask(id){
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => { el.value = formatUSPhoneNoCode(el.value); saveDraft(); });
}

function setupPhotoUrlRows(prefill = []) {
  const list = document.getElementById('photoUrlsList');
  const addBtn = document.getElementById('addPhotoUrlBtn');
  list.innerHTML = '';

  const addRow = (value = '') => {
    const row = document.createElement('div');
    row.className = 'photo-url-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'photo-url-input';
    input.placeholder = 'https://image-url...';
    input.value = stripProtocol(value);
    input.addEventListener('input', () => { input.value = stripProtocol(input.value); saveDraft(); });
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.textContent = 'Remove';
    rm.addEventListener('click', () => { row.remove(); saveDraft(); });
    row.appendChild(input);
    row.appendChild(rm);
    list.appendChild(row);
  };

  (prefill.length ? prefill : ['']).forEach(v => addRow(v));
  addBtn.onclick = () => addRow('');
}

function setupMap(){
  map = L.map('submitMap').setView([39.5, -98.35], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  marker = L.marker([39.5, -98.35]).addTo(map);
}
function setMapPin(lat,lng){ if (map && marker) { marker.setLatLng([lat,lng]); map.setView([lat,lng], 14); } }
async function geocodeAddress(query){
  if (!query || query.length < 4) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
  const resp = await fetch(url, { headers: { 'Accept-Language':'en' } });
  return await resp.json();
}
function setupAddressAutocomplete(){
  const input = document.getElementById('address');
  const list = document.getElementById('addressSuggestions');
  let timer;
  input.addEventListener('input', () => {
    saveDraft();
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const results = await geocodeAddress(input.value.trim());
      list.innerHTML = results.map(r => `<option value="${r.display_name.replace(/"/g, '&quot;')}"></option>`).join('');
      if (results[0]) setMapPin(parseFloat(results[0].lat), parseFloat(results[0].lon));
    }, 300);
  });
}

function buildHoursRows(){
  const box = document.getElementById('hoursFields');
  box.innerHTML = days.map(day => `
    <div class="hour-row">
      <div><strong>${day.charAt(0).toUpperCase()+day.slice(1)}</strong></div>
      <input type="text" id="hours_${day}" placeholder="9:00 AM - 5:00 PM or 7:00 PM - 3:00 AM" />
      <div class="hour-actions">
        <button type="button" class="tiny-btn" data-day="${day}" data-kind="closed">Closed</button>
        <button type="button" class="tiny-btn" data-day="${day}" data-kind="open24">Open 24 Hours</button>
      </div>
    </div>`).join('');

  box.querySelectorAll('.tiny-btn').forEach(btn => btn.addEventListener('click', () => {
    const { day, kind } = btn.dataset;
    const input = document.getElementById(`hours_${day}`);
    const sibs = box.querySelectorAll(`.tiny-btn[data-day="${day}"]`);
    if (btn.classList.contains('active')) {
      sibs.forEach(s => s.classList.remove('active'));
      input.disabled = false;
      if (input.value === 'Closed' || input.value === 'Open 24 Hours') input.value = '';
      saveDraft();
      return;
    }
    sibs.forEach(s => s.classList.remove('active'));
    if (kind === 'closed') { input.value = 'Closed'; input.disabled = true; }
    if (kind === 'open24') { input.value = 'Open 24 Hours'; input.disabled = true; }
    btn.classList.add('active');
    saveDraft();
  }));
}

function renderSubcategories(selected = [], primary = null){
  const selectedCategory = document.getElementById('category').value;
  const options = SUBCATEGORY_MAP[selectedCategory] || [];
  if (!selectedPrimarySubcategory && primary) selectedPrimarySubcategory = primary;
  document.getElementById('subcategoryCheckboxes').innerHTML = options.map(sub => {
    const checked = selected.includes(sub);
    const isPrimary = (selectedPrimarySubcategory ? selectedPrimarySubcategory === sub : selected[0] === sub);
    return `<label>
      <input type="checkbox" value="${sub}" ${checked ? 'checked' : ''}/> ${sub}
      <input type="radio" name="submitPrimarySubcategory" value="${sub}" ${checked && isPrimary ? 'checked' : ''} ${!checked ? 'disabled' : ''} title="Primary">
    </label>`;
  }).join('');

  document.querySelectorAll('#subcategoryCheckboxes input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const value = cb.value;
      const radio = document.querySelector(`#subcategoryCheckboxes input[type="radio"][value="${CSS.escape(value)}"]`);
      if (cb.checked) {
        radio.disabled = false;
        if (!selectedPrimarySubcategory) {
          selectedPrimarySubcategory = value;
          radio.checked = true;
        }
      } else {
        radio.checked = false;
        radio.disabled = true;
        if (selectedPrimarySubcategory === value) {
          const firstChecked = document.querySelector('#subcategoryCheckboxes input[type="checkbox"]:checked');
          selectedPrimarySubcategory = firstChecked ? firstChecked.value : null;
          if (firstChecked) {
            const r = document.querySelector(`#subcategoryCheckboxes input[type="radio"][value="${CSS.escape(firstChecked.value)}"]`);
            if (r) r.checked = true;
          }
        }
      }
      saveDraft();
    });
  });

  document.querySelectorAll('#subcategoryCheckboxes input[type="radio"]').forEach((r) => {
    r.addEventListener('change', () => {
      if (r.checked) selectedPrimarySubcategory = r.value;
      saveDraft();
    });
  });
}

function setupAdditionalInfoRows(prefill=[]){
  const holder = document.getElementById('additionalInfoFields');
  holder.innerHTML='';
  const rows = prefill.length ? prefill : [{}];
  rows.forEach((r,idx)=>{
    const row = document.createElement('div');
    row.className = 'pair-grid';
    row.innerHTML = `<label>Info Name ${idx+1}<input type="text" id="info_name_${idx}" maxlength="30" value="${r.label||''}"></label>
      <label>Info Value ${idx+1}<input type="text" id="info_value_${idx}" maxlength="120" value="${r.value||''}"></label>`;
    holder.appendChild(row);
  });
  document.getElementById('addInfoRowBtn').onclick = () => {
    const last = holder.lastElementChild;
    if (last && ![...last.querySelectorAll('input')].every(i => i.value.trim())) return;
    if (holder.children.length >= 5) return;
    const idx = holder.children.length;
    const row = document.createElement('div');
    row.className = 'pair-grid';
    row.innerHTML = `<label>Info Name ${idx+1}<input type="text" id="info_name_${idx}" maxlength="30"></label>
      <label>Info Value ${idx+1}<input type="text" id="info_value_${idx}" maxlength="120"></label>`;
    holder.appendChild(row);
  };
}

function setupExtraOwners(prefill=[]){
  const section = document.getElementById('extraOwnersSection');
  const addBtn = document.getElementById('addOwnerBtn');
  let owners = prefill.slice(0,2);
  const render = () => {
    section.innerHTML = owners.map((o, idx) => {
      const n = idx + 2;
      return `
      <div class="owner-extra-card">
        <label><input type="checkbox" id="owner${n}_enabled" ${o.enabled ? 'checked' : ''}> Show Owner ${n} on listing page</label>
        <label>Owner ${n} Name<input type="text" id="owner${n}_name" value="${o.name || ''}"></label>
        <label>Owner ${n} Title<input type="text" id="owner${n}_title" value="${o.title || ''}"></label>
        <label>Owner ${n} Email<input type="email" id="owner${n}_email" value="${o.email || ''}"></label>
        <label>Owner ${n} Phone<div class="url-prefix-wrap"><span>+1</span><input type="text" id="owner${n}_phone" inputmode="numeric" maxlength="14" value="${o.phone || ''}" placeholder="(___) ___-____"></div></label>
      </div>`;
    }).join('');
    for (let i=2;i<=3;i++) attachPhoneMask(`owner${i}_phone`);
    addBtn.classList.toggle('hidden', owners.length >= 2);
  };
  addBtn.onclick = () => { if (owners.length < 2) owners.push({enabled:false,name:'',title:'',email:'',phone:''}); render(); saveDraft(); };
  render();
}

function getOwnerContacts(){
  const ownerTitle = document.getElementById('owner_title').value === 'Other' ? document.getElementById('owner_title_other').value.trim() : document.getElementById('owner_title').value;
  const contacts = [{
    enabled: document.getElementById('owner_name_title_visible').checked || document.getElementById('owner_email_visible').checked || document.getElementById('owner_phone_visible').checked,
    name: document.getElementById('owner_name').value.trim(),
    title: ownerTitle,
    email: document.getElementById('owner_email').value.trim(),
    phone: document.getElementById('owner_phone').value.trim(),
    name_title_visible: document.getElementById('owner_name_title_visible').checked,
    email_visible: document.getElementById('owner_email_visible').checked,
    phone_visible: document.getElementById('owner_phone_visible').checked
  }];
  for (let i=2;i<=3;i++) {
    const enabled = document.getElementById(`owner${i}_enabled`);
    if (!enabled) continue;
    contacts.push({
      enabled: enabled.checked,
      name: document.getElementById(`owner${i}_name`)?.value.trim() || '',
      title: document.getElementById(`owner${i}_title`)?.value.trim() || '',
      email: document.getElementById(`owner${i}_email`)?.value.trim() || '',
      phone: document.getElementById(`owner${i}_phone`)?.value.trim() || '',
      name_title_visible: enabled.checked,
      email_visible: enabled.checked,
      phone_visible: enabled.checked
    });
  }
  return contacts;
}

function getFormData(){
  const subcategories = [...document.querySelectorAll('#subcategoryCheckboxes input:checked')].map(i => i.value);
  const additional_info = Array.from({length:5}).map((_,i)=>({label:document.getElementById(`info_name_${i}`)?.value?.trim(),value:document.getElementById(`info_value_${i}`)?.value?.trim()})).filter(v=>v.label&&v.value);
  const hours = {};
  days.forEach(day => { const val = document.getElementById(`hours_${day}`)?.value.trim(); if (val) hours[day] = val; });
  const ownerContacts = getOwnerContacts();

  const custom_ctas = [];
  const ctaName = document.getElementById('cta_name_0').value.trim();
  const ctaUrl = document.getElementById('cta_url_0').value.trim();
  if (ctaName || ctaUrl) custom_ctas.push({name: ctaName || 'Custom Button', url: normalizeHttpsUrl(ctaUrl), color: document.getElementById('cta_color_0').value.trim() || '#055193', icon: document.getElementById('cta_icon_0').value.trim()});

  const photoUrls = [...document.querySelectorAll('.photo-url-input')].map(i => normalizeHttpsUrl(i.value)).filter(Boolean);

  return {
    business_name: document.getElementById('business_name').value.trim(),
    tagline: document.getElementById('tagline').value.trim(),
    description: descriptionEditor ? descriptionEditor.getHtml() : document.getElementById('description').value.trim(),
    category: document.getElementById('category').value,
    subcategories,
    primary_subcategory: (selectedPrimarySubcategory && subcategories.includes(selectedPrimarySubcategory)) ? selectedPrimarySubcategory : (subcategories[0] || null),
    address: document.getElementById('address').value.trim() || null,
    city: document.getElementById('city').value.trim() || null,
    state: document.getElementById('state').value || null,
    zip_code: document.getElementById('zip_code').value.trim() || null,
    country: document.getElementById('country').value || 'USA',
    phone: normalizePhone('phone'),
    email: document.getElementById('email').value.trim() || null,
    website: normalizeHttpsUrl(document.getElementById('website').value),
    logo: normalizeHttpsUrl(document.getElementById('logo').value),
    photos: photoUrls,
    video: normalizeHttpsUrl(document.getElementById('video').value),
    hours,
    social_media: {
      facebook: document.getElementById('facebook').value.trim() || null,
      instagram: document.getElementById('instagram').value.trim() || null,
      twitter: document.getElementById('twitter').value.trim() || null,
      youtube: document.getElementById('youtube').value.trim() || null,
      tiktok: document.getElementById('tiktok').value.trim() || null,
      linkedin: normalizeHttpsUrl(document.getElementById('linkedin').value)
    },
    reviews: {
      google: normalizeHttpsUrl(document.getElementById('google_reviews').value),
      yelp: normalizeHttpsUrl(document.getElementById('yelp').value),
      tripadvisor: normalizeHttpsUrl(document.getElementById('tripadvisor').value)
    },
    additional_info,
    custom_ctas,
    owner_name: ownerContacts[0].name || null,
    owner_title: ownerContacts[0].title || null,
    from_greece: document.getElementById('from_greece').value.trim() || null,
    owner_email: ownerContacts[0].email || null,
    owner_phone: normalizePhone('owner_phone'),
    owner_name_title_visible: document.getElementById('owner_name_title_visible').checked,
    owner_email_visible: document.getElementById('owner_email_visible').checked,
    owner_phone_visible: document.getElementById('owner_phone_visible').checked,
    owner_contacts: ownerContacts
  };
}

function validatePayload(p){
  const errors = [];
  if (!p.business_name || !p.tagline || !p.description || (window.RichTextEditor && !window.RichTextEditor.stripHtml(p.description))) errors.push('Complete all required business fields.');
  if (!p.subcategories.length) errors.push('Select at least one subcategory.');
  if (p.subcategories.length && !p.primary_subcategory) errors.push('Select a primary subcategory.');
  if (!p.owner_name || !p.owner_title || !p.owner_email) errors.push('Owner name, title, and email are required.');
  if (p.zip_code && !/^\d{5}$/.test(p.zip_code)) errors.push('ZIP code must be exactly 5 digits.');
  if (!p.owner_name_title_visible && (p.owner_email_visible || p.owner_phone_visible)) errors.push('Enable Owner Name + Title before showing owner email or phone.');
  if (document.getElementById('phone')?.value.trim() && !p.phone) errors.push('Phone number must be a valid US number.');
  if (document.getElementById('owner_phone')?.value.trim() && !p.owner_phone) errors.push('Owner phone number must be a valid US number.');
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errors.push('Business email is incomplete/invalid.');
  if (p.owner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.owner_email)) errors.push('Owner email is incomplete/invalid.');
  if (p.website && !/^https:\/\/[\w.-]+\.[a-z]{2,}/i.test(p.website)) errors.push('Website is incomplete/invalid.');
  Object.entries(p.hours || {}).forEach(([d,h]) => {
    if (h && h !== 'Closed' && h !== 'Open 24 Hours' && !/\d{1,2}:\d{2}\s?(AM|PM)\s?-\s?\d{1,2}:\d{2}\s?(AM|PM)/i.test(h)) errors.push(`Hours for ${d} are incomplete.`);
  });
  return errors;
}

function saveDraft(){ localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({ ...getFormData(), draftRequestId: submissionRequestId })); }
function restoreDraft(){
  const raw = localStorage.getItem(FORM_STORAGE_KEY); if (!raw) return;
  try {
    const d = JSON.parse(raw);
    submissionRequestId = d.draftRequestId || null;
    Object.entries(d).forEach(([k,v]) => {
      const el = document.getElementById(k);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!v;
      else if (typeof v === 'string') el.value = v;
    });
    if (d.website) document.getElementById('website').value = stripProtocol(d.website);
    if (d.logo) document.getElementById('logo').value = stripProtocol(d.logo);
    if (d.video) document.getElementById('video').value = stripProtocol(d.video);
    setupPhotoUrlRows(Array.isArray(d.photos) ? d.photos : []);
    if (Array.isArray(d.subcategories)) renderSubcategories(d.subcategories, d.primary_subcategory || null);
    if (Array.isArray(d.additional_info)) setupAdditionalInfoRows(d.additional_info);
    if (Array.isArray(d.owner_contacts)) setupExtraOwners(d.owner_contacts.slice(1));
    if (d.hours) {
      Object.entries(d.hours).forEach(([day,val]) => {
        const input = document.getElementById(`hours_${day}`);
        if (!input) return;
        input.value = val;
        if (val === 'Closed' || val === 'Open 24 Hours') {
          input.disabled = true;
          const btn = document.querySelector(`.tiny-btn[data-day="${day}"][data-kind="${val === 'Closed' ? 'closed':'open24'}"]`);
          if (btn) btn.classList.add('active');
        }
      });
    }
    if (d.phone) document.getElementById('phone').value = formatUSPhoneNoCode(d.phone);
    if (d.owner_phone) document.getElementById('owner_phone').value = formatUSPhoneNoCode(d.owner_phone);
  } catch (e) { console.warn('restore failed', e); }
}

async function ensureSubmissionRequestId() {
  if (submissionRequestId) return submissionRequestId;

  const payload = getFormData();
  const missingRequiredFields = [];
  if (!payload.business_name) missingRequiredFields.push('Business Name');
  if (!payload.tagline) missingRequiredFields.push('Tagline');
  const descriptionText = window.RichTextEditor ? window.RichTextEditor.stripHtml(payload.description || '') : String(payload.description || '').trim();
  if (!descriptionText) missingRequiredFields.push('Description');
  if (!payload.category) missingRequiredFields.push('Category');

  if (missingRequiredFields.length) {
    throw new Error(`Complete ${missingRequiredFields.join(', ')} before uploading images so a submission request ID can be reserved.`);
  }

  const { data, error } = await supabaseClient
    .from('listing_requests')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Unable to reserve a submission request ID: ${error.message}`);
  }

  submissionRequestId = data.id;
  saveDraft();
  return submissionRequestId;
}

async function uploadToCloudflare(file, assetType){
  const listingId = await ensureSubmissionRequestId();
  return window.TGDCloudflareImages.uploadListingImage({
    file,
    listingId,
    assetType,
    source: 's',
    endpoint: window.TGDCloudflareImages?.DEFAULT_UPLOAD_ENDPOINT
  });
}

function attachUploaders(){
  document.getElementById('logo_upload').addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const s = document.getElementById('uploadStatus'); s.textContent = 'Uploading logo as WEBP...';
    try {
      const { url } = await uploadToCloudflare(f, 'logo');
      if (!url) throw new Error('No URL returned from upload');
      document.getElementById('logo').value = stripProtocol(String(url));
      s.textContent = submissionRequestId ? `Logo uploaded. Submission request #${submissionRequestId} reserved.` : 'Logo uploaded.';
      saveDraft();
    }
    catch(err){ s.textContent = `Logo upload failed: ${err.message}`; }
  });
  document.getElementById('photos_upload').addEventListener('change', async (e) => {
    const files = [...(e.target.files || [])]; if (!files.length) return;
    const s = document.getElementById('uploadStatus'); s.textContent = 'Uploading photos as WEBP...';
    try {
      const urls = [];
      for (const f of files) {
        const { url } = await uploadToCloudflare(f, 'photo');
        if (url) urls.push(url);
      }
      const existing = [...document.querySelectorAll('.photo-url-input')].map(i => i.value).filter(Boolean);
      setupPhotoUrlRows([...existing, ...urls.map(u => stripProtocol(String(u)))]);
      s.textContent = submissionRequestId ? `Photos uploaded. Submission request #${submissionRequestId} reserved.` : 'Photos uploaded.';
      saveDraft();
    } catch(err){ s.textContent = `Photo upload failed: ${err.message}`; }
  });
}

async function submitListingRequest(event){
  event.preventDefault();
  const status = document.getElementById('submitStatus');
  const submitBtn = document.getElementById('submitBtn');
  const payload = getFormData();
  const errors = validatePayload(payload);
  if (errors.length) { status.textContent = errors[0]; status.style.color = '#b91c1c'; return; }

  submitBtn.disabled = true;
  status.textContent = submissionRequestId ? `Updating submission request #${submissionRequestId}...` : 'Submitting...';
  status.style.color = '#1f2937';

  let error = null;
  let savedId = submissionRequestId;

  if (submissionRequestId) {
    const response = await supabaseClient
      .from('listing_requests')
      .update(payload)
      .eq('id', submissionRequestId)
      .select('id')
      .single();
    error = response.error;
    savedId = response.data?.id || submissionRequestId;
  } else {
    const response = await supabaseClient
      .from('listing_requests')
      .insert(payload)
      .select('id')
      .single();
    error = response.error;
    savedId = response.data?.id || null;
  }

  if (error) {
    status.textContent = `Submission failed: ${error.message}`;
    status.style.color = '#b91c1c';
  } else {
    status.textContent = savedId ? `✅ Submitted successfully! Request #${savedId} is ready for review.` : '✅ Submitted successfully!';
    status.style.color = '#166534';
    submissionRequestId = null;
    localStorage.removeItem(FORM_STORAGE_KEY);
    document.getElementById('submitForm').reset();
    renderSubcategories();
    setupAdditionalInfoRows();
    setupExtraOwners();
    setupPhotoUrlRows();
    if (descriptionEditor) descriptionEditor.setHtml('');
  }
  submitBtn.disabled = false;
}

async function loadDynamicSubcategories(){
  try {
    const { data, error } = await supabaseClient.from('category_subcategories').select('category, subcategories');
    if (error) return;
    if (Array.isArray(data)) {
      const next = {};
      data.forEach((row) => { if (row.category && Array.isArray(row.subcategories)) next[row.category] = row.subcategories; });
      SUBCATEGORY_MAP = { ...SUBCATEGORY_MAP, ...next };
    }
  } catch (e) { console.warn('Could not load dynamic subcategories', e); }
}

async function init(){
  lockHttpsInputs();
  const category = document.getElementById('category');
  category.innerHTML = MAIN_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  category.addEventListener('change', () => { selectedPrimarySubcategory = null; renderSubcategories(); saveDraft(); });
  const state = document.getElementById('state');
  state.innerHTML = Object.entries(US_STATES).map(([k,v]) => `<option value="${k}">${v}</option>`).join('');

  await loadDynamicSubcategories();
  buildHoursRows();
  renderSubcategories();
  setupAdditionalInfoRows();
  setupExtraOwners();
  setupPhotoUrlRows();
  attachPhoneMask('phone');
  attachPhoneMask('owner_phone');
  setupMap();
  setupAddressAutocomplete();
  attachUploaders();

  const nameTitleToggle = document.getElementById('owner_name_title_visible');
  const emailToggle = document.getElementById('owner_email_visible');
  const phoneToggle = document.getElementById('owner_phone_visible');
  emailToggle.checked = false;
  const enforceVisibility = () => {
    if (!nameTitleToggle.checked) { emailToggle.checked = false; phoneToggle.checked = false; }
    emailToggle.disabled = !nameTitleToggle.checked;
    phoneToggle.disabled = !nameTitleToggle.checked;
    saveDraft();
  };
  nameTitleToggle.addEventListener('change', enforceVisibility);
  emailToggle.addEventListener('change', enforceVisibility);
  phoneToggle.addEventListener('change', enforceVisibility);

  document.getElementById('owner_title').addEventListener('change', () => {
    const show = document.getElementById('owner_title').value === 'Other';
    document.getElementById('ownerTitleOtherWrap').classList.toggle('hidden', !show);
    saveDraft();
  });

  document.querySelectorAll('#submitForm input, #submitForm textarea, #submitForm select').forEach(el => {
    el.addEventListener('input', saveDraft);
    el.addEventListener('change', saveDraft);
  });

  if (window.RichTextEditor) {
    descriptionEditor = window.RichTextEditor.mount({ inputId: 'description', onChange: saveDraft });
  }

  restoreDraft();
  if (descriptionEditor) {
    descriptionEditor.setHtml(document.getElementById('description').value || '');
  }
  enforceVisibility();
  document.getElementById('submitForm').addEventListener('submit', submitListingRequest);
}

document.addEventListener('DOMContentLoaded', init);
