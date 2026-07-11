import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // --- Admin (web portal) ---
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  await prisma.admin.upsert({
    where: { email: 'admin@petrapharma.com' },
    update: {},
    create: {
      email: 'admin@petrapharma.com',
      passwordHash: adminPassword,
      fullName: 'Portal Administrator',
      role: AdminRole.SUPERADMIN,
    },
  });

  // --- Location hierarchy: Country -> City -> Doctor ---
  const iraq = await prisma.country.upsert({
    where: { isoCode: 'IQ' },
    update: {},
    create: { name: 'Iraq', isoCode: 'IQ' },
  });

  const cityData = ['Erbil', 'Baghdad', 'Basra', 'Sulaymaniyah'];
  const cities: Record<string, string> = {};
  for (const name of cityData) {
    const city = await prisma.city.upsert({
      where: { countryId_name: { countryId: iraq.id, name } },
      update: {},
      create: { name, countryId: iraq.id },
    });
    cities[name] = city.id;
  }

  const doctorPassword = await bcrypt.hash('Doctor123!', 12);
  const doctors = [
    { fullName: 'Dr. Sara Ahmed', specialty: 'Endocrinology', city: 'Erbil', email: 'sara@petrapharma.com' },
    { fullName: 'Dr. Omar Kareem', specialty: 'Internal Medicine', city: 'Erbil', email: 'omar@petrapharma.com' },
    { fullName: 'Dr. Layla Hassan', specialty: 'Endocrinology', city: 'Baghdad', email: 'layla@petrapharma.com' },
    { fullName: 'Dr. Yusuf Ali', specialty: 'Family Medicine', city: 'Basra', email: 'yusuf@petrapharma.com' },
    { fullName: 'Dr. Nûr Salih', specialty: 'Endocrinology', city: 'Sulaymaniyah', email: 'nur@petrapharma.com' },
  ];
  for (const d of doctors) {
    const existing = await prisma.doctor.findFirst({
      where: { fullName: d.fullName, cityId: cities[d.city] },
    });
    const data = {
      fullName: d.fullName,
      specialty: d.specialty,
      email: d.email,
      passwordHash: doctorPassword,
      cityId: cities[d.city],
      countryId: iraq.id,
    };
    if (existing) {
      await prisma.doctor.update({ where: { id: existing.id }, data });
    } else {
      await prisma.doctor.create({ data });
    }
  }

  // --- Semetra (Semaglutide) titration schedule from the patient guide ---
  const semetra = await prisma.medication.upsert({
    where: { name: 'Semetra' },
    update: { genericName: 'Semaglutide', manufacturer: 'Petra Pharma', isTitrated: true },
    create: {
      name: 'Semetra',
      genericName: 'Semaglutide',
      manufacturer: 'Petra Pharma',
      isTitrated: true,
    },
  });

  // First Pen (1.5 ml): W1-4 = 0.25 mg, W5-6 = 0.50 mg
  // Second Pen (1.5 ml): W1-4 = 0.50 mg
  const pens = [
    {
      label: 'First Pen (1.5 ml)',
      sequence: 1,
      volumeMl: 1.5,
      weeks: [0.25, 0.25, 0.25, 0.25, 0.5, 0.5],
    },
    {
      label: 'Second Pen (1.5 ml)',
      sequence: 2,
      volumeMl: 1.5,
      weeks: [0.5, 0.5, 0.5, 0.5],
    },
  ];

  for (const p of pens) {
    const pen = await prisma.pen.upsert({
      where: { medicationId_sequence: { medicationId: semetra.id, sequence: p.sequence } },
      update: { label: p.label, volumeMl: p.volumeMl },
      create: {
        medicationId: semetra.id,
        label: p.label,
        sequence: p.sequence,
        volumeMl: p.volumeMl,
      },
    });
    for (let i = 0; i < p.weeks.length; i++) {
      await prisma.titrationWeek.upsert({
        where: { penId_weekNumber: { penId: pen.id, weekNumber: i + 1 } },
        update: { doseMg: p.weeks[i] },
        create: { penId: pen.id, weekNumber: i + 1, doseMg: p.weeks[i] },
      });
    }
  }

  // --- Demo patient ---
  const demoPassword = await bcrypt.hash('Patient123!', 12);
  const firstDoctor = await prisma.doctor.findFirst({ where: { cityId: cities['Erbil'] } });
  const demoProfile = {
    fullName: 'Demo Patient',
    phone: '+964 750 000 0000',
    birthDate: new Date('1990-05-15'),
    gender: 'FEMALE' as const,
    heightCm: 168,
    chronicConditions: ['diabetes', 'hypertension'],
    countryId: iraq.id,
    cityId: cities['Erbil'],
    doctorId: firstDoctor?.id ?? null,
  };
  const demoPatient = await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: demoProfile, // keep the demo profile populated on re-seed
    create: { email: 'patient@example.com', passwordHash: demoPassword, ...demoProfile },
  });

  // --- Demo clinical follow-up for the demo patient ---
  await prisma.clinicalAssessment.upsert({
    where: { userId: demoPatient.id },
    update: {},
    create: {
      userId: demoPatient.id,
      doctorId: firstDoctor?.id ?? null,
      diabetesDuration: '5 years',
      baselineHba1c: 8.2,
      startingDose: '0.25 mg',
      concomitantMeds: 'Metformin 1000mg, Lisinopril 10mg',
      treatmentStatus: 'ONGOING',
      physicianComments: 'Tolerating titration well. Review weight in 4 weeks.',
    },
  });

  console.log('Seed complete.');
  console.log('  Admin:   admin@petrapharma.com / Admin123!');
  console.log('  Doctor:  sara@petrapharma.com / Doctor123!');
  console.log('  Patient: patient@example.com / Patient123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
