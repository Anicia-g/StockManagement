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
      const res = await productApi.getProductDetails(id);
      if (res.success && res.product) {
        const prod = res.product;
        // Merge references
        if (res.references && res.references.length > 0) {
          prod.registerRefs = res.references.map(r => ({
            sheet: r.sheet || r.stockDocument || r.stockDocumentName,
            page: r.page || r.pageNumber,
            note: r.referenceNote
          }));
        }
        // Merge remarks
        if (res.remarks && res.remarks.length > 0) {
          prod.remarks = res.remarks.map(rem => ({
            id: rem._id || rem.id,
            author: rem.enteredBy || rem.author || 'Store Staff',
            date: rem.enteredAt ? new Date(rem.enteredAt).toISOString().split('T')[0] : (rem.date || new Date().toISOString().split('T')[0]),
            text: rem.remark || rem.text
          }));
        }
        setProduct(prod);
        setHistory(res.history || []);
      } else {
        // Fallback to getProductById
        const singleRes = await productApi.getProductById(id);
        if (singleRes.success) {
          setProduct(singleRes.product);
          const histRes = await historyApi.getStockHistory({ search: singleRes.product.productCode });
          if (histRes.success) {
            setHistory(histRes.transactions || []);
          }
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

  const minStock = product.minimumQuantity !== undefined ? product.minimumQuantity : (product.minimumStockLevel || 5);
  const curQty = product.currentQuantity !== undefined ? product.currentQuantity : (product.currentStock || 0);
  const isLowStock = curQty <= minStock;
  const isNearing = !isLowStock && curQty <= minStock + 2;
  const statusText = isLowStock ? 'Low Stock' : isNearing ? 'Nearing Limit' : 'Available';

  const handleSaveRemark = async (e) => {
    e.preventDefault();
    if (!remarkText.trim()) return;

    try {
      const res = await productApi.addRemark(product._id || product.id, {
        remark: remarkText.trim(),
        text: remarkText.trim(),
        author: remarkAuthor
      });
      if (res.success) {
        const newRem = {
          id: res.remark?._id || `rem-${Date.now()}`,
          author: remarkAuthor,
          date: new Date().toISOString().split('T')[0],
          text: remarkText.trim()
        };
        setProduct((prev) => ({
          ...prev,
          remarks: [newRem, ...(prev.remarks || [])]
        }));
        setRemarkText('');
        setIsAddRemarkOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save remark.');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${product.productName || product.name}" (${product.productCode})?`
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
      breadcrumb={`Products / ${product.productName || product.name} (${product.productCode})`}
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
              🗑 Deactivate Product
            </Button>
          </div>
        )}
      </div>

      <div className="detail-head">
        <div>
          <h1 style={{ marginBottom: '2px' }}>{product.productName || product.name}</h1>
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
                {curQty} {product.unit || 'Pieces'}
              </div>
            </div>
            <div>
              <div className="dt">Minimum Threshold Level</div>
              <div className="dd">
                {minStock} {product.unit || 'Pieces'}
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
                  ? `Below Minimum (${minStock - curQty} unit deficit)`
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
            <h2>Stock Movement History (Purchases & Issues)</h2>
            <span className="hint">All recorded receipts and department issues</span>
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
                    <th>Department / Supplier</th>
                    <th>Recorded By</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((txn) => {
                    const isIncoming = txn.type === 'IN' || txn.type === 'PURCHASE' || txn.transactionType === 'IN' || txn.transactionType === 'PURCHASE';
                    return (
                      <tr key={txn._id || txn.id || txn.transactionId}>
                        <td style={{ whiteSpace: 'nowrap' }}>{txn.date}</td>
                        <td>
                          <span className={isIncoming ? 'tag-in' : 'tag-out'}>
                            {isIncoming ? 'IN' : 'OUT'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: isIncoming ? 'var(--green-600)' : 'var(--red-600)' }}>
                            {isIncoming ? `+${txn.quantity}` : `-${txn.quantity}`}
                          </strong>
                        </td>
                        <td>{txn.department || 'Store'}</td>
                        <td>{txn.recordedBy || txn.performedBy || 'Admin'}</td>
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
                <div key={rem.id || rem._id || i} className="remark">
                  <div className="remark-head">
                    <span className="who">{rem.author || rem.enteredBy}</span>
                    <span className="when">{rem.date || (rem.enteredAt ? new Date(rem.enteredAt).toISOString().split('T')[0] : '')}</span>
                  </div>
                  <p>{rem.text || rem.remark}</p>
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
        title={`Add Technical Remark for ${product.productName || product.name}`}
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
            <Button variant="outline" type="button" onClick={() => setIsAddRemarkOpen(false)}>
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
