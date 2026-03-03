const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

const CATEGORIES = {
    'Automotive & Transportation': ['Auto Detailer', 'Auto Repair Shop', 'Car Dealer', 'Taxi & Limo Service'],
    'Beauty & Health': ['Barbershops', 'Esthetician', 'Hair Salons', 'Nail Salon', 'Spas', 'Chiropractor', 'Dentist', 'Doctor', 'Nutritionist', 'Optometrist', 'Orthodontist', 'Physical Therapist', 'Physical Trainer'],
    'Church & Religious Organization': ['Church'],
    'Cultural/Fraternal Organization': ['Dance Troupe', 'Non-Profit', 'Philanthropic Group', 'Society', 'Youth Organization'],
    'Education & Community': ['Childcare', 'Greek School', 'Senior Care', 'Tutor'],
    'Entertainment, Arts & Recreation': ['Band', 'DJs', 'Entertainment Group', 'Photographer', 'Art'],
    'Food & Hospitality': ['Banquet Hall', 'Catering Service', 'Event Venue', 'Bakeries', 'Deli', 'Pastry Shop', 'Bar', 'Breakfast', 'Coffee', 'Lunch', 'Dinner', 'Restaurant', 'Hotel', 'Airbnb'],
    'Grocery & Imports': ['Butcher Shop', 'Liquor Shop', 'Market', 'Greek Alcohol', 'Honey', 'Olive Oil', 'Food Distribution', 'Food Manufacturer'],
    'Home & Construction': ['Carpenter', 'Electrician', 'General Contractor', 'Handyman', 'HVAC', 'Landscaping', 'Painter', 'Plumber', 'Roofing', 'Tile & Stone Specialist'],
    'Industrial & Manufacturing': ['Food Manufacturer'],
    'Pets & Veterinary': ['Veterinarian', 'Pet Accessories Maker'],
    'Professional & Business Services': ['Business Services', 'Consultant', 'CPA', 'Financial Advisor', 'Insurance Agent', 'IT Service & Repair', 'Lawyer', 'Marketing & Creative Agency', 'Notaries', 'Wedding Planner', 'Travel Agency'],
    'Real Estate & Development': ['Appraiser', 'Broker', 'Developer', 'Lender', 'Property Management', 'Real Estate Agent'],
    'Retail & Shopping': ['Boutique Shop', 'ECommerce', 'Jewelry', 'Souvenir Shop']
};

const US_STATES = {
    '': 'Select State', 'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function setupStaticFields() {
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = Object.keys(CATEGORIES).map((category) => `<option value="${category}">${category}</option>`).join('');
    categorySelect.addEventListener('change', renderSubcategories);

    const stateSelect = document.getElementById('state');
    stateSelect.innerHTML = Object.entries(US_STATES).map(([code, name]) => `<option value="${code}">${name}</option>`).join('');

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    document.getElementById('hoursFields').innerHTML = days.map((day) => `<label>${day[0].toUpperCase() + day.slice(1)} <input type="text" id="hours_${day}" placeholder="9:00 AM - 5:00 PM"></label>`).join('');

    document.getElementById('additionalInfoFields').innerHTML = Array.from({ length: 5 }).map((_, i) => `
        <label>Info Name ${i + 1}<input type="text" id="info_name_${i}" maxlength="30"></label>
        <label>Info Value ${i + 1}<input type="text" id="info_value_${i}" maxlength="120"></label>
    `).join('');

    document.getElementById('ctaFields').innerHTML = Array.from({ length: 2 }).map((_, i) => `
        <label>CTA ${i + 1} Name<input type="text" id="cta_name_${i}" maxlength="15"></label>
        <label>CTA ${i + 1} URL<input type="url" id="cta_url_${i}"></label>
        <label>CTA ${i + 1} Color<input type="color" id="cta_color_${i}" value="#055193"></label>
        <label>CTA ${i + 1} Icon<input type="text" id="cta_icon_${i}" maxlength="10"></label>
    `).join('');

    renderSubcategories();
}

function renderSubcategories() {
    const selectedCategory = document.getElementById('category').value;
    const options = CATEGORIES[selectedCategory] || [];
    document.getElementById('subcategoryCheckboxes').innerHTML = options.map((subcategory) => `
        <label><input type="checkbox" value="${subcategory}"> ${subcategory}</label>
    `).join('');
}

