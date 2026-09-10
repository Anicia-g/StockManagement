import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Category from '../models/Category.js';
import Unit from '../models/Unit.js';
import StockDocument from '../models/StockDocument.js';
import Product from '../models/Product.js';
import ProductDocumentReference from '../models/ProductDocumentReference.js';
import StockTransaction from '../models/StockTransaction.js';
import Purchase from '../models/Purchase.js';
import Transfer from '../models/Transfer.js';
import Indent from '../models/Indent.js';
import ProductRemark from '../models/ProductRemark.js';
import Notification from '../models/Notification.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany(),
      Department.deleteMany(),
      Category.deleteMany(),
      Unit.deleteMany(),
      StockDocument.deleteMany(),
      Product.deleteMany(),
      ProductDocumentReference.deleteMany(),
      StockTransaction.deleteMany(),
      Purchase.deleteMany(),
      Transfer.deleteMany(),
      Indent.deleteMany(),
      ProductRemark.deleteMany(),
      Notification.deleteMany()
    ]);

    console.log('1. Seeding Roles & Users...');
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      name: 'Maintenance Admin',
      email: 'admin.maint@nec.edu.in',
      role: 'ADMIN',
      department: 'Maintenance Dept.',
      avatarText: 'AD'
    });

    const staffUser = await User.create({
      username: 'staff',
      password: 'staff123',
      name: 'E. Ramesh',
      email: 'ramesh.store@nec.edu.in',
      role: 'STAFF',
      department: 'Store & Maintenance',
      avatarText: 'ER'
    });

    const viewerUser = await User.create({
      username: 'viewer',
      password: 'viewer123',
      name: 'Auditor Viewer',
      email: 'viewer.audit@nec.edu.in',
      role: 'VIEWER',
      department: 'Administration',
      avatarText: 'AV'
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

    console.log('2. Seeding Departments...');
    const departmentsData = [
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of CSE' },
      { name: 'Electrical & Electronics Engineering', code: 'EEE', description: 'Department of EEE' },
      { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of ECE' },
      { name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical' },
      { name: 'Civil Engineering', code: 'CIVIL', description: 'Department of Civil Engineering' },
      { name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
      { name: 'Administration', code: 'ADMIN', description: 'Administrative Section' },
      { name: 'Maintenance Dept.', code: 'MAINT', description: 'Central Electrical & Works Maintenance' }
    ];
    const departments = await Department.insertMany(departmentsData);

    console.log('3. Seeding Categories...');
    const categoriesData = [
      { name: 'Lighting', description: 'Lamps, Tubes, LED Bulbs and Fixtures' },
      { name: 'Wiring', description: 'Copper Wires, Cables and Flexible Conduits' },
      { name: 'Switchgear', description: 'MCBs, RCCBs, Isolators, Contactors' },
      { name: 'Electrical Accessories', description: 'Switches, Sockets, Plugs, Holders' },
      { name: 'Appliances', description: 'Fans, Exhausts, Heaters, Starters' },
      { name: 'Consumables', description: 'Tapes, Fuses, Screws, Insulation, Lugs' }
    ];
    const categories = await Category.insertMany(categoriesData);

    console.log('4. Seeding Units...');
    const unitsData = [
      { name: 'Pieces', symbol: 'pcs' },
      { name: 'Meter', symbol: 'm' },
      { name: 'Roll', symbol: 'roll' },
      { name: 'Box', symbol: 'box' },
      { name: 'Coil', symbol: 'coil' },
      { name: 'Set', symbol: 'set' }
    ];
    const units = await Unit.insertMany(unitsData);

    console.log('5. Seeding Stock Registers / Documents (CSSR1, SR1, SR2, SR3)...');
    const stockDocumentsData = [
      { name: 'CSSR1', description: 'Central Store Stock Register 1 (Major Equipment & Lighting)' },
      { name: 'SR1', description: 'Stock Register 1 (Consumables & Wires)' },
      { name: 'SR2', description: 'Stock Register 2 (Switchgear & Wiring Devices)' },
      { name: 'SR3', description: 'Stock Register 3 (Appliances & Heavy Electrical Items)' }
    ];
    const stockDocuments = await StockDocument.insertMany(stockDocumentsData);
    const docMap = {};
    stockDocuments.forEach(d => { docMap[d.name] = d; });

    console.log('6. Seeding Products...');
    const sampleProducts = [
      {
        productCode: 'EL-BULB-001',
        productName: 'LED Bulb 10W (B22)',
        name: 'LED Bulb 10W (B22)',
        category: 'Lighting',
        description: '10W Cool Daylight LED Bulb B22 base (Energy Efficient)',
        unit: 'Pieces',
        currentQuantity: 25,
        minimumQuantity: 10,
        minimumStockLevel: 10,
        stockRegister: 'SR1',
        pageNumber: 15,
        registerRefs: [
          { sheet: 'SR1', page: 15, note: 'Primary stock entry' },
          { sheet: 'SR3', page: 42, note: 'Secondary distribution log' }
        ],
        active: true,
        status: 'ACTIVE'
      },
      {
        productCode: 'EL-SW-001',
        productName: 'Switch (2-pin, 6A)',
        name: 'Switch (2-pin, 6A)',
        category: 'Electrical Accessories',
        description: 'Modular 6A 1-way electrical switch (White finish)',
        unit: 'Pieces',
        currentQuantity: 7, // Low stock on purpose for testing!
        minimumQuantity: 10,
        minimumStockLevel: 10,
        stockRegister: 'SR2',
        pageNumber: 28,
        registerRefs: [
          { sheet: 'SR2', page: 28, note: 'Accessories section' }
        ],
        active: true,
        status: 'ACTIVE'
      },
      {
        productCode: 'EL-FAN-001',
        productName: 'Ceiling Fan 1200mm',
        name: 'Ceiling Fan 1200mm',
        category: 'Appliances',
        description: '1200mm sweep 3-blade high speed ceiling fan with capacitor',
        unit: 'Pieces',
        currentQuantity: 14,
        minimumQuantity: 4,
        minimumStockLevel: 4,
        stockRegister: 'SR3',
        pageNumber: 12,
        registerRefs: [
          { sheet: 'SR3', page: 12, note: 'Appliance register' }
        ],
        active: true,
        status: 'ACTIVE'
      },
      {
        productCode: 'EL-MCB-001',
        productName: 'MCB 32A Single Pole',
        name: 'MCB 32A Single Pole',
        category: 'Switchgear',
        description: '32A C-Curve Single Pole Miniature Circuit Breaker 10kA',
        unit: 'Pieces',
        currentQuantity: 18,
        minimumQuantity: 6,
        minimumStockLevel: 6,
        stockRegister: 'SR2',
        pageNumber: 54,
        registerRefs: [
          { sheet: 'SR2', page: 54, note: 'Switchgear bay' }
        ],
        active: true,
        status: 'ACTIVE'
      },
      {
        productCode: 'EL-WIRE-001',
        productName: 'Copper Wire 1.5 sq.mm',
        name: 'Copper Wire 1.5 sq.mm',
        category: 'Wiring',
        description: 'FR PVC Insulated single core industrial copper cable (Red/Black)',
        unit: 'Meter',
        currentQuantity: 320,
        minimumQuantity: 100,
        minimumStockLevel: 100,
        stockRegister: 'SR1',
        pageNumber: 8,
        registerRefs: [
          { sheet: 'SR1', page: 8, note: 'Cables shelf' }
        ],
        active: true,
        status: 'ACTIVE'
      },
      {
        productCode: 'EL-TUBE-001',
        productName: 'LED Tube Light 20W',
        name: 'LED Tube Light 20W',
        category: 'Lighting',
        description: '4ft 20W Batten LED tube light fixture with integrated driver',
        unit: 'Pieces',
        currentQuantity: 3, // Low stock on purpose!
        minimumQuantity: 8,
        minimumStockLevel: 8,
        stockRegister: 'CSSR1',
        pageNumber: 65,
        registerRefs: [
          { sheet: 'CSSR1', page: 65, note: 'Central lighting' }
        ],
        active: true,
        status: 'ACTIVE'
      },
      {
        productCode: 'EL-HOLD-001',
        productName: 'Bulb Holder (B22)',
        name: 'Bulb Holder (B22)',
        category: 'Electrical Accessories',
        description: 'B22 angle/batten brass plunger lamp holder with porcelain base',
        unit: 'Pieces',
        currentQuantity: 45,
        minimumQuantity: 15,
        minimumStockLevel: 15,
        stockRegister: 'SR1',
        pageNumber: 33,
        registerRefs: [
          { sheet: 'SR1', page: 33, note: 'Hardware accessories' }
        ],
        active: true,
        status: 'ACTIVE'
      },
      {
        productCode: 'EL-SOCK-001',
        productName: '5-Pin Socket 6A',
        name: '5-Pin Socket 6A',
        category: 'Electrical Accessories',
        description: '6A 5-Pin universal modular shuttered power socket',
        unit: 'Pieces',
        currentQuantity: 28,
        minimumQuantity: 10,
        minimumStockLevel: 10,
        stockRegister: 'SR2',
        pageNumber: 19,
        registerRefs: [
          { sheet: 'SR2', page: 19, note: 'Wall sockets' }
        ],
        active: true,
        status: 'ACTIVE'
      },
      {
        productCode: 'EL-TAPE-001',
        productName: 'Insulation Tape',
        name: 'Insulation Tape',
        category: 'Consumables',
        description: 'PVC electrical flame retardant self-adhesive tape (Assorted)',
        unit: 'Roll',
        currentQuantity: 2, // Low stock on purpose!
        minimumQuantity: 10,
        minimumStockLevel: 10,
        stockRegister: 'SR1',
        pageNumber: 5,
        registerRefs: [
          { sheet: 'SR1', page: 5, note: 'Consumables drawer' }
        ],
        active: true,
        status: 'ACTIVE'
      },
      {
        productCode: 'EL-DB-001',
        productName: 'Distribution Board 8-way',
        name: 'Distribution Board 8-way',
        category: 'Switchgear',
        description: '8-Way SPN Double Door Sheet Steel Distribution Board enclosure',
        unit: 'Box',
        currentQuantity: 6,
        minimumQuantity: 2,
        minimumStockLevel: 2,
        stockRegister: 'CSSR1',
        pageNumber: 88,
        registerRefs: [
          { sheet: 'CSSR1', page: 88, note: 'Heavy enclosure panel' }
        ],
        active: true,
        status: 'ACTIVE'
      }
    ];

    const createdProducts = [];
    for (const p of sampleProducts) {
      const prod = await Product.create({
        ...p,
        createdBy: 'E. Ramesh',
        updatedBy: 'E. Ramesh'
      });
      createdProducts.push(prod);

      // Create ProductDocumentReferences
      for (const ref of p.registerRefs) {
        await ProductDocumentReference.create({
          productId: prod._id,
          stockDocumentId: docMap[ref.sheet]?._id || null,
          stockDocumentName: ref.sheet,
          pageNumber: ref.page,
          referenceNote: ref.note || ''
        });
      }

      // Add sample initial remark
      await ProductRemark.create({
        productId: prod._id,
        remark: `Verified stock entry for ${prod.productName} in register ${p.stockRegister} Page ${p.pageNumber}.`,
        enteredBy: 'E. Ramesh, Store Keeper',
        enteredAt: new Date(Date.now() - 3 * 86400000)
      });
    }

    console.log('7. Seeding Initial Stock History & Transactions...');
    const bulbProd = createdProducts.find(p => p.productCode === 'EL-BULB-001');
    const switchProd = createdProducts.find(p => p.productCode === 'EL-SW-001');
    const fanProd = createdProducts.find(p => p.productCode === 'EL-FAN-001');
    const wireProd = createdProducts.find(p => p.productCode === 'EL-WIRE-001');

    const transactionsData = [
      {
        transactionId: 'TXN-2026-001',
        transactionType: 'IN',
        productId: bulbProd._id,
        productCode: bulbProd.productCode,
        productName: bulbProd.productName,
        quantity: 50,
        previousQuantity: 0,
        newQuantity: 50,
        department: 'Store',
        date: '2026-09-01',
        remarks: 'New procurement received from Sri Balaji Electricals, Invoice #INV-4432',
        recordedBy: 'E. Ramesh (Store Keeper)'
      },
      {
        transactionId: 'TXN-2026-002',
        transactionType: 'OUT',
        productId: bulbProd._id,
        productCode: bulbProd.productCode,
        productName: bulbProd.productName,
        quantity: 15,
        previousQuantity: 50,
        newQuantity: 35,
        department: 'Computer Science & Engineering',
        date: '2026-09-03',
        remarks: 'Issued for Lab-3 overhead light replacement',
        recordedBy: 'E. Ramesh (Store Keeper)'
      },
      {
        transactionId: 'TXN-2026-003',
        transactionType: 'OUT',
        productId: bulbProd._id,
        productCode: bulbProd.productCode,
        productName: bulbProd.productName,
        quantity: 10,
        previousQuantity: 35,
        newQuantity: 25,
        department: 'Electrical & Electronics Engineering',
        date: '2026-09-06',
        remarks: 'Seminar hall lighting maintenance',
        recordedBy: 'E. Ramesh (Store Keeper)'
      },
      {
        transactionId: 'TXN-2026-004',
        transactionType: 'IN',
        productId: switchProd._id,
        productCode: switchProd.productCode,
        productName: switchProd.productName,
        quantity: 20,
        previousQuantity: 0,
        newQuantity: 20,
        department: 'Store',
        date: '2026-09-02',
        remarks: 'Quarterly supply batch',
        recordedBy: 'E. Ramesh (Store Keeper)'
      },
      {
        transactionId: 'TXN-2026-005',
        transactionType: 'OUT',
        productId: switchProd._id,
        productCode: switchProd.productCode,
        productName: switchProd.productName,
        quantity: 13,
        previousQuantity: 20,
        newQuantity: 7,
        department: 'Mechanical Engineering',
        date: '2026-09-07',
        remarks: 'Workshop machine board switch replacements (Now Low Stock)',
        recordedBy: 'E. Ramesh (Store Keeper)'
      },
      {
        transactionId: 'TXN-2026-006',
        transactionType: 'IN',
        productId: fanProd._id,
        productCode: fanProd.productCode,
        productName: fanProd.productName,
        quantity: 15,
        previousQuantity: 0,
        newQuantity: 15,
        department: 'Store',
        date: '2026-09-04',
        remarks: 'Summer replenishment delivery',
        recordedBy: 'E. Ramesh (Store Keeper)'
      },
      {
        transactionId: 'TXN-2026-007',
        transactionType: 'OUT',
        productId: fanProd._id,
        productCode: fanProd.productCode,
        productName: fanProd.productName,
        quantity: 1,
        previousQuantity: 15,
        newQuantity: 14,
        department: 'Administration',
        date: '2026-09-08',
        remarks: 'Dean Office room 102 installation',
        recordedBy: 'E. Ramesh (Store Keeper)'
      }
    ];

    await StockTransaction.insertMany(transactionsData);

    console.log('8. Seeding Indents...');
    const indent1 = await Indent.create({
      indentNumber: 'IND-2026-001',
      date: '2026-09-05',
      requestDate: '2026-09-05',
      requiredDate: '2026-09-12',
      requestingDepartment: 'Computer Science & Engineering',
      department: 'Computer Science & Engineering',
      requestedBy: 'Dr. K. Saravanan (FACULTY)',
      requesterName: 'Dr. K. Saravanan',
      requesterId: facultyCse._id,
      recommendedBy: 'HOD CSE',
      approvedBy: 'Store Superintendent',
      status: 'APPROVED',
      purpose: 'Lab 4 Computer Systems Power Strip & Socket Repair',
      remarks: 'Urgent requirement for semester practical examination setup',
      adminRemarks: 'Approved as per lab allocation request.',
      items: [
        {
          productId: switchProd._id,
          productCode: switchProd.productCode,
          productName: switchProd.productName,
          stockRegister: 'SR2',
          unit: 'Pieces',
          availableQuantityAtRequest: switchProd.currentQuantity,
          quantityRequired: 5,
          requestedQuantity: 5,
          quantityRecommended: 5,
          quantityApproved: 5,
          approvedQuantity: 5,
          quantityIssued: 0,
          lineRemarks: 'For terminal boards'
        },
        {
          productId: wireProd._id,
          productCode: wireProd.productCode,
          productName: wireProd.productName,
          stockRegister: 'SR1',
          unit: 'Meter',
          availableQuantityAtRequest: wireProd.currentQuantity,
          quantityRequired: 30,
          requestedQuantity: 30,
          quantityRecommended: 30,
          quantityApproved: 30,
          approvedQuantity: 30,
          quantityIssued: 0,
          lineRemarks: 'Grounding line'
        }
      ]
    });

    const indent2 = await Indent.create({
      indentNumber: 'IND-2026-002',
      date: '2026-09-07',
      requestDate: '2026-09-07',
      requiredDate: '2026-09-15',
      requestingDepartment: 'Electrical & Electronics Engineering',
      department: 'Electrical & Electronics Engineering',
      requestedBy: 'Prof. S. Devi (FACULTY)',
      requesterName: 'Prof. S. Devi',
      requesterId: facultyEee._id,
      status: 'SUBMITTED',
      purpose: 'Power Electronics Laboratory Project Racks Lighting',
      remarks: 'Standard lab consumable indent',
      items: [
        {
          productId: bulbProd._id,
          productCode: bulbProd.productCode,
          productName: bulbProd.productName,
          stockRegister: 'SR1',
          unit: 'Pieces',
          availableQuantityAtRequest: bulbProd.currentQuantity,
          quantityRequired: 8,
          requestedQuantity: 8,
          quantityRecommended: 0,
          quantityApproved: 8,
          approvedQuantity: 8,
          quantityIssued: 0,
          lineRemarks: 'Workstation lights'
        }
      ]
    });

    console.log('9. Seeding Notifications...');
    await Notification.create([
      {
        title: 'Low Stock Alert: Switch (2-pin, 6A)',
        message: 'Product "Switch (2-pin, 6A)" (EL-SW-001) has only 7 pieces left in stock (Minimum: 10).',
        type: 'LOW_STOCK',
        targetRole: 'ADMIN',
        referenceId: 'EL-SW-001'
      },
      {
        title: 'Low Stock Alert: LED Tube Light 20W',
        message: 'Product "LED Tube Light 20W" (EL-TUBE-001) is down to 3 pieces (Minimum: 8).',
        type: 'LOW_STOCK',
        targetRole: 'ADMIN',
        referenceId: 'EL-TUBE-001'
      },
      {
        title: 'Pending Indent: IND-2026-002',
        message: 'EEE Department submitted Indent IND-2026-002 for 8 items.',
        type: 'INDENT_CREATED',
        targetRole: 'ADMIN',
        referenceId: 'IND-2026-002'
      }
    ]);

    console.log('✅ Database seeded successfully with complete Electrical Stock Management dataset!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
