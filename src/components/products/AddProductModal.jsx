import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { productApi } from '../../services/api';

const REGISTER_OPTIONS = ['SR1', 'SR2', 'SR3', 'CSSR1'];
const CATEGORY_OPTIONS = [
  'Lighting',
  'Electrical',
  'Appliance',
  'Switchgear',
  'Wiring',
  'Consumable',
  'Tools & Accessories'
];

export const AddProductModal = ({ isOpen, onClose, onProductCreated }) => {
  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    category: 'Electrical',
    description: '',
    unit: 'Pieces',
    currentQuantity: 10,
    minimumStockLevel: 5,
    stockRegister: 'SR1',
    pageNumber: 1,
    initialRemark: ''
  });

  const [registerRefs, setRegisterRefs] = useState([
    { sheet: 'SR1', page: 1 }
  ]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddRefRow = () => {
    setRegisterRefs([...registerRefs, { sheet: 'SR1', page: 1 }]);
  };

  const handleRemoveRefRow = (index) => {
    if (registerRefs.length > 1) {
      setRegisterRefs(registerRefs.filter((_, i) => i !== index));
    }
  };

  const handleRefChange = (index, field, value) => {
    const updated = [...registerRefs];
    updated[index][field] = field === 'page' ? Number(value) : value;
    setRegisterRefs(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.productCode.trim()) {
      setError('Product code is required.');
      return;
    }

    if (!formData.name.trim()) {
      setError('Product name is required.');
      return;
    }

    setLoading(true);
    try {
      const validRefs = registerRefs
        .filter((r) => r.sheet && r.page)
        .map((r) => ({ sheet: r.sheet, page: Number(r.page) || 1 }));

      const payload = {
        ...formData,
        productCode: formData.productCode.trim().toUpperCase(),
        currentQuantity: Number(formData.currentQuantity) || 0,
        minimumStockLevel: Number(formData.minimumStockLevel) || 5,
        pageNumber: Number(formData.pageNumber) || 1,
        registerRefs: validRefs.length > 0 ? validRefs : [{ sheet: formData.stockRegister, page: formData.pageNumber }]
      };

      const res = await productApi.createProduct(payload);
      if (res.success) {
        onProductCreated(res.product);
        // Reset form
        setFormData({
          productCode: '',
          name: '',
          category: 'Electrical',
          description: '',
          unit: 'Pieces',
          currentQuantity: 10,
          minimumStockLevel: 5,
          stockRegister: 'SR1',
          pageNumber: 1,
          initialRemark: ''
        });
        setRegisterRefs([{ sheet: 'SR1', page: 1 }]);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create product.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Electrical Product" maxWidth="640px">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="login-error-box" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="modal-product-code">Product Code *</label>
            <input
              type="text"
              id="modal-product-code"
              placeholder="e.g. EL-SW-005"
              value={formData.productCode}
              onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="modal-product-name">Product Name *</label>
            <input
              type="text"
              id="modal-product-name"
              placeholder="e.g. 16A Power Socket with Shutter"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="modal-category">Category</label>
            <select
              id="modal-category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="modal-unit">Unit</label>
            <input
              type="text"
              id="modal-unit"
              placeholder="e.g. Pieces, Coils, Rolls, Meters"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="modal-initial-qty">Current Quantity *</label>
            <input
              type="number"
              id="modal-initial-qty"
              min="0"
              value={formData.currentQuantity}
              onChange={(e) => setFormData({ ...formData, currentQuantity: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="modal-min-stock">Minimum Stock Level *</label>
            <input
              type="number"
              id="modal-min-stock"
              min="0"
              value={formData.minimumStockLevel}
              onChange={(e) => setFormData({ ...formData, minimumStockLevel: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="modal-stock-register">Primary Stock Register *</label>
            <select
              id="modal-stock-register"
              value={formData.stockRegister}
              onChange={(e) => setFormData({ ...formData, stockRegister: e.target.value })}
            >
              {REGISTER_OPTIONS.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="modal-page-num">Register Page Number</label>
            <input
              type="number"
              id="modal-page-num"
              min="1"
              value={formData.pageNumber}
              onChange={(e) => setFormData({ ...formData, pageNumber: e.target.value })}
            />
          </div>

          <div className="full field">
            <label htmlFor="modal-description">Description (Optional)</label>
            <input
              type="text"
              id="modal-description"
              placeholder="e.g. 240V 50Hz modular electrical fitting"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="full" style={{ marginTop: '4px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '8px' }}>
              Physical Stock Register References (SR1 / SR2 / SR3)
            </label>
            {registerRefs.map((ref, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <select
                  style={{ flex: 1 }}
                  value={ref.sheet}
                  onChange={(e) => handleRefChange(index, 'sheet', e.target.value)}
                  aria-label="Stock Register"
                >
                  {REGISTER_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Page Number"
                  style={{ flex: 1 }}
                  min="1"
                  value={ref.page}
                  onChange={(e) => handleRefChange(index, 'page', e.target.value)}
                  aria-label="Page Number"
                />

                {registerRefs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRefRow(index)}
                    className="btn-ghost"
                    style={{ color: 'var(--red-600)', padding: '6px' }}
                    title="Remove reference"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddRefRow}
              style={{ marginTop: '4px', marginBottom: '10px' }}
            >
              + Add Another Register Reference
            </Button>
          </div>

          <div className="full field">
            <label htmlFor="modal-initial-remark">Initial Technical Remark / Note</label>
            <textarea
              id="modal-initial-remark"
              placeholder="e.g. Initial inventory intake note, rack location, etc."
              rows={2}
              value={formData.initialRemark}
              onChange={(e) => setFormData({ ...formData, initialRemark: e.target.value })}
            />
          </div>
        </div>

        <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Creating Product...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProductModal;
