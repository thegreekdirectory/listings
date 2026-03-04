const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';
const FORM_STORAGE_KEY = 'tgd_submit_form_draft_v2';

const CATEGORIES = {
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
const US_STATES = {'':'Select State','AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California','CO':'Colorado','CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland','MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri','MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont','VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming'};
const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let map, marker;

function onlyDigits(v){ return (v || '').replace(/\D/g,''); }
function formatUSPhone(input){
  const d = onlyDigits(input).slice(0,10);
  if (!d) return '';
  if (d.length < 4) return `+1 (${d}`;
  if (d.length < 7) return `+1 (${d.slice(0,3)}) ${d.slice(3)}`;
  return `+1 (${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}
function attachPhoneMask(id){
  const el = document.getElementById(id);
  el?.addEventListener('input', () => { el.value = formatUSPhone(el.value); saveDraft(); });
}

function setupMap(){
  map = L.map('submitMap').setView([39.5, -98.35], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  marker = L.marker([39.5, -98.35]).addTo(map);
}
function setMapPin(lat,lng){
  if (!map || !marker) return;
  marker.setLatLng([lat,lng]);
  map.setView([lat,lng], 14);
}

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
      list.innerHTML = results.map(r => `<option value="${r.display_name.replace(/"/g,'&quot;')}"></option>`).join('');
      if (results[0]) setMapPin(parseFloat(results[0].lat), parseFloat(results[0].lon));
    }, 300);
  });
  input.addEventListener('change', async () => {
    const results = await geocodeAddress(input.value.trim());
    if (results[0]) {
      const top = results[0];
      setMapPin(parseFloat(top.lat), parseFloat(top.lon));
      const addr = top.address || {};
      document.getElementById('city').value = document.getElementById('city').value || addr.city || addr.town || addr.village || '';
      if (!document.getElementById('zip_code').value) document.getElementById('zip_code').value = addr.postcode ? String(addr.postcode).slice(0,5) : '';
      if (!document.getElementById('state').value && addr.state_code) document.getElementById('state').value = addr.state_code;
      saveDraft();
    }
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
    sibs.forEach(s => s.classList.remove('active'));
    if (kind === 'closed') { input.value = 'Closed'; input.disabled = true; btn.classList.add('active'); }
    if (kind === 'open24') { input.value = 'Open 24 Hours'; input.disabled = true; btn.classList.add('active'); }
    saveDraft();
  }));
}

function renderSubcategories(selected = []){
  const selectedCategory = document.getElementById('category').value;
  const options = CATEGORIES[selectedCategory] || [];
  document.getElementById('subcategoryCheckboxes').innerHTML = options.map(sub =>
    `<label><input type="checkbox" value="${sub}" ${selected.includes(sub)?'checked':''}/> ${sub}</label>`
  ).join('');
  document.querySelectorAll('#subcategoryCheckboxes input').forEach(i => i.addEventListener('change', saveDraft));
}

function setupAdditionalInfoRows(prefill=[]){
  const holder = document.getElementById('additionalInfoFields');
  holder.innerHTML='';
  const addRow = (v={label:'',value:''}) => {
    const idx = holder.children.length;
    const row = document.createElement('div');
    row.className = 'pair-grid';
    row.innerHTML = `<label>Info Name ${idx+1}<input type="text" id="info_name_${idx}" maxlength="30" value="${v.label||''}"></label>
    <label>Info Value ${idx+1}<input type="text" id="info_value_${idx}" maxlength="120" value="${v.value||''}"></label>`;
    holder.appendChild(row);
    row.querySelectorAll('input').forEach(i => i.addEventListener('input', saveDraft));
  };
  (prefill.length ? prefill : [{}]).forEach(addRow);
  document.getElementById('addInfoRowBtn').onclick = () => {
    const last = holder.lastElementChild;
    if (last) {
      const inputs = last.querySelectorAll('input');
      if (![...inputs].every(i => i.value.trim())) return;
    }
    if (holder.children.length < 5) addRow({});
  };
}

