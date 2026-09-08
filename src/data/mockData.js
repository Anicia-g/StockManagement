export const INITIAL_PRODUCTS = [
  {
    id: "EL-BULB-001",
    name: "LED Bulb 10W",
    category: "Lighting",
    currentStock: 25,
    minStock: 10,
    unit: "Pieces",
    registerRefs: [
      { sheet: "CSSR1", page: 42 }
    ],
    remarks: [
      {
        id: "rem-1",
        author: "E. Ramesh, Store Keeper",
        date: "2026-09-05",
        text: "Stock received from Sri Balaji Electricals, verified and stored in Rack L-2."
      }
    ]
  },
  {
    id: "EL-SW-001",
    name: "Switch (2-pin, 6A)",
    category: "Electrical",
    currentStock: 7,
    minStock: 10,
    unit: "Pieces",
    registerRefs: [
      { sheet: "SR2", page: 18 },
      { sheet: "CSSR1", page: 14 }
    ],
    remarks: [
      {
        id: "rem-2",
        author: "S. Kumaran, Electrician",
        date: "2026-09-06",
        text: "Two switches from previous batch had loose terminal screws. Rest checked and working fine."
      },
      {
        id: "rem-3",
        author: "E. Ramesh, Store Keeper",
        date: "2026-09-02",
        text: "Stock running low, raise an indent for restocking before month end."
      }
    ]
  },
  {
    id: "EL-FAN-001",
    name: "Ceiling Fan 1200mm",
    category: "Appliance",
    currentStock: 3,
    minStock: 5,
    unit: "Pieces",
    registerRefs: [
      { sheet: "SR3", page: 7 }
    ],
    remarks: [
      {
        id: "rem-4",
        author: "S. Kumaran, Electrician",
        date: "2026-09-08",
        text: "Issued 5 units for EEE department replacement. Remaining 3 units reserved for emergencies."
      }
    ]
  },
  {
    id: "EL-MCB-032",
    name: "MCB 32A Single Pole",
    category: "Switchgear",
    currentStock: 2,
    minStock: 8,
    unit: "Pieces",
    registerRefs: [
      { sheet: "CSSR1", page: 55 }
    ],
    remarks: [
      {
        id: "rem-5",
        author: "E. Ramesh, Store Keeper",
        date: "2026-09-01",
        text: "Critical low stock. Purchase order forwarded to Maintenance Superintendent."
      }
    ]
  },
  {
    id: "EL-WIRE-015",
    name: "Copper Wire 1.5 sq.mm",
    category: "Wiring",
    currentStock: 4,
    minStock: 6,
    unit: "Coils",
    registerRefs: [
      { sheet: "SR1", page: 12 }
    ],
    remarks: [
      {
        id: "rem-6",
        author: "M. Ganesan, Asst. Engineer",
        date: "2026-08-29",
        text: "Used 3 coils for new wiring in site civil office."
      }
    ]
  },
  {
    id: "EL-TUBE-002",
    name: "LED Tube Light 20W",
    category: "Lighting",
    currentStock: 40,
    minStock: 15,
    unit: "Pieces",
    registerRefs: [
      { sheet: "SR2", page: 22 },
      { sheet: "SR1", page: 9 }
    ],
    remarks: [
      {
        id: "rem-7",
        author: "E. Ramesh, Store Keeper",
        date: "2026-08-20",
        text: "Bulk stock received for classroom tube replacements."
      }
    ]
  },
  {
    id: "EL-HOLD-004",
    name: "Bulb Holder (B22)",
    category: "Lighting",
    currentStock: 60,
    minStock: 20,
    unit: "Pieces",
    registerRefs: [
      { sheet: "CSSR1", page: 30 }
    ],
    remarks: []
  },
  {
    id: "EL-SOCK-007",
    name: "5-Pin Socket 6A",
    category: "Electrical",
    currentStock: 32,
    minStock: 15,
    unit: "Pieces",
    registerRefs: [
      { sheet: "SR3", page: 9 }
    ],
    remarks: [
      {
        id: "rem-8",
        author: "S. Kumaran, Electrician",
        date: "2026-08-22",
        text: "Installed in Boys Hostel block 2 renovation."
      }
    ]
  },
  {
    id: "EL-TAPE-003",
    name: "Insulation Tape",
    category: "Consumable",
    currentStock: 18,
    minStock: 10,
    unit: "Rolls",
    registerRefs: [
      { sheet: "SR1", page: 5 }
    ],
    remarks: []
  },
  {
    id: "EL-DB-006",
    name: "Distribution Board 8-way",
    category: "Switchgear",
    currentStock: 5,
    minStock: 4,
    unit: "Pieces",
    registerRefs: [
      { sheet: "CSSR1", page: 33 }
    ],
    remarks: []
  },
  {
    id: "EL-CHOKE-008",
    name: "Tube Light Choke",
    category: "Lighting",
    currentStock: 3,
    minStock: 10,
    unit: "Pieces",
    registerRefs: [
      { sheet: "SR2", page: 40 }
    ],
    remarks: [
      {
        id: "rem-9",
        author: "E. Ramesh, Store Keeper",
        date: "2026-09-04",
        text: "Stock critically below limit. Need emergency purchase."
      }
    ]
  },
  {
    id: "EL-WIRE-040",
    name: "Earth Wire 4 sq.mm",
    category: "Wiring",
    currentStock: 6,
    minStock: 8,
    unit: "Coils",
    registerRefs: [
      { sheet: "SR1", page: 16 }
    ],
    remarks: []
  }
];

