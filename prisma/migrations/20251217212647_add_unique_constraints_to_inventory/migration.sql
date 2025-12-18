-- CreateIndex
CREATE UNIQUE INDEX "warehouse_inventory_itemName_key" ON "warehouse_inventory"("itemName");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_inventory_items_itemName_key" ON "vehicle_inventory_items"("itemName");