function getFormData(){
  const subcategories = [...document.querySelectorAll('#subcategoryCheckboxes input:checked')].map(i => i.value);
  const websiteRaw = document.getElementById('website').value.trim();
  const website = websiteRaw ? `https://${websiteRaw.replace(/^https?:\/\//i,'')}` : null;
  const additionalInfo = Array.from({length:5}).map((_,i)=>({label:document.getElementById(`info_name_${i}`)?.value.trim(),value:document.getElementById(`info_value_${i}`)?.value.trim()})).filter(v=>v.label&&v.value);
  const custom_ctas = [];
  const ctaName = document.getElementById('cta_name_0').value.trim();
  const ctaUrl = document.getElementById('cta_url_0').value.trim();
  if (ctaName || ctaUrl) custom_ctas.push({ name: ctaName || 'Custom Button', url: ctaUrl, color: document.getElementById('cta_color_0').value, icon: document.getElementById('cta_icon_0').value.trim() });

  const hours = {};
  days.forEach(day=>{ const val=document.getElementById(`hours_${day}`).value.trim(); if(val) hours[day]=val; });
  const ownerTitle = document.getElementById('owner_title').value === 'Other'
    ? document.getElementById('owner_title_other').value.trim()
    : document.getElementById('owner_title').value;

  return {
    business_name: document.getElementById('business_name').value.trim(),
    tagline: document.getElementById('tagline').value.trim(),
    description: document.getElementById('description').value.trim(),
    category: document.getElementById('category').value,
    subcategories,
    primary_subcategory: subcategories[0] || null,
    address: document.getElementById('address').value.trim() || null,
    city: document.getElementById('city').value.trim() || null,
    state: document.getElementById('state').value || null,
    zip_code: document.getElementById('zip_code').value.trim() || null,
    country: document.getElementById('country').value || 'USA',
    phone: document.getElementById('phone').value.trim() || null,
    email: document.getElementById('email').value.trim() || null,
    website,
    logo: document.getElementById('logo').value.trim() || null,
    photos: document.getElementById('photos').value.split('\n').map(v=>v.trim()).filter(Boolean),
    video: document.getElementById('video').value.trim() || null,
    hours,
    social_media: {
      facebook: document.getElementById('facebook').value.trim() || null,
      instagram: document.getElementById('instagram').value.trim() || null,
      twitter: document.getElementById('twitter').value.trim() || null,
      youtube: document.getElementById('youtube').value.trim() || null,
      tiktok: document.getElementById('tiktok').value.trim() || null,
      linkedin: document.getElementById('linkedin').value.trim() || null
    },
    reviews: {
      google: document.getElementById('google_reviews').value.trim() || null,
      yelp: document.getElementById('yelp').value.trim() || null,
      tripadvisor: document.getElementById('tripadvisor').value.trim() || null
    },
    additional_info: additionalInfo,
    custom_ctas,
    owner_name: document.getElementById('owner_name').value.trim() || null,
    owner_title: ownerTitle || null,
    from_greece: document.getElementById('from_greece').value.trim() || null,
    owner_email: document.getElementById('owner_email').value.trim() || null,
    owner_phone: document.getElementById('owner_phone').value.trim() || null,
    owner_name_title_visible: document.getElementById('owner_name_title_visible').checked,
    owner_email_visible: document.getElementById('owner_email_visible').checked,
    owner_phone_visible: document.getElementById('owner_phone_visible').checked
  };
}

function validatePayload(p){
  const errors = [];
  if (!p.business_name || !p.tagline || !p.description) errors.push('Complete all required business fields.');
  if (!p.subcategories.length) errors.push('Select at least one subcategory.');
  if (!p.owner_name || !p.owner_title || !p.owner_email) errors.push('Owner name, title, and email are required.');
  if (p.zip_code && !/^\d{5}$/.test(p.zip_code)) errors.push('ZIP code must be exactly 5 digits.');
  if (p.phone && onlyDigits(p.phone).length !== 10) errors.push('Phone number must be complete (10 digits).');
  if (p.owner_phone && onlyDigits(p.owner_phone).length !== 10) errors.push('Owner phone number must be complete (10 digits).');
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errors.push('Business email is incomplete/invalid.');
  if (p.owner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.owner_email)) errors.push('Owner email is incomplete/invalid.');
  if (p.website && !/^https:\/\/[\w.-]+\.[a-z]{2,}/i.test(p.website)) errors.push('Website is incomplete/invalid.');
  for (const d of Object.keys(p.hours || {})) {
    const h = p.hours[d];
    if (!h) continue;
    if (h === 'Closed' || h === 'Open 24 Hours') continue;
    if (!/\d{1,2}:\d{2}\s?(AM|PM)\s?-\s?\d{1,2}:\d{2}\s?(AM|PM)/i.test(h)) errors.push(`Hours for ${d} are incomplete. Use e.g. 9:00 AM - 5:00 PM`);
  }
  return errors;
}

