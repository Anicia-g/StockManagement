import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
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

    console.log('Clearing existing database collections in MongoDB Atlas...');
    await Promise.all([
      User.deleteMany(),
      Role.deleteMany(),
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

    console.log('1. Seeding Roles...');
    const rolesData = [
      { name: 'ADMIN', description: 'Consumable Stock Administrator with full CRUD' },
      { name: 'FACULTY', description: 'Academic Faculty with Catalog browsing and Indent Requisition privileges' }
    ];
    await Role.insertMany(rolesData);

    console.log('2. Seeding Users (Admin and Faculty ONLY)...');
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      name: 'System Admin',
      email: 'admin@nec.edu.in',
      role: 'ADMIN',
      department: 'Central Store',
      avatarText: 'AD',
      active: true
    });

    const facultyUser = await User.create({
      username: 'faculty',
      password: 'faculty123',
      name: 'Faculty User',
      email: 'faculty@nec.edu.in',
      role: 'FACULTY',
      department: 'Electrical & Electronics Engineering',
      avatarText: 'FA',
      active: true
    });

    console.log('3. Seeding Departments...');
    const departmentsData = [
      { name: 'Electrical & Electronics Engineering', code: 'EEE', description: 'Department of EEE' },
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of CSE' },
      { name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Department of ECE' },
      { name: 'Mechanical Engineering', code: 'MECH', description: 'Department of Mechanical' },
      { name: 'Civil Engineering', code: 'CIVIL', description: 'Department of Civil' },
      { name: 'Information Technology', code: 'IT', description: 'Department of IT' },
      { name: 'Central Store', code: 'STORE', description: 'Central Consumable Store' }
    ];
    const departments = await Department.insertMany(departmentsData);
    const eeeDept = departments.find(d => d.code === 'EEE');

    console.log('4. Seeding Categories...');
    const categoriesData = [
      { name: 'Lighting', description: 'Lamps, Tubes, LED Bulbs and Fixtures' },
      { name: 'Wiring', description: 'Copper Wires, Cables and Flexible Conduits' },
      { name: 'Switchgear', description: 'MCBs, RCCBs, Isolators, Contactors' },
      { name: 'Electrical Accessories', description: 'Switches, Sockets, Plugs, Holders' },
      { name: 'Appliances', description: 'Fans, Exhausts, Heaters, Starters' },
      { name: 'Consumables', description: 'Tapes, Fuses, Screws, Insulation, Lugs' }
    ];
    await Category.insertMany(categoriesData);

    console.log('5. Seeding Units...');
    const unitsData = [
      { name: 'Pieces', symbol: 'pcs' },
      { name: 'Meter', symbol: 'm' },
      { name: 'Roll', symbol: 'roll' },
      { name: 'Box', symbol: 'box' },
      { name: 'Coil', symbol: 'coil' },
      { name: 'Set', symbol: 'set' }
    ];
    await Unit.insertMany(unitsData);

    console.log('6. Seeding Physical Stock Registers...');
    const stockDocumentsData = [
      { name: 'CSSR1', description: 'Central Store Stock Register 1 (Major Equipment & Lighting)' },
      { name: 'SR1', description: 'Stock Register 1 (Consumables & Wires)' },
      { name: 'SR2', description: 'Stock Register 2 (Switchgear & Wiring Devices)' },
      { name: 'SR3', description: 'Stock Register 3 (Appliances & Heavy Electrical Items)' }
    ];
    const stockDocuments = await StockDocument.insertMany(stockDocumentsData);
    const docMap = {};
    stockDocuments.forEach(d => { docMap[d.name] = d; });

    console.log('7. Seeding Products with sequential CON-XXXX codes...');
    const sampleProducts = [
      {
        productCode: 'CON-0001',
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
          { sheet: 'SR1', page: 15, note: 'Primary stock register entry' },
          { sheet: 'CSSR1', page: 42, note: 'Central register cross-reference' }
        ],
        active: true,
        status: 'ACTIVE',
        createdBy: 'System Admin',
        updatedBy: 'System Admin'
      },
      {
        productCode: 'CON-0002',
        productName: 'Switch (2-pin, 6A)',
        name: 'Switch (2-pin, 6A)',
        category: 'Electrical Accessories',
        description: 'Modular 6A 1-way electrical switch (White finish)',
        unit: 'Pieces',
        currentQuantity: 4, // Low stock for testing
        minimumQuantity: 10,
        minimumStockLevel: 10,
        stockRegister: 'SR2',
        pageNumber: 28,
        registerRefs: [
          { sheet: 'SR2', page: 28, note: 'Wiring devices page' }
        ],
        active: true,
        status: 'ACTIVE',
        createdBy: 'System Admin',
        updatedBy: 'System Admin'
      },
      {
        productCode: 'CON-0003',
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
          { sheet: 'SR3', page: 12, note: 'Appliance ledger' }
        ],
        active: true,
        status: 'ACTIVE',
        createdBy: 'System Admin',
        updatedBy: 'System Admin'
      },
      {
        productCode: 'CON-0004',
        productName: 'MCB 32A Single Pole',
        name: 'MCB 32A Single Pole',
        category: 'Switchgear',
        description: '32A C-Curve Single Pole Miniature Circuit Breaker 10kA',
        unit: 'Pieces',
        currentQuantity: 18,
        minimumQuantity: 8,
        minimumStockLevel: 8,
        stockRegister: 'SR2',
        pageNumber: 45,
        registerRefs: [
          { sheet: 'SR2', page: 45, note: 'Switchgear section' }
        ],
        active: true,
        status: 'ACTIVE',
        createdBy: 'System Admin',
        updatedBy: 'System Admin'
      },
      {
        productCode: 'CON-0005',
        productName: 'Copper Wire 1.5 sq.mm (Red)',
        name: 'Copper Wire 1.5 sq.mm (Red)',
        category: 'Wiring',
        description: 'FR PVC Insulated Copper Wire 1.5 sq.mm, 90m Coil',
        unit: 'Coil',
        currentQuantity: 12,
        minimumQuantity: 5,
        minimumStockLevel: 5,
        stockRegister: 'SR1',
        pageNumber: 8,
        registerRefs: [
          { sheet: 'SR1', page: 8, note: 'Cables and wiring section' }
        ],
        active: true,
        status: 'ACTIVE',
        createdBy: 'System Admin',
        updatedBy: 'System Admin'
      },
      {
        productCode: 'CON-0006',
        productName: 'PVC Insulation Tape (Black)',
        name: 'PVC Insulation Tape (Black)',
        category: 'Consumables',
        description: 'Flame retardant electrical insulating tape 18mm x 7m',
        unit: 'Roll',
        currentQuantity: 40,
        minimumQuantity: 15,
        minimumStockLevel: 15,
        stockRegister: 'SR1',
        pageNumber: 3,
        registerRefs: [
          { sheet: 'SR1', page: 3, note: 'Consumables section' }
        ],
        active: true,
        status: 'ACTIVE',
        createdBy: 'System Admin',
        updatedBy: 'System Admin'
      }
    ];

    const products = await Product.insertMany(sampleProducts);

    // Create document reference documents
    for (const prod of products) {
      for (const ref of prod.registerRefs) {
        const stockDoc = docMap[ref.sheet];
        await ProductDocumentReference.create({
          productId: prod._id,
          stockDocumentId: stockDoc?._id || null,
          stockDocumentName: ref.sheet,
          pageNumber: ref.page,
          referenceNote: ref.note || ''
        });
      }
    }

    console.log('8. Seeding Initial Stock Movements & Transactions...');
    const today = new Date().toISOString().split('T')[0];
    for (const prod of products) {
      await StockTransaction.create({
        transactionId: `TXN-INIT-${prod.productCode}`,
        transactionType: 'PURCHASE',
        productId: prod._id,
        productCode: prod.productCode,
        productName: prod.productName,
        stockRegister: prod.stockRegister || 'SR1',
        quantity: prod.currentQuantity,
        previousQuantity: 0,
        newQuantity: prod.currentQuantity,
        department: 'Store',
        date: today,
        remarks: 'Physical register opening stock balance',
        recordedBy: 'System Admin'
      });
    }

    console.log('9. Seeding Recorded Physical Purchase (PUR-0001)...');
    const bulbProd = products.find(p => p.productCode === 'CON-0001');
    await Purchase.create({
      purchaseNumber: 'PUR-0001',
      purchaseId: 'PUR-0001',
      date: today,
      productId: bulbProd._id,
      productCode: bulbProd.productCode,
      productName: bulbProd.productName,
      stockRegister: bulbProd.stockRegister,
      pageNumber: bulbProd.pageNumber,
      quantity: 10,
      unit: bulbProd.unit,
      unitPrice: 95,
      totalAmount: 950,
      supplier: 'National Electrical Supplies',
      invoiceNumber: 'INV-2026-884',
      recordedBy: 'System Admin',
      remarks: 'Replenishment for main corridor fixtures'
    });

    await StockTransaction.create({
      transactionId: 'TXN-PUR-0001',
      transactionType: 'PURCHASE',
      productId: bulbProd._id,
      productCode: bulbProd.productCode,
      productName: bulbProd.productName,
      stockRegister: bulbProd.stockRegister,
      quantity: 10,
      previousQuantity: bulbProd.currentQuantity,
      newQuantity: bulbProd.currentQuantity + 10,
      department: 'Store',
      date: today,
      remarks: 'Purchase recorded: National Electrical Supplies',
      recordedBy: 'System Admin'
    });

    console.log('10. Seeding Recorded Physical Transfer (TRF-0001)...');
    const tapeProd = products.find(p => p.productCode === 'CON-0006');
    await Transfer.create({
      transferNumber: 'TRF-0001',
      transferId: 'TRF-0001',
      date: today,
      productId: tapeProd._id,
      productCode: tapeProd.productCode,
      productName: tapeProd.productName,
      stockRegister: tapeProd.stockRegister,
      pageNumber: tapeProd.pageNumber,
      quantity: 5,
      unit: tapeProd.unit,
      department: 'Electrical & Electronics Engineering',
      departmentId: eeeDept?._id || null,
      issuedTo: 'Faculty User',
      issuedBy: 'System Admin',
      purpose: 'Lab wiring maintenance',
      remarks: 'Issued for bench rewiring'
    });

    await StockTransaction.create({
      transactionId: 'TXN-TRF-0001',
      transactionType: 'TRANSFER',
      productId: tapeProd._id,
      productCode: tapeProd.productCode,
      productName: tapeProd.productName,
      stockRegister: tapeProd.stockRegister,
      quantity: 5,
      previousQuantity: tapeProd.currentQuantity,
      newQuantity: Math.max(0, tapeProd.currentQuantity - 5),
      department: 'Electrical & Electronics Engineering',
      date: today,
      remarks: 'Stock issued to Electrical & Electronics Engineering',
      recordedBy: 'System Admin'
    });

    console.log('11. Seeding Sample Faculty Indent (IND-0001)...');
    const switchProd = products.find(p => p.productCode === 'CON-0002');

    await Indent.create({
      indentNumber: 'IND-0001',
      date: today,
      requestDate: today,
      requiredDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      requestingDepartment: 'Electrical & Electronics Engineering',
      department: 'Electrical & Electronics Engineering',
      departmentId: eeeDept?._id || null,
      requesterId: facultyUser._id,
      requestedBy: 'Faculty User (FACULTY)',
      requesterName: 'Faculty User',
      purpose: 'Replacement of lab lighting and workstation switches in Power Electronics Lab',
      remarks: 'Lab scheduled for practical exams',
      status: 'SUBMITTED',
      items: [
        {
          productId: bulbProd._id,
          productCode: bulbProd.productCode,
          productName: bulbProd.productName,
          stockRegister: bulbProd.stockRegister,
          unit: bulbProd.unit,
          availableQuantityAtRequest: bulbProd.currentQuantity,
          quantityRequired: 5,
          requestedQuantity: 5,
          quantityRecommended: 0,
          quantityApproved: 0,
          approvedQuantity: 0,
          quantityIssued: 0,
          lineRemarks: 'For ceiling fixture replacement'
        },
        {
          productId: switchProd._id,
          productCode: switchProd.productCode,
          productName: switchProd.productName,
          stockRegister: switchProd.stockRegister,
          unit: switchProd.unit,
          availableQuantityAtRequest: switchProd.currentQuantity,
          quantityRequired: 2,
          requestedQuantity: 2,
          quantityRecommended: 0,
          quantityApproved: 0,
          approvedQuantity: 0,
          quantityIssued: 0,
          lineRemarks: 'For bench 4 and 5'
        }
      ]
    });

    console.log('12. Seeding Notifications...');
    await Notification.create({
      title: 'Low Stock Alert',
      message: `Product "Switch (2-pin, 6A)" (CON-0002) is down to 4 Pieces (Minimum: 10). Restocking recommended.`,
      type: 'LOW_STOCK',
      targetRole: 'ADMIN',
      referenceId: 'CON-0002',
      isRead: false
    });

    await Notification.create({
      title: 'New Indent Submitted',
      message: 'Indent IND-0001 submitted by Electrical & Electronics Engineering (2 items).',
      type: 'INDENT_CREATED',
      targetRole: 'ADMIN',
      referenceId: 'IND-0001',
      isRead: false
    });

    console.log('\n======================================================');
    console.log('SEEDING COMPLETED SUCCESSFULLY IN MONGODB ATLAS!');
    console.log('------------------------------------------------------');
    console.log('Admin Account:   username: admin    password: admin123');
    console.log('Faculty Account: username: faculty  password: faculty123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error during database seed:', error);
    process.exit(1);
  }
};

seedDatabase();
