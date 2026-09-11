import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { productApi, masterDataApi } from '../../services/api';

export const EditProductModal = ({ isOpen, onClose, product, onProductUpdated }) => {
  const [categories, setCategories] = useState([]);
  const [registerOptions, setRegisterOptions] = useState([]);

  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    category: '',
    description: '',
    unit: 'Pieces',
    currentQuantity: 0,
    minimumStockLevel: 5,
    stockRegister: 'SR1',
    pageNumber: 1,
    status: 'ACTIVE'
  });

  const [registerRefs, setRegisterRefs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [catRes, docRes] = await Promise.all([
          masterDataApi.getCategories(),
          masterDataApi.getStockDocuments()
        ]);
        if (catRes?.success && catRes.categories?.length > 0) {
          setCategories(catRes.categories.map(c => c.name));
        }
        if (docRes?.success && docRes.documents?.length > 0) {
          setRegisterOptions(docRes.documents.map(d => d.name));
        }
      } catch (e) {
        console.error('Failed to load master data in EditProductModal:', e);
      }
    };
    if (isOpen) {
      loadMasterData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setFormData({
        productCode: product.productCode || '',
        name: product.name || product.productName || '',
        category: product.category || '',
        description: product.description || '',
        unit: product.unit || 'Pieces',
        currentQuantity: product.currentQuantity !== undefined ? product.currentQuantity : 0,
        minimumStockLevel: product.minimumStockLevel !== undefined ? product.minimumStockLevel : (product.minimumQuantity || 5),
        stockRegister: product.stockRegister || 'SR1',
        pageNumber: product.pageNumber || 1,
        status: product.status || (product.active === false ? 'INACTIVE' : 'ACTIVE')
      });

      if (product.registerRefs && product.registerRefs.length > 0) {
        setRegisterRefs(product.registerRefs);
      } else {
        setRegisterRefs([{ sheet: product.stockRegister || 'SR1', page: product.pageNumber || 1 }]);
      }
      setError('');
    }
  }, [product]);

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

      const res = await productApi.updateProduct(product._id || product.id, payload);
      if (res.success) {
        onProductUpdated(res.product);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update product.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Product: ${product?.name || ''}`} maxWidth="640px">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="login-error-box" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="edit-product-code">Product Code *</label>
            <input
              type="text"
              id="edit-product-code"
              value={formData.productCode}
              onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-product-name">Product Name *</label>
            <input
              type="text"
              id="edit-product-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-category">Category</label>
            <select
              id="edit-category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="edit-unit">Unit</label>
            <input
              type="text"
              id="edit-unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-quantity">Current Quantity</label>
            <input
              type="number"
              id="edit-quantity"
              min="0"
              value={formData.currentQuantity}
              onChange={(e) => setFormData({ ...formData, currentQuantity: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-min-stock">Minimum Stock Level *</label>
            <input
              type="number"
              id="edit-min-stock"
              min="0"
              value={formData.minimumStockLevel}
              onChange={(e) => setFormData({ ...formData, minimumStockLevel: e.target.value })}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="edit-stock-register">Primary Stock Register</label>
            <select
              id="edit-stock-register"
              value={formData.stockRegister}
              onChange={(e) => setFormData({ ...formData, stockRegister: e.target.value })}
            >
              {registerOptions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive / Deactivated</option>
            </select>
          </div>

          <div className="full field">
            <label htmlFor="edit-description">Description</label>
            <input
              type="text"
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="full" style={{ marginTop: '4px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.82rem', display: 'block', marginBottom: '8px' }}>
              Stock Register References (SR1 / SR2 / SR3)
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
        </div>

        <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProductModal;