function buildSubmissionPayload() {
    const subcategories = Array.from(document.querySelectorAll('#subcategoryCheckboxes input:checked')).map((item) => item.value);
    const additionalInfo = Array.from({ length: 5 }).map((_, i) => ({ label: document.getElementById(`info_name_${i}`).value.trim(), value: document.getElementById(`info_value_${i}`).value.trim() })).filter((item) => item.label && item.value);
    const customCtas = Array.from({ length: 2 }).map((_, i) => ({ name: document.getElementById(`cta_name_${i}`).value.trim(), url: document.getElementById(`cta_url_${i}`).value.trim(), color: document.getElementById(`cta_color_${i}`).value.trim() || '#055193', icon: document.getElementById(`cta_icon_${i}`).value.trim() })).filter((cta) => cta.name && cta.url);

    const hours = {};
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach((day) => {
        const val = document.getElementById(`hours_${day}`).value.trim();
        if (val) hours[day] = val;
    });

    return {
        business_name: document.getElementById('business_name').value.trim(),
        slug: document.getElementById('slug').value.trim() || null,
        tagline: document.getElementById('tagline').value.trim(),
        description: document.getElementById('description').value.trim(),
        category: document.getElementById('category').value,
        subcategories,
        primary_subcategory: subcategories[0] || null,
        is_chain: document.getElementById('is_chain').checked,
        chain_name: document.getElementById('chain_name').value.trim() || null,
        chain_id: document.getElementById('chain_id').value.trim() || null,
        address: document.getElementById('address').value.trim() || null,
        city: document.getElementById('city').value.trim() || null,
        state: document.getElementById('state').value || null,
        zip_code: document.getElementById('zip_code').value.trim() || null,
        country: document.getElementById('country').value || 'USA',
        phone: document.getElementById('phone').value.trim() || null,
        email: document.getElementById('email').value.trim() || null,
        website: document.getElementById('website').value.trim() || null,
        logo: document.getElementById('logo').value.trim() || null,
        photos: document.getElementById('photos').value.split('\n').map((line) => line.trim()).filter(Boolean),
        video: document.getElementById('video').value.trim() || null,
        hours,
        social_media: {
            facebook: document.getElementById('facebook').value.trim() || null,
            instagram: document.getElementById('instagram').value.trim() || null,
            twitter: document.getElementById('twitter').value.trim() || null,
            youtube: document.getElementById('youtube').value.trim() || null,
            tiktok: document.getElementById('tiktok').value.trim() || null,
            linkedin: document.getElementById('linkedin').value.trim() || null,
            other1_name: document.getElementById('other1_name').value.trim() || null,
            other1: document.getElementById('other1').value.trim() || null,
            other2_name: document.getElementById('other2_name').value.trim() || null,
            other2: document.getElementById('other2').value.trim() || null,
            other3_name: document.getElementById('other3_name').value.trim() || null,
            other3: document.getElementById('other3').value.trim() || null
        },
        reviews: {
            google: document.getElementById('google_reviews').value.trim() || null,
            yelp: document.getElementById('yelp').value.trim() || null,
            tripadvisor: document.getElementById('tripadvisor').value.trim() || null,
            other1_name: document.getElementById('other_review_1_name').value.trim() || null,
            other1: document.getElementById('other_review_1').value.trim() || null,
            other2_name: document.getElementById('other_review_2_name').value.trim() || null,
            other2: document.getElementById('other_review_2').value.trim() || null,
            other3_name: document.getElementById('other_review_3_name').value.trim() || null,
            other3: document.getElementById('other_review_3').value.trim() || null
        },
        additional_info: additionalInfo,
        custom_ctas: customCtas,
        owner_name: document.getElementById('owner_name').value.trim() || null,
        owner_title: document.getElementById('owner_title').value.trim() || null,
        from_greece: document.getElementById('from_greece').value.trim() || null,
        owner_email: document.getElementById('owner_email').value.trim() || null,
        owner_phone: document.getElementById('owner_phone').value.trim() || null
    };
}

async function submitListingRequest(event) {
    event.preventDefault();
    const status = document.getElementById('submitStatus');
    const submitBtn = document.getElementById('submitBtn');

    const payload = buildSubmissionPayload();
    if (!payload.business_name || !payload.tagline || !payload.description || payload.subcategories.length === 0) {
        status.textContent = 'Please complete all required fields and select at least one subcategory.';
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
        status.textContent = '✅ Submitted successfully! The admin team will review your request.';
        status.style.color = '#166534';
        document.getElementById('submitForm').reset();
        renderSubcategories();
    }

    submitBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
    setupStaticFields();
    document.getElementById('submitForm').addEventListener('submit', submitListingRequest);
});
