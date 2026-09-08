import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Transfer from '../models/Transfer.js';
import Indent from '../models/Indent.js';
import StockHistory from '../models/StockHistory.js';
import Notification from '../models/Notification.js';

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany();
    await Product.deleteMany();
    await Purchase.deleteMany();
    await Transfer.deleteMany();
    await Indent.deleteMany();
    await StockHistory.deleteMany();
    await Notification.deleteMany();

    console.log('Seeding Users...');
    const adminUser1 = await User.create({
      username: 'e.ramesh',
      password: 'password123',
      name: 'E. Ramesh',
      email: 'ramesh.store@nec.edu.in',
      role: 'ADMIN',
      department: 'Maintenance Dept.',
      avatarText: 'ER'
    });

    const adminUser2 = await User.create({
      username: 'admin',
      password: 'admin123',
      name: 'Maintenance Admin',
      email: 'admin.maint@nec.edu.in',
      role: 'ADMIN',
      department: 'Maintenance Dept.',
      avatarText: 'AD'
    });

    const facultyCse = await User.create({
      username: 'cse.faculty',
      password: 'faculty123',
      name: 'Dr. K. Saravanan',
      email: 'saravanan.cse@nec.edu.in',
      role: 'FACULTY',
      department: 'Computer Science & Engineering',
      avatarText: 'KS'
    });

    const facultyEee = await User.create({
      username: 'eee.faculty',
      password: 'faculty123',
      name: 'Prof. S. Devi',
      email: 'devi.eee@nec.edu.in',
      role: 'FACULTY',
      department: 'Electrical & Electronics Engineering',
      avatarText: 'SD'
    });

    const facultyMech = await User.create({
      username: 'mech.faculty',
      password: 'faculty123',
      name: 'Prof. K. Elango',
      email: 'elango.mech@nec.edu.in',
      role: 'FACULTY',
      department: 'Mechanical Engineering',
      avatarText: 'KE'
    });

    console.log('Seeding Products...');
    const productsData = [
      {
        productCode: 'EL-BULB-001',
        name: 'LED Bulb 10W (B22)',
        category: 'Lighting',
        description: '10W Cool Daylight LED Bulb B22 base',
        unit: 'Pieces',
        currentQuantity: 25,
        minimumStockLevel: 10,
        stockRegister: 'CSSR1',
        pageNumber: 42,
        registerRefs: [{ sheet: 'CSSR1', page: 42 }],
        status: 'ACTIVE',
        remarks: [
          {
            id: 'rem-1',
            author: 'E. Ramesh, Store Keeper',
            date: '2026-09-05',
            text: 'Stock received from Sri Balaji Electricals, verified and placed in Rack L-2.'
          }
        ]
      },
      {
        productCode: 'EL-SW-001',
        name: 'Switch (2-pin, 6A)',
        category: 'Electrical',
        description: '6A 240V Piano type modular switch',
        unit: 'Pieces',
        currentQuantity: 7,
        minimumStockLevel: 10,
        stockRegister: 'SR2',
        pageNumber: 18,
        registerRefs: [
          { sheet: 'SR2', page: 18 },
          { sheet: 'CSSR1', page: 14 }
        ],
        status: 'ACTIVE',
        remarks: [
          {
            id: 'rem-2',
            author: 'S. Kumaran, Electrician',
            date: '2026-09-06',
            text: 'Two switches from previous batch had loose terminal screws. Rest checked and functioning well.'
          }
        ]
      },
      {
        productCode: 'EL-FAN-001',
        name: 'Ceiling Fan 1200mm',
        category: 'Appliance',
        description: '1200mm 3-blade high speed ceiling fan with regulator',
        unit: 'Pieces',
        currentQuantity: 3,
        minimumStockLevel: 5,
        stockRegister: 'SR3',
        pageNumber: 7,
        registerRefs: [{ sheet: 'SR3', page: 7 }],
        status: 'ACTIVE',
        remarks: [
          {
            id: 'rem-3',
            author: 'S. Kumaran, Electrician',
            date: '2026-09-08',
            text: 'Issued 5 units for EEE department replacement. Remaining 3 reserved for emergencies.'
          }
        ]
      },
      {
        productCode: 'EL-MCB-032',
        name: 'MCB 32A Single Pole',
        category: 'Switchgear',
        description: '32A C-Curve Single Pole Miniature Circuit Breaker',
        unit: 'Pieces',
        currentQuantity: 2,
        minimumStockLevel: 8,
        stockRegister: 'CSSR1',
        pageNumber: 55,
        registerRefs: [{ sheet: 'CSSR1', page: 55 }],
        status: 'ACTIVE',
        remarks: [
          {
            id: 'rem-4',
            author: 'E. Ramesh, Store Keeper',
            date: '2026-09-01',
            text: 'Critically low stock. Purchase order forwarded to Maintenance Superintendent.'
          }
        ]
      },
      {
        productCode: 'EL-WIRE-015',
        name: 'Copper Wire 1.5 sq.mm',
        category: 'Wiring',
        description: '1.5 sq.mm FR PVC Insulated Copper Wire (90m coil)',
        unit: 'Coils',
        currentQuantity: 4,
        minimumStockLevel: 6,
        stockRegister: 'SR1',
        pageNumber: 12,
        registerRefs: [{ sheet: 'SR1', page: 12 }],
        status: 'ACTIVE',
        remarks: []
      },
      {
        productCode: 'EL-TUBE-002',
        name: 'LED Tube Light 20W',
        category: 'Lighting',
        description: '20W 4ft T8 LED Batten Light',
        unit: 'Pieces',
        currentQuantity: 40,
        minimumStockLevel: 15,
        stockRegister: 'SR2',
        pageNumber: 22,
        registerRefs: [
          { sheet: 'SR2', page: 22 },
          { sheet: 'SR1', page: 9 }
        ],
        status: 'ACTIVE',
        remarks: []
      },
      {
        productCode: 'EL-HOLD-004',
        name: 'Bulb Holder (B22)',
        category: 'Lighting',
        description: 'B22 Angle/Batten Lamp Holder',
        unit: 'Pieces',
        currentQuantity: 60,
        minimumStockLevel: 20,
        stockRegister: 'CSSR1',
        pageNumber: 30,
        registerRefs: [{ sheet: 'CSSR1', page: 30 }],
        status: 'ACTIVE',
        remarks: []
      },
      {
        productCode: 'EL-SOCK-007',
        name: '5-Pin Socket 6A/16A',
        category: 'Electrical',
        description: 'Universal 5-Pin shuttered socket',
        unit: 'Pieces',
        currentQuantity: 32,
        minimumStockLevel: 15,
        stockRegister: 'SR3',
        pageNumber: 9,
        registerRefs: [{ sheet: 'SR3', page: 9 }],
        status: 'ACTIVE',
        remarks: []
      },
      {
        productCode: 'EL-TAPE-003',
        name: 'Insulation Tape',
        category: 'Consumable',
        description: 'PVC Flame Retardant electrical insulation tape',
        unit: 'Rolls',
        currentQuantity: 18,
        minimumStockLevel: 10,
        stockRegister: 'SR1',
        pageNumber: 5,
        registerRefs: [{ sheet: 'SR1', page: 5 }],
        status: 'ACTIVE',
        remarks: []
      },
      {
        productCode: 'EL-DB-006',
        name: 'Distribution Board 8-way',
        category: 'Switchgear',
        description: '8-Way SPN Double Door Distribution Board',
        unit: 'Pieces',
        currentQuantity: 5,
        minimumStockLevel: 4,
        stockRegister: 'CSSR1',
        pageNumber: 33,
        registerRefs: [{ sheet: 'CSSR1', page: 33 }],
        status: 'ACTIVE',
        remarks: []
      },
      {
        productCode: 'EL-CHOKE-008',
        name: 'Tube Light Electronic Choke',
        category: 'Lighting',
        description: 'Electronic ballast for 36W/40W tube light',
        unit: 'Pieces',
        currentQuantity: 3,
        minimumStockLevel: 10,
        stockRegister: 'SR2',
        pageNumber: 40,
        registerRefs: [{ sheet: 'SR2', page: 40 }],
        status: 'ACTIVE',
        remarks: []
      },
      {
        productCode: 'EL-WIRE-040',
        name: 'Earth Wire 4 sq.mm',
        category: 'Wiring',
        description: '4 sq.mm Green earthing copper wire (100m coil)',
        unit: 'Coils',
        currentQuantity: 6,
        minimumStockLevel: 8,
        stockRegister: 'SR1',
        pageNumber: 16,
        registerRefs: [{ sheet: 'SR1', page: 16 }],
        status: 'ACTIVE',
        remarks: []
      }
    ];

    const createdProducts = await Product.insertMany(productsData);
    const prodMap = {};
    createdProducts.forEach(p => {
      prodMap[p.productCode] = p;
    });

    console.log('Seeding Purchases...');
    const todayStr = new Date().toISOString().split('T')[0];
    const purchases = await Purchase.insertMany([
      {
        purchaseId: 'PUR-2026-001',
        productId: prodMap['EL-BULB-001']._id,
        productCode: 'EL-BULB-001',
        productName: 'LED Bulb 10W (B22)',
        stockRegister: 'CSSR1',
        quantity: 50,
        unit: 'Pieces',
        supplier: 'Sri Balaji Electricals',
        invoiceNumber: 'INV-4432',
        unitPrice: 85,
        totalAmount: 4250,
        date: todayStr,
        recordedBy: 'E. Ramesh',
        remarks: 'Annual classroom fixture restocking'
      },
      {
        purchaseId: 'PUR-2026-002',
        productId: prodMap['EL-MCB-032']._id,
        productCode: 'EL-MCB-032',
        productName: 'MCB 32A Single Pole',
        stockRegister: 'CSSR1',
        quantity: 15,
        unit: 'Pieces',
        supplier: 'L&T Switchgear Agencies',
        invoiceNumber: 'INV-8891',
        unitPrice: 220,
        totalAmount: 3300,
        date: '2026-09-01',
        recordedBy: 'E. Ramesh',
        remarks: 'Main panel maintenance replenishment'
      },
      {
        purchaseId: 'PUR-2026-003',
        productId: prodMap['EL-DB-006']._id,
        productCode: 'EL-DB-006',
        productName: 'Distribution Board 8-way',
        stockRegister: 'CSSR1',
        quantity: 5,
        unit: 'Pieces',
        supplier: 'Schneider Electric Dist.',
        invoiceNumber: 'INV-1022',
        unitPrice: 650,
        totalAmount: 3250,
        date: '2026-08-26',
        recordedBy: 'E. Ramesh',
        remarks: 'Lab board replacement stock'
      }
    ]);

    console.log('Seeding Transfers...');
    const transfers = await Transfer.insertMany([
      {
        transferId: 'TRF-2026-001',
        productId: prodMap['EL-FAN-001']._id,
        productCode: 'EL-FAN-001',
        productName: 'Ceiling Fan 1200mm',
        stockRegister: 'SR3',
        quantity: 5,
        unit: 'Pieces',
        department: 'Electrical & Electronics Engineering',
        indentNumber: 'IND-2026-011',
        issuedBy: 'E. Ramesh',
        date: todayStr,
        remarks: 'Replacement in staff room & machine lab'
      },
      {
        transferId: 'TRF-2026-002',
        productId: prodMap['EL-BULB-001']._id,
        productCode: 'EL-BULB-001',
        productName: 'LED Bulb 10W (B22)',
        stockRegister: 'CSSR1',
        quantity: 10,
        unit: 'Pieces',
        department: 'Computer Science & Engineering',
        indentNumber: 'IND-2026-010',
        issuedBy: 'E. Ramesh',
        date: '2026-09-07',
        remarks: 'CSE Lab 2 corridor and server room'
      },
      {
        transferId: 'TRF-2026-003',
        productId: prodMap['EL-SW-001']._id,
        productCode: 'EL-SW-001',
        productName: 'Switch (2-pin, 6A)',
        stockRegister: 'SR2',
        quantity: 8,
        unit: 'Pieces',
        department: 'Mechanical Engineering',
        indentNumber: null,
        issuedBy: 'E. Ramesh',
        date: '2026-09-03',
        remarks: 'Workshop switchboard maintenance'
      }
    ]);

    console.log('Seeding Indents...');
    await Indent.insertMany([
      {
        indentNumber: 'IND-2026-014',
        requesterId: facultyCse._id,
        requesterName: facultyCse.name,
        department: 'Computer Science & Engineering',
        purpose: 'IoT and Networking Lab Renovation Lighting',
        requestDate: todayStr,
        requiredDate: '2026-09-12',
        items: [
          {
            productId: prodMap['EL-BULB-001']._id,
            productCode: 'EL-BULB-001',
            productName: 'LED Bulb 10W (B22)',
            stockRegister: 'CSSR1',
            unit: 'Pieces',
            availableQuantityAtRequest: 25,
            requestedQuantity: 6,
            approvedQuantity: 0,
            remarks: 'For ceiling fixtures in new server bay'
          },
          {
            productId: prodMap['EL-SOCK-007']._id,
            productCode: 'EL-SOCK-007',
            productName: '5-Pin Socket 6A/16A',
            stockRegister: 'SR3',
            unit: 'Pieces',
            availableQuantityAtRequest: 32,
            requestedQuantity: 4,
            approvedQuantity: 0,
            remarks: 'Workbench power supply points'
          }
        ],
        status: 'PENDING',
        adminRemarks: ''
      },
      {
        indentNumber: 'IND-2026-013',
        requesterId: facultyMech._id,
        requesterName: facultyMech.name,
        department: 'Mechanical Engineering',
        purpose: 'Mechatronics Lab Wiring & Switchgear',
        requestDate: '2026-09-05',
        requiredDate: '2026-09-10',
        items: [
          {
            productId: prodMap['EL-WIRE-015']._id,
            productCode: 'EL-WIRE-015',
            productName: 'Copper Wire 1.5 sq.mm',
            stockRegister: 'SR1',
            unit: 'Coils',
            availableQuantityAtRequest: 4,
            requestedQuantity: 2,
            approvedQuantity: 1,
            remarks: 'CNC machine panel wiring'
          }
        ],
        status: 'PARTIALLY_APPROVED',
        adminRemarks: 'Approved 1 coil due to limited remaining stock.',
        approvedBy: 'E. Ramesh',
        approvedAt: new Date('2026-09-06')
      },
      {
        indentNumber: 'IND-2026-011',
        requesterId: facultyEee._id,
        requesterName: facultyEee.name,
        department: 'Electrical & Electronics Engineering',
        purpose: 'Staff Room & Machine Lab Fan Replacements',
        requestDate: '2026-09-07',
        requiredDate: '2026-09-08',
        items: [
          {
            productId: prodMap['EL-FAN-001']._id,
            productCode: 'EL-FAN-001',
            productName: 'Ceiling Fan 1200mm',
            stockRegister: 'SR3',
            unit: 'Pieces',
            availableQuantityAtRequest: 8,
            requestedQuantity: 5,
            approvedQuantity: 5,
            remarks: 'Classrooms 204-206'
          }
        ],
        status: 'COMPLETED',
        adminRemarks: 'Full quantity issued and transferred.',
        approvedBy: 'E. Ramesh',
        approvedAt: new Date('2026-09-08')
      }
    ]);

    console.log('Seeding Stock History...');
    await StockHistory.insertMany([
      {
        transactionId: 'TXN-2026-001',
        date: todayStr,
        productId: prodMap['EL-FAN-001']._id,
        productCode: 'EL-FAN-001',
        productName: 'Ceiling Fan 1200mm',
        stockRegister: 'SR3',
        type: 'TRANSFER',
        quantity: 5,
        previousQuantity: 8,
        newQuantity: 3,
        department: 'Electrical & Electronics Engineering',
        referenceId: 'IND-2026-011',
        performedBy: 'E. Ramesh',
        remarks: 'Issued against Indent IND-2026-011'
      },
      {
        transactionId: 'TXN-2026-002',
        date: '2026-09-07',
        productId: prodMap['EL-BULB-001']._id,
        productCode: 'EL-BULB-001',
        productName: 'LED Bulb 10W (B22)',
        stockRegister: 'CSSR1',
        type: 'TRANSFER',
        quantity: 10,
        previousQuantity: 35,
        newQuantity: 25,
        department: 'Computer Science & Engineering',
        referenceId: 'IND-2026-010',
        performedBy: 'E. Ramesh',
        remarks: 'Lab corridor and server room lighting'
      },
      {
        transactionId: 'TXN-2026-003',
        date: '2026-09-05',
        productId: prodMap['EL-BULB-001']._id,
        productCode: 'EL-BULB-001',
        productName: 'LED Bulb 10W (B22)',
        stockRegister: 'CSSR1',
        type: 'PURCHASE',
        quantity: 50,
        previousQuantity: 0,
        newQuantity: 50,
        department: 'Store',
        referenceId: 'PUR-2026-001',
        performedBy: 'E. Ramesh',
        remarks: 'Purchased from Sri Balaji Electricals, INV #4432'
      },
      {
        transactionId: 'TXN-2026-004',
        date: '2026-09-03',
        productId: prodMap['EL-SW-001']._id,
        productCode: 'EL-SW-001',
        productName: 'Switch (2-pin, 6A)',
        stockRegister: 'SR2',
        type: 'TRANSFER',
        quantity: 8,
        previousQuantity: 15,
        newQuantity: 7,
        department: 'Mechanical Engineering',
        referenceId: 'TRF-2026-003',
        performedBy: 'E. Ramesh',
        remarks: 'Workshop panel maintenance'
      },
      {
        transactionId: 'TXN-2026-005',
        date: '2026-09-01',
        productId: prodMap['EL-MCB-032']._id,
        productCode: 'EL-MCB-032',
        productName: 'MCB 32A Single Pole',
        stockRegister: 'CSSR1',
        type: 'PURCHASE',
        quantity: 15,
        previousQuantity: 2,
        newQuantity: 17,
        department: 'Store',
        referenceId: 'PUR-2026-002',
        performedBy: 'E. Ramesh',
        remarks: 'Annual stock replenishment'
      }
    ]);

    console.log('Seeding Notifications...');
    await Notification.insertMany([
      {
        title: 'Low Stock Alert: MCB 32A',
        message: 'MCB 32A Single Pole (EL-MCB-032) is critically low (2 pieces remaining, minimum: 8).',
        type: 'LOW_STOCK',
        targetRole: 'ADMIN',
        referenceId: 'EL-MCB-032',
        isRead: false
      },
      {
        title: 'Low Stock Alert: Ceiling Fan',
        message: 'Ceiling Fan 1200mm (EL-FAN-001) is below minimum stock (3 pieces remaining, minimum: 5).',
        type: 'LOW_STOCK',
        targetRole: 'ADMIN',
        referenceId: 'EL-FAN-001',
        isRead: false
      },
      {
        title: 'New Indent Request: IND-2026-014',
        message: 'Dr. K. Saravanan (CSE) submitted a new indent IND-2026-014 for lab renovation lighting.',
        type: 'INDENT_CREATED',
        targetRole: 'ADMIN',
        referenceId: 'IND-2026-014',
        isRead: false
      }
    ]);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