function saveDraft(){
  const data = getFormData();
  localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
}
function restoreDraft(){
  const raw = localStorage.getItem(FORM_STORAGE_KEY);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    Object.entries(d).forEach(([k,v]) => {
      const el = document.getElementById(k);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = !!v;
      else if (typeof v === 'string') el.value = v;
    });
    if (d.website) document.getElementById('website').value = d.website.replace(/^https:\/\//i,'');
    if (Array.isArray(d.photos)) document.getElementById('photos').value = d.photos.join('\n');
    if (d.hours) Object.entries(d.hours).forEach(([day,val]) => {
      const el = document.getElementById(`hours_${day}`);
      if (el) {
        el.value = val;
        if (val === 'Closed' || val === 'Open 24 Hours') el.disabled = true;
      }
    });
    if (Array.isArray(d.additional_info)) setupAdditionalInfoRows(d.additional_info);
    if (Array.isArray(d.subcategories)) renderSubcategories(d.subcategories);
  } catch (e) { console.warn('draft restore failed', e); }
}

async function uploadToCloudflare(file){
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('https://tgd-images-upload.thegreekdirectory.org', { method:'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  return await res.json();
}
function attachUploaders(){
  document.getElementById('logo_upload').addEventListener('change', async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const s = document.getElementById('uploadStatus'); s.textContent = 'Uploading logo...';
    try { const url = await uploadToCloudflare(f); document.getElementById('logo').value = url; s.textContent='Logo uploaded.'; saveDraft(); }
    catch(err){ s.textContent = `Logo upload failed: ${err.message}`; }
  });
  document.getElementById('photos_upload').addEventListener('change', async (e) => {
    const files = [...(e.target.files||[])]; if (!files.length) return;
    const s = document.getElementById('uploadStatus'); s.textContent = 'Uploading photos...';
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadToCloudflare(f));
      const t = document.getElementById('photos');
      t.value = [t.value.trim(), ...urls].filter(Boolean).join('\n');
      s.textContent = 'Photos uploaded.'; saveDraft();
    } catch(err){ s.textContent = `Photo upload failed: ${err.message}`; }
  });
}

async function submitListingRequest(event){
  event.preventDefault();
  const status = document.getElementById('submitStatus');
  const submitBtn = document.getElementById('submitBtn');
  const payload = getFormData();
  const errors = validatePayload(payload);
  if (errors.length) {
    status.textContent = errors[0];
    status.style.color = '#b91c1c';
    return;
  }

  submitBtn.disabled = true;
  status.textContent = 'Submitting...';
  status.style.color = '#1f2937';

  const { error } = await supabaseClient.from('listing_requests').insert(payload);
  if (error) {
    status.textContent = `Submission failed: ${error.message}`;
    status.style.color = '#b91c1c';
  } else {
    status.textContent = '✅ Submitted successfully!';
    status.style.color = '#166534';
    localStorage.removeItem(FORM_STORAGE_KEY);
    document.getElementById('submitForm').reset();
    renderSubcategories();
    setupAdditionalInfoRows();
  }
  submitBtn.disabled = false;
}

function init(){
  const category = document.getElementById('category');
  category.innerHTML = Object.keys(CATEGORIES).map(c=>`<option value="${c}">${c}</option>`).join('');
  category.addEventListener('change', () => { renderSubcategories(); saveDraft(); });
  const state = document.getElementById('state');
  state.innerHTML = Object.entries(US_STATES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');

  buildHoursRows();
  renderSubcategories();
  setupAdditionalInfoRows();
  attachPhoneMask('phone');
  attachPhoneMask('owner_phone');
  setupMap();
  setupAddressAutocomplete();
  attachUploaders();

  document.getElementById('owner_title').addEventListener('change', () => {
    const show = document.getElementById('owner_title').value === 'Other';
    document.getElementById('ownerTitleOtherWrap').classList.toggle('hidden', !show);
    saveDraft();
  });

  document.querySelectorAll('#submitForm input, #submitForm textarea, #submitForm select').forEach(el => {
    el.addEventListener('input', saveDraft);
    el.addEventListener('change', saveDraft);
  });
  restoreDraft();
  document.getElementById('submitForm').addEventListener('submit', submitListingRequest);
}

document.addEventListener('DOMContentLoaded', init);
