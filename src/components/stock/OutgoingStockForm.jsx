import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useStock } from "../../context/StockContext";
import { DEPARTMENTS } from "../../data/mockData";
import Button from "../common/Button";

export const OutgoingStockForm = () => {
  const { products, recordOutgoingStock } = useStock();

  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?.id || ""
  );
  const [quantity, setQuantity] = useState(2);
  const [department, setDepartment] = useState(DEPARTMENTS[1]); // EEE
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState(
    "Issued for maintenance replacement in department."
  );
  const [feedback, setFeedback] = useState(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const availableStock = selectedProduct ? selectedProduct.currentStock : 0;
  const minStock = selectedProduct ? selectedProduct.minStock : 0;
  const numQty = Number(quantity) || 0;

  const isOverLimit = numQty > availableStock;
  const remainingStock = availableStock - numQty;
  const willBeLowStock = !isOverLimit && numQty > 0 && remainingStock < minStock;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductId || numQty <= 0) {
      setFeedback({
        type: "error",
        message: "Please select a product and enter a valid quantity."
      });
      return;
    }

    if (isOverLimit) {
      setFeedback({
        type: "error",
        message: `Validation Error: Cannot issue ${numQty} units. Only ${availableStock} ${selectedProduct?.unit} available in stock.`
      });
      return;
    }

    const result = recordOutgoingStock({
      productId: selectedProductId,
      quantity: numQty,
      department,
      date,
      remarks
    });

    if (result.success) {
      let msg = `Successfully issued ${result.issuedQty} units of ${result.productName} to ${department}. Remaining stock: ${result.newStock} ${selectedProduct?.unit}.`;
      if (result.isLowStock) {
        msg += ` ⚠ Warning: Item is now below its minimum stock level (${minStock} ${selectedProduct?.unit}).`;
      }
      setFeedback({
        type: "success",
        message: msg
      });
      setQuantity(1);
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  };

  return (
    <div className="card form-card">
      <div className="card-head">
        <h2>Issue Stock</h2>
      </div>
      <div className="card-pad">
        {feedback && (
          <div
            className={
              feedback.type === "success" ? "success-box" : "alert-box"
            }
          >
            {feedback.type === "success" ? "✓ " : "⚠ "}
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="outgoing-product">Product</label>
              <select
                id="outgoing-product"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setFeedback(null);
                }}
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) — Available: {p.currentStock} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Available Stock</label>
              <input
                type="text"
                value={`${availableStock} ${selectedProduct?.unit || "Pieces"}`}
                disabled
              />
            </div>

            <div className="field">
              <label htmlFor="outgoing-qty">Quantity Issued</label>
              <input
                type="number"
                id="outgoing-qty"
                min="1"
                max={availableStock}
                placeholder="e.g. 2"
                value={quantity || ""}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setFeedback(null);
                }}
                required
              />
              {isOverLimit && (
                <div className="field-error">
                  Quantity exceeds available stock ({availableStock} max)
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="outgoing-dept">Receiving Department</label>
              <select
                id="outgoing-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                {DEPARTMENTS.filter((d) => d !== "Store").map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="outgoing-date">Date</label>
              <input
                type="date"
                id="outgoing-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="field full">
              <label htmlFor="outgoing-remarks">Remarks / Purpose</label>
              <textarea
                id="outgoing-remarks"
                placeholder="Specific room, purpose, or work order notes"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {isOverLimit && (
            <div className="alert-box">
              ⚠ Cannot issue stock: The requested quantity ({numQty}) is greater than the available stock ({availableStock}).
            </div>
          )}

          {willBeLowStock && (
            <div className="warning-box">
              ⚠ Issuing {numQty} units will bring available stock to {remainingStock}, which is below the minimum level of {minStock}. This item will appear under Low Stock.
            </div>
          )}

          <div className="form-actions">
            <Button variant="primary" type="submit" disabled={isOverLimit || availableStock === 0}>
              Issue Stock
            </Button>
            <Link to="/products" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OutgoingStockForm;
