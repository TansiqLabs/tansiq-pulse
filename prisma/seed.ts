import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.payment.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.settings.deleteMany()
  await prisma.counter.deleteMany()

  console.log('✅ Cleared existing data')

  // Initialize counters
  await prisma.counter.createMany({
    data: [
      { name: 'patient', prefix: 'TP-', lastValue: 0 },
      { name: 'doctor', prefix: 'DOC-', lastValue: 0 },
      { name: 'appointment', prefix: 'APT-', lastValue: 0 },
      { name: 'invoice', prefix: 'INV-', lastValue: 0 },
      { name: 'payment', prefix: 'PAY-', lastValue: 0 },
      { name: 'service', prefix: 'SRV-', lastValue: 0 },
    ]
  })
  console.log('✅ Counters initialized')

  // Initialize settings
  await prisma.settings.createMany({
    data: [
      { key: 'hospital_name', value: 'Tansiq Medical Center', type: 'string' },
      { key: 'hospital_address', value: '123 Healthcare Avenue, Medical District', type: 'string' },
      { key: 'hospital_phone', value: '+1 (555) 123-4567', type: 'string' },
      { key: 'hospital_email', value: 'info@tansiqmedical.com', type: 'string' },
      { key: 'tax_rate', value: '0.05', type: 'number' },
      { key: 'currency', value: 'USD', type: 'string' },
      { key: 'currency_symbol', value: '$', type: 'string' },
      { key: 'default_consultation_minutes', value: '15', type: 'number' },
    ]
  })
  console.log('✅ Settings initialized')

  // Create doctors
  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        employeeId: 'DOC-0001',
        firstName: 'Sarah',
        lastName: 'Mitchell',
        specialization: 'General Medicine',
        phone: '+1 (555) 201-0001',
        email: 'sarah.mitchell@tansiqmedical.com',
        consultationFee: 75,
        consultationMinutes: 15,
        availability: JSON.stringify({
          monday: ['09:00-13:00', '14:00-18:00'],
          tuesday: ['09:00-13:00', '14:00-18:00'],
          wednesday: ['09:00-13:00'],
          thursday: ['09:00-13:00', '14:00-18:00'],
          friday: ['09:00-13:00', '14:00-17:00'],
        }),
        isActive: true,
      }
    }),
    prisma.doctor.create({
      data: {
        employeeId: 'DOC-0002',
        firstName: 'James',
        lastName: 'Chen',
        specialization: 'Cardiology',
        phone: '+1 (555) 201-0002',
        email: 'james.chen@tansiqmedical.com',
        consultationFee: 150,
        consultationMinutes: 30,
        availability: JSON.stringify({
          monday: ['10:00-14:00'],
          wednesday: ['10:00-14:00'],
          friday: ['10:00-14:00'],
        }),
        isActive: true,
      }
    }),
    prisma.doctor.create({
      data: {
        employeeId: 'DOC-0003',
        firstName: 'Emily',
        lastName: 'Rodriguez',
        specialization: 'Pediatrics',
        phone: '+1 (555) 201-0003',
        email: 'emily.rodriguez@tansiqmedical.com',
        consultationFee: 85,
        consultationMinutes: 20,
        availability: JSON.stringify({
          monday: ['08:00-12:00', '13:00-17:00'],
          tuesday: ['08:00-12:00', '13:00-17:00'],
          wednesday: ['08:00-12:00'],
          thursday: ['08:00-12:00', '13:00-17:00'],
          friday: ['08:00-12:00'],
        }),
        isActive: true,
      }
    }),
    prisma.doctor.create({
      data: {
        employeeId: 'DOC-0004',
        firstName: 'Michael',
        lastName: 'Thompson',
        specialization: 'Orthopedics',
        phone: '+1 (555) 201-0004',
        email: 'michael.thompson@tansiqmedical.com',
        consultationFee: 120,
        consultationMinutes: 25,
        availability: JSON.stringify({
          tuesday: ['09:00-13:00', '14:00-18:00'],
          thursday: ['09:00-13:00', '14:00-18:00'],
        }),
        isActive: true,
      }
    }),
    prisma.doctor.create({
      data: {
        employeeId: 'DOC-0005',
        firstName: 'Lisa',
        lastName: 'Patel',
        specialization: 'Dermatology',
        phone: '+1 (555) 201-0005',
        email: 'lisa.patel@tansiqmedical.com',
        consultationFee: 95,
        consultationMinutes: 15,
        availability: JSON.stringify({
          monday: ['10:00-15:00'],
          wednesday: ['10:00-15:00'],
          friday: ['10:00-15:00'],
        }),
        isActive: true,
      }
    }),
  ])
  console.log(`✅ Created ${doctors.length} doctors`)

  // Update doctor counter
  await prisma.counter.update({
    where: { name: 'doctor' },
    data: { lastValue: 5 }
  })

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: { code: 'SRV-001', name: 'General Consultation', category: 'CONSULTATION', unitPrice: 75, description: 'Standard doctor consultation' }
    }),
    prisma.service.create({
      data: { code: 'SRV-002', name: 'Specialist Consultation', category: 'CONSULTATION', unitPrice: 150, description: 'Specialist doctor consultation' }
    }),
    prisma.service.create({
      data: { code: 'SRV-003', name: 'Follow-up Visit', category: 'CONSULTATION', unitPrice: 45, description: 'Follow-up consultation' }
    }),
    prisma.service.create({
      data: { code: 'SRV-004', name: 'Blood Test - Basic', category: 'LAB', unitPrice: 35, description: 'Complete blood count' }
    }),
    prisma.service.create({
      data: { code: 'SRV-005', name: 'Blood Test - Comprehensive', category: 'LAB', unitPrice: 85, description: 'Full metabolic panel' }
    }),
    prisma.service.create({
      data: { code: 'SRV-006', name: 'X-Ray', category: 'PROCEDURE', unitPrice: 120, description: 'Standard X-ray imaging' }
    }),
    prisma.service.create({
      data: { code: 'SRV-007', name: 'ECG', category: 'PROCEDURE', unitPrice: 65, description: 'Electrocardiogram' }
    }),
    prisma.service.create({
      data: { code: 'SRV-008', name: 'Wound Dressing', category: 'PROCEDURE', unitPrice: 25, description: 'Basic wound care' }
    }),
    prisma.service.create({
      data: { code: 'SRV-009', name: 'Injection Administration', category: 'PROCEDURE', unitPrice: 15, description: 'Injection service' }
    }),
    prisma.service.create({
      data: { code: 'SRV-010', name: 'Vaccination', category: 'PROCEDURE', unitPrice: 45, description: 'Standard vaccination' }
    }),
  ])
  console.log(`✅ Created ${services.length} services`)

  // Update service counter
  await prisma.counter.update({
    where: { name: 'service' },
    data: { lastValue: 10 }
  })

  // Create patients
  const today = new Date()
  const formatDate = (daysAgo: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - daysAgo)
    return d
  }

  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        mrn: `TP-${today.toISOString().slice(0,10).replace(/-/g,'')}-0001`,
        firstName: 'John',
        lastName: 'Anderson',
        dateOfBirth: new Date('1985-03-15'),
        gender: 'MALE',
        phone: '+1 (555) 100-0001',
        email: 'john.anderson@email.com',
        address: '456 Oak Street, Apt 12',
        bloodType: 'A+',
        emergencyContact: 'Mary Anderson',
        emergencyPhone: '+1 (555) 100-0002',
        createdAt: formatDate(30),
      }
    }),
    prisma.patient.create({
      data: {
        mrn: `TP-${today.toISOString().slice(0,10).replace(/-/g,'')}-0002`,
        firstName: 'Emma',
        lastName: 'Wilson',
        dateOfBirth: new Date('1992-07-22'),
        gender: 'FEMALE',
        phone: '+1 (555) 100-0003',
        email: 'emma.wilson@email.com',
        address: '789 Pine Avenue',
        bloodType: 'O-',
        emergencyContact: 'David Wilson',
        emergencyPhone: '+1 (555) 100-0004',
        createdAt: formatDate(25),
      }
    }),
    prisma.patient.create({
      data: {
        mrn: `TP-${today.toISOString().slice(0,10).replace(/-/g,'')}-0003`,
        firstName: 'Robert',
        lastName: 'Garcia',
        dateOfBirth: new Date('1978-11-08'),
        gender: 'MALE',
        phone: '+1 (555) 100-0005',
        email: 'robert.garcia@email.com',
        address: '321 Maple Drive',
        bloodType: 'B+',
        createdAt: formatDate(20),
      }
    }),
    prisma.patient.create({
      data: {
        mrn: `TP-${today.toISOString().slice(0,10).replace(/-/g,'')}-0004`,
        firstName: 'Sophia',
        lastName: 'Martinez',
        dateOfBirth: new Date('2018-04-30'),
        gender: 'FEMALE',
        phone: '+1 (555) 100-0006',
        address: '654 Elm Court',
        bloodType: 'AB+',
        emergencyContact: 'Carlos Martinez',
        emergencyPhone: '+1 (555) 100-0007',
        createdAt: formatDate(15),
      }
    }),
    prisma.patient.create({
      data: {
        mrn: `TP-${today.toISOString().slice(0,10).replace(/-/g,'')}-0005`,
        firstName: 'William',
        lastName: 'Brown',
        dateOfBirth: new Date('1965-09-12'),
        gender: 'MALE',
        phone: '+1 (555) 100-0008',
        email: 'william.brown@email.com',
        address: '987 Cedar Lane',
        bloodType: 'O+',
        emergencyContact: 'Patricia Brown',
        emergencyPhone: '+1 (555) 100-0009',
        createdAt: formatDate(10),
      }
    }),
    prisma.patient.create({
      data: {
        mrn: `TP-${today.toISOString().slice(0,10).replace(/-/g,'')}-0006`,
        firstName: 'Olivia',
        lastName: 'Davis',
        dateOfBirth: new Date('1990-01-25'),
        gender: 'FEMALE',
        phone: '+1 (555) 100-0010',
        email: 'olivia.davis@email.com',
        address: '147 Birch Boulevard',
        bloodType: 'A-',
        createdAt: formatDate(5),
      }
    }),
    prisma.patient.create({
      data: {
        mrn: `TP-${today.toISOString().slice(0,10).replace(/-/g,'')}-0007`,
        firstName: 'David',
        lastName: 'Lee',
        dateOfBirth: new Date('1982-06-18'),
        gender: 'MALE',
        phone: '+1 (555) 100-0011',
        email: 'david.lee@email.com',
        address: '258 Walnut Way',
        bloodType: 'B-',
        emergencyContact: 'Jennifer Lee',
        emergencyPhone: '+1 (555) 100-0012',
        createdAt: formatDate(3),
      }
    }),
    prisma.patient.create({
      data: {
        mrn: `TP-${today.toISOString().slice(0,10).replace(/-/g,'')}-0008`,
        firstName: 'Isabella',
        lastName: 'Taylor',
        dateOfBirth: new Date('1995-12-03'),
        gender: 'FEMALE',
        phone: '+1 (555) 100-0013',
        email: 'isabella.taylor@email.com',
        address: '369 Spruce Street',
        createdAt: formatDate(1),
      }
    }),
  ])
  console.log(`✅ Created ${patients.length} patients`)

  // Update patient counter
  await prisma.counter.update({
    where: { name: 'patient' },
    data: { lastValue: 8 }
  })

  // Create appointments for today
  const todayStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  
  const appointments = await Promise.all([
    // Today's appointments
    prisma.appointment.create({
      data: {
        appointmentNo: `APT-${todayStr}-0001`,
        patientId: patients[0].id,
        doctorId: doctors[0].id,
        scheduledDate: today,
        scheduledTime: '09:00',
        duration: 15,
        status: 'COMPLETED',
        reason: 'Annual checkup',
        diagnosis: 'Patient in good health. Advised regular exercise.',
        arrivedAt: new Date(today.setHours(8, 50)),
        startedAt: new Date(today.setHours(9, 0)),
        completedAt: new Date(today.setHours(9, 15)),
      }
    }),
    prisma.appointment.create({
      data: {
        appointmentNo: `APT-${todayStr}-0002`,
        patientId: patients[1].id,
        doctorId: doctors[0].id,
        scheduledDate: today,
        scheduledTime: '09:30',
        duration: 15,
        status: 'COMPLETED',
        reason: 'Headache and fatigue',
        symptoms: 'Persistent headache for 3 days, fatigue',
        diagnosis: 'Tension headache. Prescribed rest and pain relievers.',
        arrivedAt: new Date(today.setHours(9, 25)),
        startedAt: new Date(today.setHours(9, 30)),
        completedAt: new Date(today.setHours(9, 45)),
      }
    }),
    prisma.appointment.create({
      data: {
        appointmentNo: `APT-${todayStr}-0003`,
        patientId: patients[2].id,
        doctorId: doctors[1].id,
        scheduledDate: today,
        scheduledTime: '10:00',
        duration: 30,
        status: 'IN_PROGRESS',
        reason: 'Chest discomfort',
        symptoms: 'Mild chest discomfort during exercise',
        arrivedAt: new Date(today.setHours(9, 55)),
        startedAt: new Date(today.setHours(10, 0)),
      }
    }),
    prisma.appointment.create({
      data: {
        appointmentNo: `APT-${todayStr}-0004`,
        patientId: patients[3].id,
        doctorId: doctors[2].id,
        scheduledDate: today,
        scheduledTime: '10:30',
        duration: 20,
        status: 'WAITING',
        reason: 'Fever and cough',
        symptoms: 'Low grade fever, dry cough',
        arrivedAt: new Date(today.setHours(10, 20)),
      }
    }),
    prisma.appointment.create({
      data: {
        appointmentNo: `APT-${todayStr}-0005`,
        patientId: patients[4].id,
        doctorId: doctors[3].id,
        scheduledDate: today,
        scheduledTime: '11:00',
        duration: 25,
        status: 'SCHEDULED',
        reason: 'Knee pain',
        symptoms: 'Right knee pain after morning walks',
      }
    }),
    prisma.appointment.create({
      data: {
        appointmentNo: `APT-${todayStr}-0006`,
        patientId: patients[5].id,
        doctorId: doctors[4].id,
        scheduledDate: today,
        scheduledTime: '11:30',
        duration: 15,
        status: 'SCHEDULED',
        reason: 'Skin rash',
        symptoms: 'Itchy rash on arms',
      }
    }),
    prisma.appointment.create({
      data: {
        appointmentNo: `APT-${todayStr}-0007`,
        patientId: patients[6].id,
        doctorId: doctors[0].id,
        scheduledDate: today,
        scheduledTime: '14:00',
        duration: 15,
        status: 'SCHEDULED',
        reason: 'Back pain',
      }
    }),
    prisma.appointment.create({
      data: {
        appointmentNo: `APT-${todayStr}-0008`,
        patientId: patients[7].id,
        doctorId: doctors[0].id,
        scheduledDate: today,
        scheduledTime: '14:30',
        duration: 15,
        status: 'SCHEDULED',
        reason: 'General consultation',
      }
    }),
  ])
  console.log(`✅ Created ${appointments.length} appointments`)

  // Update appointment counter
  await prisma.counter.update({
    where: { name: 'appointment' },
    data: { lastValue: 8 }
  })

  // Create invoices for completed appointments
  const monthStr = today.toISOString().slice(0, 7).replace('-', '')
  
  // Invoice 1 - Paid
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${monthStr}-0001`,
      patientId: patients[0].id,
      appointmentId: appointments[0].id,
      subtotal: 110,
      discountType: null,
      discountValue: 0,
      discountAmount: 0,
      taxRate: 0.05,
      taxAmount: 5.50,
      totalAmount: 115.50,
      paidAmount: 115.50,
      balanceAmount: 0,
      status: 'PAID',
      paidAt: today,
    }
  })
  
  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: invoice1.id, serviceId: services[0].id, description: 'General Consultation', quantity: 1, unitPrice: 75, totalPrice: 75 },
      { invoiceId: invoice1.id, serviceId: services[3].id, description: 'Blood Test - Basic', quantity: 1, unitPrice: 35, totalPrice: 35 },
    ]
  })

  await prisma.payment.create({
    data: {
      paymentNo: `PAY-${todayStr}-0001`,
      invoiceId: invoice1.id,
      amount: 115.50,
      paymentMethod: 'CARD',
      reference: 'CARD-xxxx-1234',
      paidAt: today,
    }
  })

  // Invoice 2 - Paid
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${monthStr}-0002`,
      patientId: patients[1].id,
      appointmentId: appointments[1].id,
      subtotal: 75,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      discountAmount: 7.50,
      taxRate: 0.05,
      taxAmount: 3.38,
      totalAmount: 70.88,
      paidAmount: 70.88,
      balanceAmount: 0,
      status: 'PAID',
      paidAt: today,
    }
  })

  await prisma.invoiceItem.create({
    data: { invoiceId: invoice2.id, serviceId: services[0].id, description: 'General Consultation', quantity: 1, unitPrice: 75, totalPrice: 75 }
  })

  await prisma.payment.create({
    data: {
      paymentNo: `PAY-${todayStr}-0002`,
      invoiceId: invoice2.id,
      amount: 70.88,
      paymentMethod: 'CASH',
      paidAt: today,
    }
  })

  // Invoice 3 - Pending (for an older appointment)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10).replace(/-/g, '')

  const oldAppointment = await prisma.appointment.create({
    data: {
      appointmentNo: `APT-${yesterdayStr}-0001`,
      patientId: patients[4].id,
      doctorId: doctors[0].id,
      scheduledDate: yesterday,
      scheduledTime: '10:00',
      duration: 15,
      status: 'COMPLETED',
      reason: 'Follow-up visit',
      diagnosis: 'Recovery progressing well.',
      arrivedAt: yesterday,
      startedAt: yesterday,
      completedAt: yesterday,
    }
  })

  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${monthStr}-0003`,
      patientId: patients[4].id,
      appointmentId: oldAppointment.id,
      subtotal: 195,
      discountType: null,
      discountValue: 0,
      discountAmount: 0,
      taxRate: 0.05,
      taxAmount: 9.75,
      totalAmount: 204.75,
      paidAmount: 0,
      balanceAmount: 204.75,
      status: 'PENDING',
      createdAt: yesterday,
    }
  })

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: invoice3.id, serviceId: services[2].id, description: 'Follow-up Visit', quantity: 1, unitPrice: 45, totalPrice: 45 },
      { invoiceId: invoice3.id, serviceId: services[1].id, description: 'Specialist Consultation', quantity: 1, unitPrice: 150, totalPrice: 150 },
    ]
  })

  // Invoice 4 - Partially Paid
  const twoDaysAgo = new Date(today)
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
  const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10).replace(/-/g, '')

  const olderAppointment = await prisma.appointment.create({
    data: {
      appointmentNo: `APT-${twoDaysAgoStr}-0001`,
      patientId: patients[6].id,
      doctorId: doctors[1].id,
      scheduledDate: twoDaysAgo,
      scheduledTime: '11:00',
      duration: 30,
      status: 'COMPLETED',
      reason: 'Heart checkup',
      diagnosis: 'ECG normal. Continue medication.',
      arrivedAt: twoDaysAgo,
      startedAt: twoDaysAgo,
      completedAt: twoDaysAgo,
    }
  })

  const invoice4 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${monthStr}-0004`,
      patientId: patients[6].id,
      appointmentId: olderAppointment.id,
      subtotal: 215,
      discountType: 'FIXED',
      discountValue: 15,
      discountAmount: 15,
      taxRate: 0.05,
      taxAmount: 10,
      totalAmount: 210,
      paidAmount: 100,
      balanceAmount: 110,
      status: 'PARTIALLY_PAID',
      createdAt: twoDaysAgo,
    }
  })

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: invoice4.id, serviceId: services[1].id, description: 'Specialist Consultation', quantity: 1, unitPrice: 150, totalPrice: 150 },
      { invoiceId: invoice4.id, serviceId: services[6].id, description: 'ECG', quantity: 1, unitPrice: 65, totalPrice: 65 },
    ]
  })

  await prisma.payment.create({
    data: {
      paymentNo: `PAY-${twoDaysAgoStr}-0001`,
      invoiceId: invoice4.id,
      amount: 100,
      paymentMethod: 'CASH',
      notes: 'Partial payment, balance pending',
      paidAt: twoDaysAgo,
    }
  })

  console.log('✅ Created 4 invoices with payments')

  // Update counters
  await prisma.counter.update({
    where: { name: 'appointment' },
    data: { lastValue: 10 }
  })
  await prisma.counter.update({
    where: { name: 'invoice' },
    data: { lastValue: 4 }
  })
  await prisma.counter.update({
    where: { name: 'payment' },
    data: { lastValue: 3 }
  })

  console.log('')
  console.log('🎉 Database seeding completed!')
  console.log('')
  console.log('Summary:')
  console.log(`   - ${doctors.length} Doctors`)
  console.log(`   - ${services.length} Services`)
  console.log(`   - ${patients.length} Patients`)
  console.log(`   - ${appointments.length + 2} Appointments`)
  console.log('   - 4 Invoices (2 Paid, 1 Pending, 1 Partially Paid)')
  console.log('   - 3 Payments')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
