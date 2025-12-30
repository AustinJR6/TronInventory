const fs = require('fs');

// Read the backup schema
let schema = fs.readFileSync('prisma/schema.prisma.backup', 'utf8');

console.log('Starting schema transformation...');

// 1. Add new user roles
schema = schema.replace(
  'enum UserRole {\n  ADMIN\n  WAREHOUSE\n  FIELD\n}',
  'enum UserRole {\n  ADMIN\n  WAREHOUSE\n  FIELD\n  SALES_REP\n  DRIVER\n  CUSTOMER_USER\n}'
);
console.log('✓ Added new user roles');

// 2. Add BusinessModel enum after UserRole
schema = schema.replace(
  /(enum UserRole \{[^}]+\})/,
  '$1\n\nenum BusinessModel {\n  WAREHOUSE_ONLY\n  DISTRIBUTION\n  HYBRID\n}'
);
console.log('✓ Added BusinessModel enum');

// 3. Add distribution enums after OrderType
const distEnums = `
enum CustomerStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum CustomerOrderStatus {
  SUBMITTED
  APPROVED
  PULLED
  LOADED
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
}

enum CustomerOrderType {
  STANDARD
  EMERGENCY
  STANDING
}

enum DeliveryStatus {
  SCHEDULED
  LOADED
  IN_TRANSIT
  ARRIVED
  DELIVERED
  FAILED
}`;

schema = schema.replace(
  /(enum OrderType \{[^}]+\})/,
  '$1\n' + distEnums
);
console.log('✓ Added distribution enums');

// 4. Update LicenseTier
schema = schema.replace(
  'enum LicenseTier {\n  BASE\n  ELITE\n}',
  'enum LicenseTier {\n  BASE\n  ELITE\n  DISTRIBUTION\n}'
);
console.log('✓ Updated LicenseTier');

// 5. Add businessModel to Company
schema = schema.replace(
  /(model Company \{[^}]*appName\s+String\?\s+createdAt)/,
  'model Company {\n  id           String        @id @default(cuid())\n  name         String\n  slug         String        @unique\n  logoUrl      String?\n  primaryColor String?\n  appName      String?\n  businessModel BusinessModel @default(WAREHOUSE_ONLY)\n  createdAt'
);
console.log('✓ Added businessModel to Company');

