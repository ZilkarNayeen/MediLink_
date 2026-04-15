import { PrismaClient } from '../generated/prisma/index.js'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Bangladesh Medical Discovery Hub...')

  // Clear existing directory data
  console.log('Clearing old data...')
  await prisma.hospitalService.deleteMany()
  await prisma.hospital.deleteMany()
  await prisma.service.deleteMany()

  // ── 1. Create Services (Tests and Operations) ──
  console.log('Creating Services...')
  const servicesData = [
    // Diagnostics / Tests
    { name: 'MRI Scan (Brain 3T)', type: 'TEST', description: 'Detailed 3 Tesla magnetic resonance imaging of the brain.', basePrice: 8500 },
    { name: 'MRI Scan (Spine)', type: 'TEST', description: 'High-resolution imaging of the spinal cord and vertebrae.', basePrice: 8000 },
    { name: 'CT Scan (Chest/Lungs)', type: 'TEST', description: 'Computed tomography scan for chest and lungs.', basePrice: 4500 },
    { name: 'CT Scan (Whole Abdomen)', type: 'TEST', description: 'Detailed CT scan of the abdominal region.', basePrice: 6500 },
    { name: 'Complete Blood Count (CBC)', type: 'TEST', description: 'Standard blood test analyzing overall blood cell health.', basePrice: 400 },
    { name: 'Lipid Profile', type: 'TEST', description: 'Blood test to measure cholesterol and triglycerides.', basePrice: 1200 },
    { name: 'Liver Function Test (LFT)', type: 'TEST', description: 'Blood panel to measure liver enzymes and proteins.', basePrice: 1500 },
    { name: 'Kidney Function Test (KFT)', type: 'TEST', description: 'Test evaluating renal function, BUN, and Creatinine.', basePrice: 1300 },
    { name: 'Thyroid Panel (TSH, FT4)', type: 'TEST', description: 'Endocrine test focusing on thyroid hormone levels.', basePrice: 1800 },
    { name: 'X-Ray (Chest PA)', type: 'TEST', description: 'Standard radiograph of the chest.', basePrice: 600 },
    { name: 'X-Ray (Knee Joint AC)', type: 'TEST', description: 'Radiograph for arthritis and joint abnormalities.', basePrice: 600 },
    { name: 'Ultrasound (Whole Abdomen)', type: 'TEST', description: 'Diagnostic sonography imaging of abdominal organs.', basePrice: 1500 },
    { name: 'Ultrasound (Pregnancy/OB)', type: 'TEST', description: 'Obstetrical ultrasound for fetal monitoring.', basePrice: 1200 },
    { name: 'ECG', type: 'TEST', description: 'Electrocardiogram recording the electrical signal from the heart.', basePrice: 300 },
    { name: 'Echocardiogram', type: 'TEST', description: 'Ultrasound of the heart to check structure and function.', basePrice: 2500 },
    { name: 'Endoscopy (Upper GI)', type: 'TEST', description: 'Camera investigation of the esophagus and stomach.', basePrice: 4000 },
    { name: 'Colonoscopy', type: 'TEST', description: 'Internal camera investigation of the colon.', basePrice: 5000 },
    
    // Surgical Operations
    { name: 'Appendectomy (Laparoscopic)', type: 'OPERATION', description: 'Minimally invasive surgical removal of the appendix.', basePrice: 55000 },
    { name: 'Appendectomy (Open)', type: 'OPERATION', description: 'Traditional surgical removal of the appendix.', basePrice: 40000 },
    { name: 'Cataract Surgery (Phaco)', type: 'OPERATION', description: 'Advanced eye surgery replacing clouded lens.', basePrice: 20000 },
    { name: 'C-Section (Caesarean)', type: 'OPERATION', description: 'Surgical delivery of a baby.', basePrice: 50000 },
    { name: 'Normal Delivery', type: 'OPERATION', description: 'Hospital facilitated natural birth.', basePrice: 20000 },
    { name: 'Cardiac Bypass (CABG)', type: 'OPERATION', description: 'Heart bypass surgery to restore coronary blood flow.', basePrice: 350000 },
    { name: 'Angioplasty & Stenting', type: 'OPERATION', description: 'Clearing blocked arteries and placing a stent.', basePrice: 150000 },
    { name: 'Total Knee Replacement', type: 'OPERATION', description: 'Joint replacement surgery for deteriorating knees.', basePrice: 250000 },
    { name: 'Gallbladder Removal (Cholecystectomy)', type: 'OPERATION', description: 'Laparoscopic removal of the gallbladder.', basePrice: 60000 },
    { name: 'Tonsillectomy', type: 'OPERATION', description: 'Surgical removal of the human tonsils.', basePrice: 25000 },
    { name: 'Hernia Repair Surgery', type: 'OPERATION', description: 'Surgical correction of a hernia.', basePrice: 45000 },
    { name: 'Kidney Stone Removal (PCNL)', type: 'OPERATION', description: 'Percutaneous nephrolithotomy for large kidney stones.', basePrice: 80000 }
  ]
  const createdServices = []
  for (const s of servicesData) {
    const srv = await prisma.service.create({ data: s })
    createdServices.push(srv)
  }

  // ── 2. Create Hospitals across BD Regions ──
  console.log('Creating Hospitals...')
  const hospitalsData = [
    // Dhaka
    { name: 'Square Hospital', city: 'Dhaka', address: '18/F Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath', contactPhone: '10616', description: 'Top tier private tertiary care hospital with advanced imaging and surgical facilities.' },
    { name: 'Evercare Hospital', city: 'Dhaka', address: 'Plot 81, Block E, Bashundhara R/A', contactPhone: '10678', description: 'Multidisciplinary super-specialty hospital compliant with international standards.' },
    { name: 'Dhaka Medical College Hospital', city: 'Dhaka', address: 'Secretariat Road, Dhaka 1000', contactPhone: '+880255165088', description: 'The absolute largest public hospital in Bangladesh, massive capacity but highly crowded.' },
    { name: 'BIRDEM General Hospital', city: 'Dhaka', address: '122 Kazi Nazrul Islam Ave, Shahbagh', contactPhone: '+880241060371', description: 'Premier institute for diabetic, endocrine, and metabolic disorders.' },
    { name: 'Labaid Specialized Hospital', city: 'Dhaka', address: 'Road No 4, Dhanmondi', contactPhone: '10606', description: 'Highly renowned facility focusing heavily on cardiac, orthopedic, and diagnostic services.' },
    { name: 'National Heart Foundation', city: 'Dhaka', address: 'Plot 7/2, Section 2, Mirpur', contactPhone: '+880258053535', description: 'Dedicated institute specializing entirely on cardiovascular diseases and bypass surgery.' },
    { name: 'Ibn Sina Hospital', city: 'Dhaka', address: 'House 48, Road 9/A, Dhanmondi', contactPhone: '+880248115270', description: 'Popular private healthcare provider highly reputed for extensive diagnostic labs.' },
    
    // Chittagong
    { name: 'Evercare Hospital Chattogram', city: 'Chittagong', address: 'Plot No. H1, Ananna Residential Area', contactPhone: '10663', description: 'Premium healthcare facility in the port city with JCI accreditation.' },
    { name: 'Chittagong Medical College Hospital', city: 'Chittagong', address: 'KB Fazlul Kader Road, Panchlaish', contactPhone: '+88031619597', description: 'Major public hospital serving the entirety of Chittagong division.' },
    { name: 'Epic Health Care', city: 'Chittagong', address: '19 KB Fazlul Kader Rd, Panchlaish', contactPhone: '+8801935889977', description: 'Highly modernized diagnostic center and polyclinic in CTG.' },
    
    // Sylhet
    { name: 'Mount Adora Hospital', city: 'Sylhet', address: 'Noyashorok, Sylhet', contactPhone: '+880821-714081', description: 'Leading modern hospital in Sylhet offering multidisciplinary care.' },
    { name: 'Sylhet MAG Osmani Medical College Hospital', city: 'Sylhet', address: 'Medical Road, Sylhet 3100', contactPhone: '+880821-713667', description: 'Primary referral public medical college and hospital in the northeast block.' },
    { name: 'Al Haramain Hospital', city: 'Sylhet', address: 'Samata-30, Chali Bandar', contactPhone: '+8801931225555', description: '12-story state of the art healthcare tower serving Sylhet and expats.' },
    
    // Rajshahi
    { name: 'Rajshahi Medical College Hospital', city: 'Rajshahi', address: 'Rajshahi 6000', contactPhone: '+880721-772150', description: 'Premier tertiary care hospital in Rajshahi.' },
    { name: 'Rajshahi Royal Hospital', city: 'Rajshahi', address: 'Khademul Islam Road', contactPhone: '+880721-772793', description: 'Popular private sector hospital in the Silk City.' },
    
    // Khulna, Barishal, Rangpur
    { name: 'Khulna City Medical College & Hospital', city: 'Khulna', address: 'B-25, Moilapota, Khulna', contactPhone: '+88041-731011', description: 'State-of-the-art facility serving Khulna region.' },
    { name: 'Sher-e-Bangla Medical College Hospital', city: 'Barishal', address: 'Band Road, Barishal', contactPhone: '+880431-2173541', description: 'Major medical center in the southern delta region.' },
    { name: 'Rangpur Medical College Hospital', city: 'Rangpur', address: 'Medical College Rd, Rangpur', contactPhone: '+880521-62150', description: 'Primary hospital for the entire northern Rangpur division.' }
  ]
  const createdHospitals = []
  for (const h of hospitalsData) {
    const hosp = await prisma.hospital.create({ data: h })
    createdHospitals.push(hosp)
  }

  // ── 3. Map Services to Hospitals (HospitalService) ──
  console.log('Mapping Services to Hospitals...')
  // Give every hospital a random subset of services with slightly varying prices
  for (const hosp of createdHospitals) {
    // Pick 15 to 25 random services for this hospital
    const numServices = Math.floor(Math.random() * 10) + 15
    const shuffledServices = [...createdServices].sort(() => 0.5 - Math.random())
    const selectedServices = shuffledServices.slice(0, numServices)

    for (const srv of selectedServices) {
      // Fluctuate price by -10% to +20% based on hospital prestige (simulated by random)
      const multiplier = 0.9 + (Math.random() * 0.3)
      const finalPrice = Math.round((srv.basePrice * multiplier) / 100) * 100

      await prisma.hospitalService.create({
        data: {
          hospitalId: hosp.id,
          serviceId: srv.id,
          price: finalPrice,
          available: Math.random() > 0.1 // 90% chance it's available
        }
      })
    }
  }

  console.log('✅ Seeding Complete!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
