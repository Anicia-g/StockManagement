import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { productApi, transferApi, masterDataApi } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

export const TransferForm = ({ onTransferCompleted = null, onTransferSuccess = null }) => {
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [department, setDepartment] = useState('');
  const [indentNumber, setIndentNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const { fetchNotifications } = useNotifications();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [prodRes, deptRes] = await Promise.all([
          productApi.getProducts(),
          masterDataApi.getDepartments()
        ]);
        if (prodRes.success && prodRes.products.length > 0) {
          setProducts(prodRes.products);
          setSelectedProductId(prodRes.products[0]._id);
        }
        if (deptRes.success && deptRes.departments?.length > 0) {
          setDepartments(deptRes.departments);
          setDepartment(deptRes.departments[0].name);
        }
      } catch (err) {
        console.error('Failed to load products/departments for transfer:', err);
      }
    };
    loadInitialData();
  }, []);

  const selectedProduct = products.find((p) => p._id === selectedProductId);
  const availableStock = selectedProduct ? selectedProduct.currentQuantity : 0;
  const minStock = selectedProduct ? (selectedProduct.minimumQuantity !== undefined ? selectedProduct.minimumQuantity : (selectedProduct.minimumStockLevel || 5)) : 0;
  const numQty = Number(quantity) || 0;

  const isOverLimit = numQty > availableStock;
  const remainingStock = availableStock - numQty;
  const willBeLowStock = !isOverLimit && numQty > 0 && remainingStock <= minStock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || numQty <= 0) {
      setFeedback({
        type: 'error',
        message: 'Please select a product and enter a valid transfer quantity.'
      });
      return;
    }

    if (isOverLimit) {
      setFeedback({
        type: 'error',
        message: `Validation Error: Cannot transfer ${numQty} units. Only ${availableStock} ${selectedProduct?.unit} available in store stock.`
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productId: selectedProductId,
        quantity: numQty,
        department,
        indentNumber: indentNumber.trim() || undefined,
        date,
        remarks: remarks.trim()
      };

      const res = await transferApi.issueTransfer(payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Transfer recorded successfully.'
        });

        const newStockVal =
          res.data?.product?.currentQuantity ??
          res.product?.newQuantity ??
          res.updatedProduct?.currentQuantity ??
          Math.max(0, availableStock - numQty);

        setProducts((prev) =>
          prev.map((p) =>
            p._id === selectedProductId ? { ...p, currentQuantity: newStockVal } : p
          )
        );

        if (typeof fetchNotifications === 'function') {
          fetchNotifications();
        }

        const transferRecord = res.data?.transfer || res.transfer || {
          quantity: numQty,
          productName: selectedProduct?.productName || selectedProduct?.name,
          department
        };

        const cb = onTransferSuccess || onTransferCompleted;
        if (typeof cb === 'function') {
          try {
            cb(transferRecord);
          } catch (errCb) {
            console.error('Error in onTransferSuccess callback:', errCb);
          }
        }

        setQuantity('');
        setRemarks('');
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Failed to issue transfer.'
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to issue transfer.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="card-head">
        <h2>Issue Department Stock Transfer</h2>
        {selectedProduct && (
          <span className="badge badge-blue">
            Register: {selectedProduct.stockRegister || 'SR1'} (p.{selectedProduct.pageNumber || 1})
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
              <label htmlFor="transfer-product">Product *</label>
              <select
                id="transfer-product"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setFeedback(null);
                }}
                required
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.productCode}) — Available: {p.currentQuantity} {p.unit} [{p.stockRegister || 'SR1'}]
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Available Stock in Store</label>
              <input
                type="text"
                value={`${availableStock} ${selectedProduct?.unit || 'Pieces'}`}
                disabled
              />
            </div>

            <div className="field">
              <label htmlFor="transfer-qty">Quantity to Transfer *</label>
              <input
                type="number"
                id="transfer-qty"
                min="1"
                max={availableStock}
                placeholder="e.g. 5"
                value={quantity || ''}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setFeedback(null);
                }}
                required
              />
              {isOverLimit && (
                <div className="field-error">
                  Requested quantity exceeds available store stock ({availableStock} max).
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="transfer-dept">Receiving Department *</label>
              <select
                id="transfer-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                {departments.map((d) => (
                  <option key={d._id || d.name || d} value={d.name || d}>
                    {d.name || d}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="transfer-indent-ref">Indent Reference (Optional)</label>
              <input
                type="text"
                id="transfer-indent-ref"
                placeholder="e.g. IND-2026-014"
                value={indentNumber}
                onChange={(e) => setIndentNumber(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="transfer-date">Date of Transfer *</label>
              <input
                type="date"
                id="transfer-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="field full">
              <label htmlFor="transfer-remarks">Remarks / Purpose of Issue</label>
              <textarea
                id="transfer-remarks"
                placeholder="Room number, lab fixture replacement, emergency repair..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {isOverLimit && (
            <div className="alert-box">
              ⚠ Cannot transfer: The requested quantity ({numQty}) exceeds available store stock ({availableStock}).
            </div>
          )}

          {willBeLowStock && (
            <div className="warning-box">
              ⚠ Transferring {numQty} units will reduce available stock to {remainingStock}, which is at or below the minimum stock level ({minStock}). This item will trigger a low stock alert.
            </div>
          )}

          <div className="form-actions">
            <Button
              variant="primary"
              type="submit"
              disabled={isOverLimit || availableStock === 0 || loading}
            >
              {loading ? 'Issuing Transfer...' : 'Issue Stock Transfer'}
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

export default TransferForm;