export const INITIAL_TRANSACTIONS = [
  {
    id: "TXN-101",
    date: "2026-09-08",
    productId: "EL-FAN-001",
    productName: "Ceiling Fan 1200mm",
    type: "OUT",
    quantity: 5,
    department: "EEE",
    remarks: "Replacement in staff room and lab 3"
  },
  {
    id: "TXN-102",
    date: "2026-09-07",
    productId: "EL-BULB-001",
    productName: "LED Bulb 10W",
    type: "OUT",
    quantity: 10,
    department: "CSE",
    remarks: "Lab corridor and server room lighting"
  },
  {
    id: "TXN-103",
    date: "2026-09-05",
    productId: "EL-BULB-001",
    productName: "LED Bulb 10W",
    type: "IN",
    quantity: 50,
    department: "Store",
    remarks: "Purchased from Sri Balaji Electricals, INV #4432"
  },
  {
    id: "TXN-104",
    date: "2026-09-03",
    productId: "EL-SW-001",
    productName: "Switch (2-pin, 6A)",
    type: "OUT",
    quantity: 8,
    department: "Mechanical",
    remarks: "Workshop panel maintenance and repair"
  },
  {
    id: "TXN-105",
    date: "2026-09-01",
    productId: "EL-MCB-032",
    productName: "MCB 32A Single Pole",
    type: "IN",
    quantity: 15,
    department: "Store",
    remarks: "Annual stock replenishment"
  },
  {
    id: "TXN-106",
    date: "2026-08-29",
    productId: "EL-WIRE-015",
    productName: "Copper Wire 1.5 sq.mm",
    type: "OUT",
    quantity: 3,
    department: "Civil",
    remarks: "New wiring in site office"
  },
  {
    id: "TXN-107",
    date: "2026-08-26",
    productId: "EL-DB-006",
    productName: "Distribution Board 8-way",
    type: "IN",
    quantity: 5,
    department: "Store",
    remarks: "Stock replenishment"
  },
  {
    id: "TXN-108",
    date: "2026-08-22",
    productId: "EL-SOCK-007",
    productName: "5-Pin Socket 6A",
    type: "OUT",
    quantity: 12,
    department: "Hostel",
    remarks: "Room renovation in Boys Hostel"
  }
];

export const DEPARTMENTS = [
  "Computer Science & Engineering (CSE)",
  "Electrical & Electronics Engineering (EEE)",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology (IT)",
  "Administrative Office",
  "Hostel",
  "Library",
  "Physical Education",
  "Store"
];

export const REGISTER_SHEETS = [
  "CSSR1",
  "SR1",
  "SR2",
  "SR3"
];

export const CATEGORIES = [
  "Lighting",
  "Electrical",
  "Appliance",
  "Switchgear",
  "Wiring",
  "Consumable"
];
