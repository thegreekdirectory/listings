-- Idempotent merge/upsert of category subcategories discovered in runtime code + seeded values
insert into public.category_subcategories (category, subcategories)
values
  ('Automotive & Transportation', ARRAY['Auto Detailer','Auto Parts Store','Auto Repair Shop','Car Dealer','Car Wash','Driving School','Motorcycle Dealer','Taxi & Limo Service','Towing Service','Truck Rental']),
  ('Beauty & Health', ARRAY['Barbershops','Chiropractor','Dentist','Doctor','Esthetician','Gym & Fitness','Hair Salons','Massage Therapy','Medical Clinic','Mental Health','Nail Salon','Nutritionist','Optician','Optometrist','Orthodontist','Pharmacy','Physical Therapist','Physical Trainer','Spa & Wellness','Spas','Tattoo & Piercing']),
  ('Church & Religious Organization', ARRAY['Church']),
  ('Cultural/Fraternal Organization', ARRAY['Dance Troupe','Non-Profit','Philanthropic Group','Society','Youth Organization']),
  ('Education & Community', ARRAY['Childcare','Church','Community Center','Cultural Organization','Greek School','Language School','Library','Non-Profit','Senior Care','Tutoring','Tutor','University Club','Youth Organization']),
  ('Entertainment, Arts & Recreation', ARRAY['Art','Band','DJs','Entertainment Group','Photographer']),
  ('Food & Hospitality', ARRAY['Airbnb','Bakery','Bakeries','Bar','Bar & Lounge','Breakfast','Brewery','Brunch Spot','Café','Catering Service','Coffee','Deli','Diner','Dinner','Event Venue','Fast Food','Fine Dining','Food Truck','Hotel','Ice Cream Shop','Lunch','Pastry Shop','Pizza Shop','Restaurant','Winery']),
  ('Grocery & Imports', ARRAY['Bakery Supply','Butcher Shop','Deli','Farmers Market','Food Distribution','Food Manufacturer','Greek Alcohol','Honey','Import Store','Liquor Shop','Market','Olive Oil','Organic Store','Seafood Market','Specialty Foods','Wine & Spirits']),
  ('Home & Construction', ARRAY['Carpenter','Cleaning Service','Contractor','Electrician','Flooring','General Contractor','Handyman','HVAC','Interior Designer','Landscaping','Masonry','Moving Service','Painter','Pest Control','Plumber','Pool Service','Roofing','Security Systems','Tile & Stone Specialist']),
  ('Industrial & Manufacturing', ARRAY['Chemical Supplier','Construction Supplier','Equipment Supplier','Food Manufacturer','Logistics & Shipping','Metalworking','Printing & Packaging','Textile Manufacturer','Wholesale Distributor']),
  ('Pets & Veterinary', ARRAY['Pet Accessories Maker','Veterinarian']),
  ('Professional & Business Services', ARRAY['Accountant','Business Services','Consultant','CPA','Event Planner','Financial Advisor','HR Services','Insurance Agent','IT Service & Repair','Lawyer','Marketing & Creative Agency','Marketing Agency','Notaries','Notary','Photographer','Public Relations','Staffing Agency','Travel Agent','Travel Agency','Videographer','Wedding Planner']),
  ('Real Estate & Development', ARRAY['Appraisal','Appraiser','Broker','Developer','Home Inspector','Lender','Mortgage','Property Management','Real Estate Agent','Real Estate Attorney','Title Company']),
  ('Retail & Shopping', ARRAY['Boutique Shop','ECommerce','Jewelry','Souvenir Shop'])
on conflict (category)
do update set subcategories = excluded.subcategories;
