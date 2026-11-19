-- Repair checkout on the existing production D1 database.
-- The checkout route creates Order and its nested OrderItem records in one write.
-- IF NOT EXISTS keeps this migration safe to rerun if the table is already present.
CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "packagingChoice" TEXT NOT NULL DEFAULT 'STANDARD',
    "subtotal" REAL NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
