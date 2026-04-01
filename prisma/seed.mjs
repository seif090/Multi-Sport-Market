import { PrismaClient, UserRole, BookingStatus, MaintenanceStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is missing, skipping seed.')
    return
  }

  await prisma.booking.deleteMany()
  await prisma.maintenanceJob.deleteMany()
  await prisma.court.deleteMany()
  await prisma.user.deleteMany()

  const vendor = await prisma.user.create({
    data: {
      name: 'Smouha Sports Group',
      phone: '01000000010',
      role: UserRole.VENDOR,
    },
  })

  const technician = await prisma.user.create({
    data: {
      name: 'Alex Repair Team',
      phone: '01000000011',
      role: UserRole.TECHNICIAN,
    },
  })

  const player = await prisma.user.create({
    data: {
      name: 'Ahmed Player',
      phone: '01000000012',
      role: UserRole.PLAYER,
    },
  })

  const courts = await prisma.court.createMany({
    data: [
      {
        id: 'court-1',
        name: 'Arena Smouha',
        area: 'smouha',
        areaLabel: 'سموحة',
        sport: 'football',
        sportLabel: 'كرة قدم',
        price: 'mid',
        priceLabel: 'متوسط',
        badge: 'متاح اليوم',
        description: 'ملعب خماسي بمواعيد مرنة، إضاءة قوية، وحجز فوري بدون تعارض.',
        vendorId: vendor.id,
      },
      {
        id: 'court-2',
        name: 'Cairo Street Padel',
        area: 'sidi-gaber',
        areaLabel: 'سيدي جابر',
        sport: 'padel',
        sportLabel: 'بادل',
        price: 'high',
        priceLabel: 'مرتفع',
        badge: 'Premium',
        description: 'تجربة بادل مميزة مع نظام عربون وتأكيد تلقائي للحجز.',
        vendorId: vendor.id,
      },
      {
        id: 'court-3',
        name: 'Seaside Billiards Hall',
        area: 'san-stefano',
        areaLabel: 'سان ستيفانو',
        sport: 'billiards',
        sportLabel: 'بلياردو',
        price: 'mid',
        priceLabel: 'متوسط',
        badge: 'Indoor',
        description: 'صالات هادئة للحجز بالساعة مع أوقات مخصصة للبطولات الودية.',
        vendorId: vendor.id,
      },
    ],
  })

  const booking = await prisma.booking.create({
    data: {
      courtId: 'court-1',
      userId: player.id,
      customerName: 'Ahmed Player',
      phone: '01000000012',
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      status: BookingStatus.CONFIRMED,
      notes: 'Seed booking',
    },
  })

  await prisma.maintenanceJob.createMany({
    data: [
      {
        title: 'صيانة إضاءة كشافات',
        category: 'إضاءة',
        vendorName: 'Arena Smouha',
        customerName: 'Smouha Sports Group',
        phone: '01000000010',
        status: MaintenanceStatus.NEW,
        notes: 'الكشاف الشمال يحتاج فحص واستبدال درايفر.',
        vendorId: vendor.id,
        technicianId: technician.id,
      },
      {
        title: 'ترميم عشب صناعي',
        category: 'أرضيات',
        vendorName: 'Cairo Street Padel',
        customerName: 'Smouha Sports Group',
        phone: '01000000010',
        status: MaintenanceStatus.ACCEPTED,
        notes: 'المنطقة الوسطى فيها تآكل واضح.',
        vendorId: vendor.id,
        technicianId: technician.id,
      },
    ],
  })

  console.log(`Seeded ${courts.count} courts, 1 booking, and maintenance jobs.`)
  console.log(`Seed booking id: ${booking.id}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
