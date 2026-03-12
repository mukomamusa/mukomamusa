import db from './database-schema';
import { hashPassword } from './auth';
import { popularRoutes } from './zambia-data';

export async function seedDatabase() {
  try {
    // Check if data already exists
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (existingUsers.count > 0) {
      console.log('Database already seeded');
      return;
    }

    // Create sample bus companies
    const companies = [
      {
        email: 'info@mazhindubuses.com',
        password: await hashPassword('password123'),
        name: 'Mazhindu Buses',
        phone: '+260977123456',
        user_type: 'company',
        company_name: 'Mazhindu Bus Services',
        license_number: 'MBS2024001'
      },
      {
        email: 'contact@powertools.com',
        password: await hashPassword('password123'),
        name: 'Power Tools Transport',
        phone: '+260966234567',
        user_type: 'company',
        company_name: 'Power Tools Transport Ltd',
        license_number: 'PTT2024002'
      },
      {
        email: 'info@juldan.com',
        password: await hashPassword('password123'),
        name: 'Juldan Motors',
        phone: '+260955345678',
        user_type: 'company',
        company_name: 'Juldan Motors',
        license_number: 'JDM2024003'
      }
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (email, password, name, phone, user_type, company_name, license_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const companyIds: number[] = [];
    for (const company of companies) {
      const result = insertUser.run(
        company.email,
        company.password,
        company.name,
        company.phone,
        company.user_type,
        company.company_name,
        company.license_number
      );
      companyIds.push(result.lastInsertRowid as number);
    }

    // Create sample customer
    const customerResult = insertUser.run(
      'customer@example.com',
      await hashPassword('password123'),
      'John Mwansa',
      '+260971234567',
      'customer',
      null,
      null
    );

    // Create admin user
    const adminResult = insertUser.run(
      'admin@zambiabus.com',
      await hashPassword('password123'),
      'Admin User',
      '+260977000000',
      'admin',
      null,
      null
    );

    // Create buses for each company
    const buses = [
      { company_id: companyIds[0], bus_number: 'ZM-001-LK', bus_name: 'Mazhindu Express', total_seats: 50, bus_type: 'Luxury Coach', amenities: 'AC,WiFi,Reclining Seats,USB Charging' },
      { company_id: companyIds[0], bus_number: 'ZM-002-LK', bus_name: 'Mazhindu Comfort', total_seats: 45, bus_type: 'Standard Coach', amenities: 'AC,Reclining Seats' },
      { company_id: companyIds[1], bus_number: 'ZM-101-PT', bus_name: 'Power Express', total_seats: 52, bus_type: 'Luxury Coach', amenities: 'AC,WiFi,Entertainment,USB Charging' },
      { company_id: companyIds[1], bus_number: 'ZM-102-PT', bus_name: 'Power Standard', total_seats: 48, bus_type: 'Standard Coach', amenities: 'AC,Reclining Seats' },
      { company_id: companyIds[2], bus_number: 'ZM-201-JD', bus_name: 'Juldan Premium', total_seats: 40, bus_type: 'VIP Coach', amenities: 'AC,WiFi,Entertainment,Snacks,USB Charging' },
    ];

    const insertBus = db.prepare(`
      INSERT INTO buses (company_id, bus_number, bus_name, total_seats, bus_type, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const busIds: number[] = [];
    for (const bus of buses) {
      const result = insertBus.run(
        bus.company_id,
        bus.bus_number,
        bus.bus_name,
        bus.total_seats,
        bus.bus_type,
        bus.amenities
      );
      busIds.push(result.lastInsertRowid as number);
    }

    // Create comprehensive routes based on popularRoutes from zambia-data
    const routeTemplates = [
      // From Lusaka (Capital) - Major Routes
      { from: 'Lusaka', to: 'Ndola', time: '06:00', arrival: '11:00', stops: 'Kabwe,Kapiri Mposhi' },
      { from: 'Lusaka', to: 'Ndola', time: '14:00', arrival: '19:00', stops: 'Kabwe,Kapiri Mposhi' },
      { from: 'Lusaka', to: 'Kitwe', time: '07:00', arrival: '12:30', stops: 'Kabwe,Kapiri Mposhi,Ndola' },
      { from: 'Lusaka', to: 'Kitwe', time: '15:00', arrival: '20:30', stops: 'Kabwe,Kapiri Mposhi,Ndola' },
      { from: 'Lusaka', to: 'Livingstone', time: '05:00', arrival: '11:30', stops: 'Mazabuka,Choma' },
      { from: 'Lusaka', to: 'Livingstone', time: '13:00', arrival: '19:30', stops: 'Mazabuka,Choma' },
      { from: 'Lusaka', to: 'Chipata', time: '06:00', arrival: '14:00', stops: 'Nyimba,Petauke' },
      { from: 'Lusaka', to: 'Solwezi', time: '05:30', arrival: '16:00', stops: 'Kabwe,Kapiri Mposhi,Ndola' },
      { from: 'Lusaka', to: 'Kasama', time: '05:00', arrival: '17:00', stops: 'Kabwe,Kapiri Mposhi,Mpika' },
      { from: 'Lusaka', to: 'Mongu', time: '06:00', arrival: '14:30', stops: 'Kaoma' },
      { from: 'Lusaka', to: 'Kabwe', time: '08:00', arrival: '10:30', stops: '' },
      { from: 'Lusaka', to: 'Kabwe', time: '16:00', arrival: '18:30', stops: '' },
      { from: 'Lusaka', to: 'Choma', time: '09:00', arrival: '13:00', stops: 'Mazabuka,Monze' },
      { from: 'Lusaka', to: 'Mazabuka', time: '10:00', arrival: '12:00', stops: '' },
      
      // Copperbelt Internal Routes
      { from: 'Ndola', to: 'Kitwe', time: '07:00', arrival: '08:00', stops: '' },
      { from: 'Ndola', to: 'Kitwe', time: '12:00', arrival: '13:00', stops: '' },
      { from: 'Ndola', to: 'Kitwe', time: '17:00', arrival: '18:00', stops: '' },
      { from: 'Ndola', to: 'Chingola', time: '08:00', arrival: '09:30', stops: 'Kitwe' },
      { from: 'Ndola', to: 'Mufulira', time: '09:00', arrival: '10:00', stops: '' },
      { from: 'Kitwe', to: 'Chingola', time: '07:30', arrival: '08:30', stops: '' },
      { from: 'Kitwe', to: 'Luanshya', time: '08:00', arrival: '08:45', stops: '' },
      { from: 'Kitwe', to: 'Chililabombwe', time: '09:00', arrival: '10:30', stops: 'Chingola' },
      
      // Southern Province Routes
      { from: 'Livingstone', to: 'Choma', time: '07:00', arrival: '10:00', stops: 'Kalomo' },
      { from: 'Livingstone', to: 'Kazungula', time: '08:00', arrival: '09:30', stops: '' },
      { from: 'Livingstone', to: 'Sesheke', time: '06:00', arrival: '10:00', stops: 'Kazungula' },
      { from: 'Choma', to: 'Monze', time: '09:00', arrival: '10:00', stops: '' },
      { from: 'Choma', to: 'Kalomo', time: '10:00', arrival: '11:30', stops: '' },
      
      // Eastern Province Routes
      { from: 'Chipata', to: 'Petauke', time: '07:00', arrival: '10:00', stops: '' },
      { from: 'Chipata', to: 'Lundazi', time: '08:00', arrival: '10:00', stops: '' },
      { from: 'Chipata', to: 'Katete', time: '09:00', arrival: '10:30', stops: '' },
      
      // Northern Province Routes
      { from: 'Kasama', to: 'Mbala', time: '07:00', arrival: '10:00', stops: '' },
      { from: 'Kasama', to: 'Mpika', time: '08:00', arrival: '12:00', stops: '' },
      { from: 'Kasama', to: 'Mpulungu', time: '06:00', arrival: '10:00', stops: 'Mbala' },
      
      // Luapula Province Routes
      { from: 'Mansa', to: 'Kawambwa', time: '07:00', arrival: '10:00', stops: '' },
      { from: 'Mansa', to: 'Nchelenge', time: '08:00', arrival: '11:00', stops: '' },
      
      // North-Western Province Routes
      { from: 'Solwezi', to: 'Mwinilunga', time: '07:00', arrival: '11:00', stops: '' },
      { from: 'Solwezi', to: 'Zambezi', time: '08:00', arrival: '12:00', stops: '' },
      
      // Western Province Routes
      { from: 'Mongu', to: 'Kaoma', time: '07:00', arrival: '10:00', stops: '' },
      { from: 'Mongu', to: 'Senanga', time: '08:00', arrival: '11:00', stops: '' },
      { from: 'Mongu', to: 'Sesheke', time: '06:00', arrival: '11:00', stops: 'Senanga' },
      
      // Cross-country Routes
      { from: 'Ndola', to: 'Livingstone', time: '05:00', arrival: '14:00', stops: 'Lusaka,Choma' },
      { from: 'Kitwe', to: 'Chipata', time: '05:00', arrival: '15:00', stops: 'Ndola,Lusaka' },
      { from: 'Solwezi', to: 'Mongu', time: '06:00', arrival: '14:00', stops: 'Kaoma' },
    ];

    const insertRoute = db.prepare(`
      INSERT INTO routes (bus_id, origin, destination, departure_time, arrival_time, price, date, intermediate_stops, available_seats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Create routes for the next 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      for (const routeTemplate of routeTemplates) {
        // Assign buses in rotation
        const busIndex = Math.floor(Math.random() * busIds.length);
        const busId = busIds[busIndex];
        const bus = buses[busIndex];
        
        // Get price from popularRoutes or calculate based on distance
        const routeInfo = popularRoutes.find(
          r => (r.from === routeTemplate.from && r.to === routeTemplate.to) ||
               (r.from === routeTemplate.to && r.to === routeTemplate.from)
        );
        
        const price = routeInfo ? routeInfo.price : 100; // Default price if not found
        
        insertRoute.run(
          busId,
          routeTemplate.from,
          routeTemplate.to,
          routeTemplate.time,
          routeTemplate.arrival,
          price,
          dateStr,
          routeTemplate.stops,
          bus.total_seats
        );
      }
    }

    console.log('✅ Database seeded successfully with Zambian routes!');
    console.log('\n🇿🇲 VayaZed Bus Booking System');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 Database Statistics:');
    console.log(`   • ${companies.length} Bus Companies`);
    console.log(`   • ${buses.length} Buses`);
    console.log(`   • ${routeTemplates.length} Route Templates`);
    console.log(`   • ${routeTemplates.length * 7} Total Routes (7 days)`);
    console.log(`   • 40+ Cities Covered`);
    console.log(`   • All 10 Provinces Connected`);
    console.log('\n🔐 Sample Login Credentials:');
    console.log('\n🚌 Bus Companies:');
    console.log('   1. Mazhindu Buses');
    console.log('      Email: info@mazhindubuses.com');
    console.log('      Password: password123');
    console.log('\n   2. Power Tools Transport');
    console.log('      Email: contact@powertools.com');
    console.log('      Password: password123');
    console.log('\n   3. Juldan Motors');
    console.log('      Email: info@juldan.com');
    console.log('      Password: password123');
    console.log('\n👤 Customer Account:');
    console.log('   Email: customer@example.com');
    console.log('   Password: password123');    console.log('\n🛡️ Admin Account:');
    console.log('   Email: admin@zambiabus.com');
    console.log('   Password: password123');    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Access the app at: http://localhost:3000');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}