// 6. Add distribution relations to Company model (before @@map)
schema = schema.replace(
  /(model Company \{[\s\S]*?poReceivingLogs\s+POReceivingLog\[\])([\s\S]*?@@map\("companies"\))/,
  '$1\n  customers             Customer[]\n  routes                Route[]\n  customerOrders        CustomerOrder[]\n  deliveryOrders        DeliveryOrder[]$2'
);
console.log('✓ Added distribution relations to Company');

// 7. Add fields to User model (after updatedAt, before company relation)
const userFields = `
  // For sales reps
  territory      String?
  commissionRate Float?

  // For drivers
  licenseNumber  String?

  // For customer users
  customerId     String?
`;

schema = schema.replace(
  /(model User \{[\s\S]*?updatedAt\s+DateTime\s+@updatedAt)([\s\S]*?company\s+Company)/,
  '$1\n' + userFields + '\n$2'
);
console.log('✓ Added fields to User model');

// 8. Add distribution relations to User model (before @@unique)
const userRelations = `
  // Distribution relationships
  customersManaged      Customer[]       @relation("SalesRepCustomers")
  salesOrders           CustomerOrder[]  @relation("SalesRepOrders")
  createdCustomerOrders CustomerOrder[]  @relation("CreatedCustomerOrders")
  routes                Route[]          @relation("DriverRoutes")
  deliveries            DeliveryOrder[]  @relation("DriverDeliveries")
  customer              Customer?        @relation("CustomerUsers", fields: [customerId], references: [id])
`;

schema = schema.replace(
  /(model User \{[\s\S]*?receivingLogs\s+POReceivingLog\[\])([\s\S]*?@@unique)/,
  '$1\n' + userRelations + '\n$2'
);
console.log('✓ Added distribution relations to User');

// 9. Add distribution relations to WarehouseInventory (before @@unique)
schema = schema.replace(
  /(model WarehouseInventory \{[\s\S]*?purchaseOrderItems\s+PurchaseOrderItem\[\])([\s\S]*?@@unique)/,
  '$1\n  customerParLevels     CustomerParLevel[]\n  customerInventory     CustomerInventory[]\n  customerOrderItems    CustomerOrderItem[]\n$2'
);
console.log('✓ Added distribution relations to WarehouseInventory');

// 10. Add all distribution models at the end
const distributionModels = `
// ===================================
// DISTRIBUTION MODELS
// ===================================

model Customer {
  id                   String         @id @default(cuid())
  companyId            String
  businessName         String
  contactName          String?
  phone                String?
  email                String?
  address              String
  city                 String?
  state                String?
  zipCode              String?
  deliveryInstructions String?
  accountNumber        String?
  routeId              String?
  salesRepId           String?
  status               CustomerStatus @default(ACTIVE)
  creditLimit          Float?
  paymentTerms         String?
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt

  company   Company              @relation(fields: [companyId], references: [id], onDelete: Cascade)
  route     Route?               @relation(fields: [routeId], references: [id])
  salesRep  User?                @relation("SalesRepCustomers", fields: [salesRepId], references: [id])
  parLevels CustomerParLevel[]
  inventory CustomerInventory[]
  orders    CustomerOrder[]
  users     User[]               @relation("CustomerUsers")

  @@unique([companyId, accountNumber])
  @@index([companyId, salesRepId])
  @@index([companyId, routeId])
  @@map("customers")
}

model CustomerParLevel {
  id              String @id @default(cuid())
  customerId      String
  warehouseItemId String
  parLevel        Int

  customer      Customer           @relation(fields: [customerId], references: [id], onDelete: Cascade)
  warehouseItem WarehouseInventory @relation(fields: [warehouseItemId], references: [id])

  @@unique([customerId, warehouseItemId])
  @@map("customer_par_levels")
}

model CustomerInventory {
  id               String    @id @default(cuid())
  customerId       String
  warehouseItemId  String
  currentQty       Int
  lastCountDate    DateTime?
  lastCountBy      String?
  lastDeliveryDate DateTime?

  customer      Customer           @relation(fields: [customerId], references: [id], onDelete: Cascade)
  warehouseItem WarehouseInventory @relation(fields: [warehouseItemId], references: [id])

  @@unique([customerId, warehouseItemId])
  @@map("customer_inventory")
}

model Route {
  id          String   @id @default(cuid())
  companyId   String
  name        String
  description String?
  driverId    String?
  schedule    String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  company        Company         @relation(fields: [companyId], references: [id], onDelete: Cascade)
  driver         User?           @relation("DriverRoutes", fields: [driverId], references: [id])
  customers      Customer[]
  deliveryOrders DeliveryOrder[]

  @@unique([companyId, name])
  @@map("routes")
}

model CustomerOrder {
  id              String              @id @default(cuid())
  companyId       String
  orderNumber     String              @unique
  customerId      String
  createdById     String
  salesRepId      String?
  deliveryOrderId String?             @unique
  status          CustomerOrderStatus @default(SUBMITTED)
  orderType       CustomerOrderType   @default(STANDARD)
  subtotal        Float               @default(0)
  tax             Float               @default(0)
  total           Float               @default(0)
  notes           String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  company       Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
  customer      Customer            @relation(fields: [customerId], references: [id])
  createdBy     User                @relation("CreatedCustomerOrders", fields: [createdById], references: [id])
  salesRep      User?               @relation("SalesRepOrders", fields: [salesRepId], references: [id])
  items         CustomerOrderItem[]
  deliveryOrder DeliveryOrder?

  @@index([companyId, customerId])
  @@index([companyId, salesRepId])
  @@index([companyId, status])
  @@map("customer_orders")
}

model CustomerOrderItem {
  id              String @id @default(cuid())
  customerOrderId String
  warehouseItemId String
  requestedQty    Int
  pulledQty       Int    @default(0)
  deliveredQty    Int    @default(0)
  returnedQty     Int    @default(0)
  unitPrice       Float?
  lineTotal       Float?
  notes           String?

  customerOrder CustomerOrder      @relation(fields: [customerOrderId], references: [id], onDelete: Cascade)
  warehouseItem WarehouseInventory @relation(fields: [warehouseItemId], references: [id])

  @@map("customer_order_items")
}

model DeliveryOrder {
  id              String         @id @default(cuid())
  companyId       String
  deliveryNumber  String         @unique
  routeId         String
  driverId        String
  customerOrderId String         @unique
  scheduledDate   DateTime
  loadedAt        DateTime?
  departedAt      DateTime?
  arrivedAt       DateTime?
  deliveredAt     DateTime?
  status          DeliveryStatus @default(SCHEDULED)
  driverNotes     String?
  signature       String?        @db.Text
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  company       Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  route         Route         @relation(fields: [routeId], references: [id])
  driver        User          @relation("DriverDeliveries", fields: [driverId], references: [id])
  customerOrder CustomerOrder @relation(fields: [customerOrderId], references: [id])

  @@index([companyId, routeId])
  @@index([companyId, driverId])
  @@index([companyId, status])
  @@map("delivery_orders")
}
`;

schema = schema.trimEnd() + '\n' + distributionModels;
console.log('✓ Added all distribution models');

// Write the final schema
fs.writeFileSync('prisma/schema.prisma', schema);
console.log('\n✅ Schema transformation complete!');
console.log('Total schema length:', schema.length, 'characters');
