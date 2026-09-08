import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import StatusBadge from '../components/common/StatusBadge';
import StockReferenceCard from '../components/products/StockReferenceCard';
import EditProductModal from '../components/products/EditProductModal';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Loading from '../components/common/Loading';
import { productApi, historyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddRemarkOpen, setIsAddRemarkOpen] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [remarkAuthor, setRemarkAuthor] = useState(user?.name ? `${user.name}, ${user.department}` : 'Staff');

  const loadProductData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productApi.getProductById(id);
      if (res.success) {
        setProduct(res.product);

        // Fetch history transactions matching this product
        const histRes = await historyApi.getStockHistory({ search: res.product.productCode });
        if (histRes.success) {
          setHistory(histRes.transactions);
        }
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
      setError('Product not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  if (loading && !product) {
    return (
      <Layout title="Product Details" breadcrumb="Products / Loading">
        <Loading message="Fetching product specifications and movement history..." />
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout title="Product Details" breadcrumb="Products / Not Found">
        <div className="card card-pad" style={{ textAlign: 'center', padding: '40px' }}>
          <EmptyState
            icon="⚠"
            title="Product Not Found"
            description={`Could not find product matching ID/Code "${id}".`}
            action={
              <Link to="/products" className="btn-primary">
                ← Back to Products Catalog
              </Link>
            }
          />
        </div>
      </Layout>
    );
  }

  const isLowStock = product.currentQuantity <= product.minimumStockLevel;
  const isNearing = !isLowStock && product.currentQuantity <= product.minimumStockLevel + 2;
  const statusText = isLowStock ? 'Low Stock' : isNearing ? 'Nearing Limit' : 'Available';

  const handleSaveRemark = async (e) => {
    e.preventDefault();
    if (!remarkText.trim()) return;

    try {
      const res = await productApi.addRemark(product._id || product.id, {
        text: remarkText.trim(),
        author: remarkAuthor
      });
      if (res.success) {
        setProduct((prev) => ({
          ...prev,
          remarks: [res.remark, ...(prev.remarks || [])]
        }));
        setRemarkText('');
        setIsAddRemarkOpen(false);
      }
    } catch (err) {
      alert('Failed to save remark.');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${product.name}" (${product.productCode})?`
    );
    if (!confirmed) return;

    try {
      const res = await productApi.deleteProduct(product._id || product.id);
      if (res.success) {
        alert(res.message);
        navigate('/products');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  return (
    <Layout
      title="Product Details"
      breadcrumb={`Products / ${product.name} (${product.productCode})`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <Link to="/products" className="back-link" style={{ marginBottom: 0 }}>
          ← Back to Products Catalog
        </Link>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              ✏ Edit Product
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
            >
              🗑 Delete Product
            </Button>
          </div>
        )}
      </div>

      <div className="detail-head">
        <div>
          <h1 style={{ marginBottom: '2px' }}>{product.name}</h1>
          <span className="code">
            {product.productCode} · {product.category} · Unit: {product.unit || 'Pieces'} · Primary Register:{' '}
            <strong>{product.stockRegister || 'SR1'}</strong>
          </span>
          {product.description && (
            <p style={{ marginTop: '6px', fontSize: '0.84rem', color: 'var(--text-700)' }}>
              {product.description}
            </p>
          )}
        </div>
        <StatusBadge status={statusText} />
      </div>

      {/* Stock Health Metrics Section */}
      <div className="section">
        <div className="card card-pad">
          <div className="def-list">
            <div>
              <div className="dt">Current Available Stock</div>
              <div className="dd" style={{ fontSize: '1.25rem' }}>
                {product.currentQuantity} {product.unit || 'Pieces'}
              </div>
            </div>
            <div>
              <div className="dt">Minimum Threshold Level</div>
              <div className="dd">
                {product.minimumStockLevel} {product.unit || 'Pieces'}
              </div>
            </div>
            <div>
              <div className="dt">Stock Health Status</div>
              <div
                className="dd"
                style={{
                  color: isLowStock
                    ? 'var(--red-600)'
                    : isNearing
                    ? 'var(--amber-700)'
                    : 'var(--green-600)'
                }}
              >
                {isLowStock
                  ? `Below Minimum (${product.minimumStockLevel - product.currentQuantity} unit deficit)`
                  : isNearing
                  ? 'Near Minimum Threshold'
                  : 'Healthy / Available in Store'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Stock Register & Sheet References (SR1 / SR2 / SR3) */}
      <div className="section">
        <div className="section-head">
          <h2>Stock Register & Sheet References</h2>
          <span className="hint">Physical store ledger references (SR1 / SR2 / SR3 / CSSR1)</span>
        </div>
        <StockReferenceCard references={product.registerRefs} />
      </div>

      {/* Stock Movement History */}
      <div className="section">
        <div className="card">
          <div className="card-head">
            <h2>Stock Movement History (Purchases & Transfers)</h2>
            <span className="hint">All recorded purchase receipts and department issues</span>
          </div>
          <div className="table-wrap">
            {history.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No movement history"
                description="No purchase or department transfer transactions recorded for this product yet."
              />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction Type</th>
                    <th>Quantity</th>
                    <th>Stock Register</th>
                    <th>Department / Supplier</th>
                    <th>Performed By</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((txn) => {
                    const isPurchase = txn.type === 'PURCHASE';
                    return (
                      <tr key={txn._id || txn.transactionId}>
                        <td style={{ whiteSpace: 'nowrap' }}>{txn.date}</td>
                        <td>
                          <span className={isPurchase ? 'tag-in' : 'tag-out'}>
                            {txn.type}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: isPurchase ? 'var(--green-600)' : 'var(--red-600)' }}>
                            {isPurchase ? `+${txn.quantity}` : `-${txn.quantity}`}
                          </strong>
                        </td>
                        <td>
                          <span className="badge badge-blue">{txn.stockRegister || 'SR1'}</span>
                        </td>
                        <td>{txn.department || 'Store'}</td>
                        <td>{txn.performedBy || 'Admin'}</td>
                        <td className="small">{txn.remarks || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="section">
        <div className="card">
          <div className="card-head">
            <h2>Technical Remarks & Quality Inspection Notes</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddRemarkOpen(true)}
            >
              + Add Remark
            </Button>
          </div>
          <div className="card-pad" style={{ paddingTop: '14px' }}>
            {!product.remarks || product.remarks.length === 0 ? (
              <EmptyState
                icon="💬"
                title="No remarks recorded"
                description="Add technical observations, inspection reports, or restocking reminders."
              />
            ) : (
              product.remarks.map((rem, i) => (
                <div key={rem.id || i} className="remark">
                  <div className="remark-head">
                    <span className="who">{rem.author}</span>
                    <span className="when">{rem.date}</span>
                  </div>
                  <p>{rem.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Remark Modal */}
      <Modal
        isOpen={isAddRemarkOpen}
        onClose={() => setIsAddRemarkOpen(false)}
        title={`Add Technical Remark for ${product.name}`}
      >
        <form onSubmit={handleSaveRemark}>
          <div className="field">
            <label htmlFor="remark-author">Author / Designation</label>
            <input
              type="text"
              id="remark-author"
              value={remarkAuthor}
              onChange={(e) => setRemarkAuthor(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="remark-text">Remark / Technical Note *</label>
            <textarea
              id="remark-text"
              placeholder="e.g. Quality inspection observations, batch defect checking, storage notes..."
              rows={4}
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              required
            />
          </div>

          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setIsAddRemarkOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Remark
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal (Admin only) */}
      {isAdmin && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={product}
          onProductUpdated={(updated) => setProduct(updated)}
        />
      )}
    </Layout>
  );
};

export default ProductDetails;
