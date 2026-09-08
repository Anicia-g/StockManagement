import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { productApi, purchaseApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

export const PurchaseForm = ({ onPurchaseCompleted = null }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [supplier, setSupplier] = useState('Sri Balaji Electricals');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-4432');
  const [unitPrice, setUnitPrice] = useState(85);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('Quarterly stock purchase & replenishment');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const { fetchNotifications } = useNotifications();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await productApi.getProducts();
        if (res.success && res.products.length > 0) {
          setProducts(res.products);
          setSelectedProductId(res.products[0]._id);
        }
      } catch (err) {
        console.error('Failed to load products for purchase:', err);
      }
    };
    loadProducts();
  }, []);

  const selectedProduct = products.find((p) => p._id === selectedProductId);
  const currentStock = selectedProduct ? selectedProduct.currentQuantity : 0;
  const numQty = Number(quantity) || 0;
  const newCalculatedStock = currentStock + (numQty > 0 ? numQty : 0);
  const totalAmount = (Number(unitPrice) || 0) * numQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || numQty <= 0) {
      setFeedback({
        type: 'error',
        message: 'Please select a valid product and enter a purchase quantity greater than zero.'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productId: selectedProductId,
        quantity: numQty,
        supplier: supplier.trim(),
        invoiceNumber: invoiceNumber.trim(),
        unitPrice: Number(unitPrice) || 0,
        date,
        remarks: remarks.trim()
      };

      const res = await purchaseApi.recordPurchase(payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message
        });

        // Update local product currentQuantity
        setProducts((prev) =>
          prev.map((p) =>
            p._id === selectedProductId ? { ...p, currentQuantity: res.product.newQuantity } : p
          )
        );

        fetchNotifications();
        if (onPurchaseCompleted) onPurchaseCompleted(res.purchase);

        setQuantity(0);
        setInvoiceNumber('');
        setRemarks('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to record purchase.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="card-head">
        <h2>Record Stock Purchase</h2>
        {selectedProduct && (
          <span className="badge badge-blue">
            Stock Register: {selectedProduct.stockRegister || 'SR1'}
          </span>
        )}
      </div>
      <div className="card-pad">
        {feedback && (
          <div className={feedback.type === 'success' ? 'success-box' : 'alert-box'}>
            {feedback.type === 'success' ? '✓ ' : '⚠ '}
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="purchase-product">Product *</label>
              <select
                id="purchase-product"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setFeedback(null);
                }}
                required
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.productCode}) — Current: {p.currentQuantity} {p.unit} [{p.stockRegister || 'SR1'}]
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="purchase-qty">Quantity Purchased *</label>
              <input
                type="number"
                id="purchase-qty"
                min="1"
                placeholder="e.g. 50"
                value={quantity || ''}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setFeedback(null);
                }}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="purchase-date">Purchase Date *</label>
              <input
                type="date"
                id="purchase-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="purchase-supplier">Supplier / Vendor Name *</label>
              <input
                type="text"
                id="purchase-supplier"
                placeholder="e.g. Sri Balaji Electricals"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="purchase-invoice">Invoice / Bill Number</label>
              <input
                type="text"
                id="purchase-invoice"
                placeholder="e.g. INV-4432"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="purchase-price">Unit Price (₹)</label>
              <input
                type="number"
                id="purchase-price"
                min="0"
                step="0.01"
                placeholder="e.g. 85.00"
                value={unitPrice || ''}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Estimated Total Amount</label>
              <input
                type="text"
                value={`₹${totalAmount.toLocaleString('en-IN')}`}
                disabled
              />
            </div>

            <div className="field full">
              <label htmlFor="purchase-remarks">Remarks / Delivery Notes</label>
              <textarea
                id="purchase-remarks"
                placeholder="Batch number, warranty, rack storage location..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
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
              <div className="k">Purchased Quantity</div>
              <div className="v">
                +{numQty} {selectedProduct?.unit}
              </div>
            </div>
            <div className="item">
              <div className="k">New Stock Count</div>
              <div className="v" style={{ color: 'var(--green-600)' }}>
                {newCalculatedStock} {selectedProduct?.unit}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Recording Purchase...' : 'Record Purchase'}
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

export default PurchaseForm;
