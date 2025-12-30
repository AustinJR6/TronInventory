const fs = require('fs');

// Read the updated schema
let schema = fs.readFileSync('prisma/schema_updated.prisma', 'utf8');

// Update User model - add new fields and relations
schema = schema.replace(
  /(model User \{[\s\S]*?)(  @@unique\(\[companyId, vehicleNumber\]\))/,
  (match, p1, p2) => {
    // Add new fields before relations section
    let updated = p1.replace(
      /(  active\s+Boolean\s+@default\(true\)\s+createdAt\s+DateTime\s+@default\(now\(\)\)\s+updatedAt\s+DateTime\s+@updatedAt)/,
      "$1\n\n  // For sales reps\n  territory      String?\n  commissionRate Float?\n\n  // For drivers\n  licenseNumber  String?\n\n  // For customer users\n  customerId     String?"
    );
    
    // Add distribution relations before @@unique
    updated = updated.replace(
      /(  receivingLogs\s+POReceivingLog\[\])/,
      "$1\n\n  // Distribution relationships\n  customersManaged      Customer[]       @relation(\"SalesRepCustomers\")\n  salesOrders           CustomerOrder[]  @relation(\"SalesRepOrders\")\n  createdCustomerOrders CustomerOrder[]  @relation(\"CreatedCustomerOrders\")\n  routes                Route[]          @relation(\"DriverRoutes\")\n  deliveries            DeliveryOrder[]  @relation(\"DriverDeliveries\")\n  customer              Customer?        @relation(\"CustomerUsers\", fields: [customerId], references: [id])"
    );
    
    return updated + '\n' + p2;
  }
);

// Also need to add CustomerParLevel, CustomerInventory, CustomerOrderItem relations to WarehouseInventory
schema = schema.replace(
  /(model WarehouseInventory \{[\s\S]*?)(  @@unique\(\[companyId, itemName, branchId\]\))/,
  (match, p1, p2) => {
    if (!p1.includes('customerParLevels')) {
      return p1.replace(
        /(  purchaseOrderItems\s+PurchaseOrderItem\[\])/,
        "$1\n  customerParLevels     CustomerParLevel[]\n  customerInventory     CustomerInventory[]\n  customerOrderItems    CustomerOrderItem[]"
      ) + '\n  ' + p2;
    }
    return match;
  }
);

console.log('Updated User and WarehouseInventory models');

// Write intermediate
fs.writeFileSync('prisma/schema_temp.prisma', schema);
console.log('Wrote intermediate schema');

