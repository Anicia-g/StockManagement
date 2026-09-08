import React, { createContext, useContext, useState, useMemo } from "react";
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS } from "../data/mockData";

const StockContext = createContext(null);

export const StockProvider = ({ children }) => {
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem("stock_products");
      return stored ? JSON.parse(stored) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem("stock_transactions");
      return stored ? JSON.parse(stored) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Save to localStorage whenever state updates
  const updateProducts = (newProducts) => {
    setProducts(newProducts);
    try {
      localStorage.setItem("stock_products", JSON.stringify(newProducts));
    } catch (e) {
      console.error("Failed to persist products", e);
    }
  };

  const updateTransactions = (newTxns) => {
    setTransactions(newTxns);
    try {
      localStorage.setItem("stock_transactions", JSON.stringify(newTxns));
    } catch (e) {
      console.error("Failed to persist transactions", e);
    }
  };

  // Record incoming stock
  const recordIncomingStock = ({ productId, quantity, date, remarks }) => {
    const qty = Number(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return { success: false, error: "Invalid product or quantity" };
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const prevStock = product.currentStock;
    const newStock = prevStock + qty;

    // Update product stock
    const updatedProducts = products.map((p) =>
      p.id === productId ? { ...p, currentStock: newStock } : p
    );
    updateProducts(updatedProducts);

    // Create transaction log
    const newTxn = {
      id: `TXN-${Date.now()}`,
      date: date || new Date().toISOString().split("T")[0],
      productId: product.id,
      productName: product.name,
      type: "IN",
      quantity: qty,
      department: "Store",
      remarks: remarks || "Stock replenishment"
    };

    updateTransactions([newTxn, ...transactions]);

    return {
      success: true,
      productName: product.name,
      prevStock,
      addedQty: qty,
      newStock
    };
  };

  // Record outgoing stock
  const recordOutgoingStock = ({ productId, quantity, department, date, remarks }) => {
    const qty = Number(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return { success: false, error: "Invalid product or quantity" };
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    if (qty > product.currentStock) {
      return {
        success: false,
        error: `Requested quantity (${qty}) exceeds available stock (${product.currentStock} ${product.unit}).`
      };
    }

    const prevStock = product.currentStock;
    const newStock = prevStock - qty;

    // Update product stock
    const updatedProducts = products.map((p) =>
      p.id === productId ? { ...p, currentStock: newStock } : p
    );
    updateProducts(updatedProducts);

    // Create transaction log
    const newTxn = {
      id: `TXN-${Date.now()}`,
      date: date || new Date().toISOString().split("T")[0],
      productId: product.id,
      productName: product.name,
      type: "OUT",
      quantity: qty,
      department: department || "General Maintenance",
      remarks: remarks || "Issued for department maintenance"
    };

    updateTransactions([newTxn, ...transactions]);

    return {
      success: true,
      productName: product.name,
      prevStock,
      issuedQty: qty,
      newStock,
      isLowStock: newStock < product.minStock
    };
  };

  // Add a new product
  const addProduct = (productData) => {
    const id = productData.id || `EL-${productData.name.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newProduct = {
      ...productData,
      id,
      currentStock: Number(productData.currentStock) || 0,
      minStock: Number(productData.minStock) || 0,
      registerRefs: productData.registerRefs && productData.registerRefs.length > 0 
        ? productData.registerRefs 
        : [{ sheet: "CSSR1", page: 1 }],
      remarks: productData.initialRemark ? [
        {
          id: `rem-${Date.now()}`,
          author: "E. Ramesh, Store Keeper",
          date: new Date().toISOString().split("T")[0],
          text: productData.initialRemark
        }
      ] : []
    };

    const updated = [newProduct, ...products];
    updateProducts(updated);
    return { success: true, product: newProduct };
  };

  // Add remark to product
  const addRemark = (productId, remarkText, author = "E. Ramesh, Store Keeper") => {
    if (!remarkText || !remarkText.trim()) return;

    const newRemark = {
      id: `rem-${Date.now()}`,
      author,
      date: new Date().toISOString().split("T")[0],
      text: remarkText.trim()
    };

    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          remarks: [newRemark, ...(p.remarks || [])]
        };
      }
      return p;
    });

    updateProducts(updated);
    return newRemark;
  };

  // Derived metrics
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.currentStock || 0), 0);
  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.currentStock < p.minStock);
  }, [products]);

  const todayOutgoingStock = useMemo(() => {
    const today = "2026-09-08"; // or new Date().toISOString().split('T')[0]
    return transactions
      .filter((t) => t.type === "OUT" && t.date === today)
      .reduce((sum, t) => sum + t.quantity, 0);
  }, [transactions]);

  return (
    <StockContext.Provider
      value={{
        products,
        transactions,
        totalProducts,
        totalStock,
        lowStockItems,
        todayOutgoingStock,
        recordIncomingStock,
        recordOutgoingStock,
        addProduct,
        addRemark
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error("useStock must be used within a StockProvider");
  }
  return context;
};

export default StockContext;
