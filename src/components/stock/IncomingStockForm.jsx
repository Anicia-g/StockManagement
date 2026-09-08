import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useStock } from "../../context/StockContext";
import Button from "../common/Button";

export const IncomingStockForm = () => {
  const { products, recordIncomingStock } = useStock();

  const [selectedProductId, setSelectedProductId] = useState(
    products[0]?.id || ""
  );
  const [quantity, setQuantity] = useState(50);
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState(
    "Received from Sri Balaji Electricals, invoice #INV-4432."
  );
  const [feedback, setFeedback] = useState(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProduct ? selectedProduct.currentStock : 0;
  const numQty = Number(quantity) || 0;
  const newCalculatedStock = currentStock + (numQty > 0 ? numQty : 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductId || numQty <= 0) {
      setFeedback({
        type: "error",
        message: "Please select a valid product and enter a quantity greater than zero."
      });
      return;
    }

    const result = recordIncomingStock({
      productId: selectedProductId,
      quantity: numQty,
      date,
      remarks
    });

    if (result.success) {
      setFeedback({
        type: "success",
        message: `Successfully recorded ${result.addedQty} units for ${result.productName}. Stock updated from ${result.prevStock} to ${result.newStock}.`
      });
      // Reset quantity
      setQuantity(0);
      setRemarks("");
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  };

  return (
    <div className="card form-card">
      <div className="card-head">
        <h2>Record Incoming Stock</h2>
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
              <label htmlFor="incoming-product">Product</label>
              <select
                id="incoming-product"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setFeedback(null);
                }}
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id}) — Current Stock: {p.currentStock} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="incoming-qty">Quantity Received</label>
              <input
                type="number"
                id="incoming-qty"
                min="1"
                placeholder="e.g. 50"
                value={quantity || ""}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setFeedback(null);
                }}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="incoming-date">Date</label>
              <input
                type="date"
                id="incoming-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="field full">
              <label htmlFor="incoming-remarks">Remarks</label>
              <textarea
                id="incoming-remarks"
                placeholder="Optional supplier/invoice notes about this delivery"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="info-strip">
            <div className="item">
              <div className="k">Current Stock</div>
              <div className="v">
                {currentStock} {selectedProduct?.unit}
              </div>
            </div>
            <div className="item">
              <div className="k">Quantity Received</div>
              <div className="v">
                +{numQty} {selectedProduct?.unit}
              </div>
            </div>
            <div className="item">
              <div className="k">New Stock</div>
              <div className="v" style={{ color: "var(--green-600)" }}>
                {newCalculatedStock} {selectedProduct?.unit}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button variant="primary" type="submit">
              Record Incoming Stock
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

export default IncomingStockForm;
