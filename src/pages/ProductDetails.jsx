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
import { productApi, historyApi, indentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { fetchNotifications } = useNotifications();

  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin controls state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddRemarkOpen, setIsAddRemarkOpen] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [remarkAuthor, setRemarkAuthor] = useState(user?.name ? `${user.name} (Admin)` : 'Admin');

  // Faculty booking modal state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookQuantity, setBookQuantity] = useState(1);
  const [bookPurpose, setBookPurpose] = useState('');
  const [bookRemarks, setBookRemarks] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [bookError, setBookError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const loadProductData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productApi.getProductDetails(id);
      if (res.success && res.product) {
        const prod = res.product;
        if (res.references && res.references.length > 0) {
          prod.registerRefs = res.references.map(r => ({
            sheet: r.sheet || r.stockDocument || r.stockDocumentName,
            page: r.page || r.pageNumber,
            note: r.referenceNote
          }));
        }
        if (res.remarks && res.remarks.length > 0) {
          prod.remarks = res.remarks.map(rem => ({
            id: rem._id || rem.id,
            author: rem.enteredBy || rem.author || 'Admin',
            date: rem.enteredAt ? new Date(rem.enteredAt).toISOString().split('T')[0] : (rem.date || new Date().toISOString().split('T')[0]),
            text: rem.remark || rem.text
          }));
        }
        setProduct(prod);
        setHistory(res.history || []);
      } else {
        const singleRes = await productApi.getProductById(id);
        if (singleRes.success) {
          setProduct(singleRes.product);
          if (isAdmin) {
            const histRes = await historyApi.getStockHistory({ search: singleRes.product.productCode });
            if (histRes.success) {
              setHistory(histRes.transactions || []);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
      setError('Product not found.');
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  if (loading && !product) {
    return (
      <Layout title="Product Details" breadcrumb="Products / Loading">
        <Loading message="Fetching product specifications and stock details from database..." />
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
              <Link to={isAdmin ? "/admin/products" : "/faculty/catalog"} className="btn-primary">
                ← Back to {isAdmin ? 'Products List' : 'Product Catalog'}
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
      `Are you sure you want to delete or deactivate "${product.productName || product.name}" (${product.productCode})?`
    );
    if (!confirmed) return;

    try {
      const res = await productApi.deleteProduct(product._id || product.id);
      if (res.success) {
        alert(res.message);
        navigate('/admin/products');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookError('');

    const qty = Number(bookQuantity);
    if (!qty || qty <= 0) {
      setBookError('Please enter a valid quantity.');
      return;
    }
    if (!bookPurpose.trim()) {
      setBookError('Please state the purpose of requirement.');
      return;
    }

    setSubmittingRequest(true);
    try {
      const payload = {
        department: user?.department || 'Electrical & Electronics Engineering',
        requestingDepartment: user?.department || 'Electrical & Electronics Engineering',
        purpose: bookPurpose.trim(),
        remarks: bookRemarks.trim(),
        items: [
          {
            productId: product._id,
            productCode: product.productCode,
            productName: product.productName || product.name,
            unit: product.unit || 'Pieces',
            requestedQuantity: qty,
            quantityRequired: qty
          }
        ]
      };

      const res = await indentApi.createIndent(payload);
      if (res.success) {
        fetchNotifications();
        setIsBookModalOpen(false);
        setSuccessToast(`Indent ${res.indent?.indentNumber} created successfully!`);
        setTimeout(() => setSuccessToast(''), 5000);
      }
    } catch (err) {
      setBookError(err.response?.data?.message || err.message || 'Failed to submit indent.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <Layout
      title="Product Details"
      breadcrumb={`${isAdmin ? 'Inventory' : 'Catalog'} / ${product.productName || product.name} (${product.productCode})`}
    >
      {successToast && (
        <div
          style={{
            background: 'var(--green-100)',
            border: '1px solid var(--green-600)',
            color: 'var(--green-700)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 600
          }}
        >
          <span>✓ {successToast}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/faculty/requests')}
          >
            View My Requests →
          </Button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <Link to={isAdmin ? "/admin/products" : "/faculty/catalog"} className="back-link" style={{ marginBottom: 0 }}>
          ← Back to {isAdmin ? 'Products List' : 'Product Catalog'}
        </Link>

        {/* ADMIN ACTIONS */}
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
              🗑 Delete / Deactivate
            </Button>
          </div>
        )}

        {/* FACULTY ACTION */}
        {!isAdmin && (
          <Button
            variant="primary"
            onClick={() => setIsBookModalOpen(true)}
            disabled={curQty <= 0}
          >
            {curQty <= 0 ? 'Out of Stock' : 'Request / Book this Item →'}
          </Button>
        )}
      </div>

      <div className="detail-head">
        <div>
          <h1 style={{ marginBottom: '2px' }}>{product.productName || product.name}</h1>
          <span className="code">
            {product.productCode} · Category: <strong>{product.category}</strong> · Unit: <strong>{product.unit || 'Pieces'}</strong>
          </span>
          {product.description && (
            <p style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--text-700)' }}>
              {product.description}
            </p>
          )}
        </div>
        <StatusBadge status={statusText} />
      </div>

      {/* Stock Metrics Section */}
      <div className="section">
        <div className="card card-pad">
          <div className="def-list">
            <div>
              <div className="dt">Current Available Stock</div>
              <div className="dd" style={{ fontSize: '1.35rem', fontWeight: 700, color: isLowStock ? 'var(--red-600)' : 'var(--navy-900)' }}>
                {curQty} {product.unit || 'Pieces'}
              </div>
            </div>
            {isAdmin && (
              <div>
                <div className="dt">Minimum Threshold Level</div>
                <div className="dd">
                  {minStock} {product.unit || 'Pieces'}
                </div>
              </div>
            )}
            <div>
              <div className="dt">Location / Catalog Index</div>
              <div className="dd">
                Page {product.pageNumber || product.registerRefs?.[0]?.page || 1}
              </div>
            </div>
            <div>
              <div className="dt">Availability Status</div>
              <div
                className="dd"
                style={{
                  color: isLowStock
                    ? 'var(--red-600)'
                    : isNearing
                    ? 'var(--amber-700)'
                    : 'var(--green-600)',
                  fontWeight: 600
                }}
              >
                {isLowStock
                  ? 'Low Stock in Central Store'
                  : isNearing
                  ? 'Near Minimum Threshold'
                  : 'Available in Central Store'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* ADMIN-ONLY INTERNAL STOCK MANAGEMENT & REGISTERS                 */}
      {/* ================================================================= */}
      {isAdmin && (
        <>
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
                <span className="hint">All recorded receipts and department issues in MongoDB</span>
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
                        <th>Type</th>
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
        </>
      )}

      {/* Admin Add Remark Modal */}
      {isAdmin && (
        <Modal
          isOpen={isAddRemarkOpen}
          onClose={() => setIsAddRemarkOpen(false)}
          title={`Add Technical Remark for ${product.productName || product.name}`}
        >
          <form onSubmit={handleSaveRemark}>
            <div className="field">
              <label htmlFor="remark-author">Author</label>
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
                rows="4"
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setIsAddRemarkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save to Database
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin Edit Modal */}
      {isAdmin && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={product}
          onProductUpdated={(updated) => {
            setProduct(updated);
            loadProductData();
          }}
        />
      )}

      {/* Faculty Booking Modal */}
      {!isAdmin && (
        <Modal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          title={`Request Item: ${product.productName || product.name}`}
        >
          <form onSubmit={handleBookSubmit}>
            {bookError && (
              <div className="login-error-box" style={{ marginBottom: '14px' }}>
                ⚠ {bookError}
              </div>
            )}

            <div
              style={{
                background: 'var(--blue-50)',
                border: '1px solid var(--blue-100)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                fontSize: '0.84rem',
                color: 'var(--blue-700)',
                marginBottom: '16px'
              }}
            >
              <div><strong>Code:</strong> {product.productCode} · <strong>Unit:</strong> {product.unit}</div>
              <div><strong>Available Stock:</strong> {product.currentQuantity} {product.unit}</div>
            </div>

            <div className="field">
              <label htmlFor="modal-book-qty">Quantity Required *</label>
              <input
                type="number"
                id="modal-book-qty"
                min="1"
                max={product.currentQuantity > 0 ? product.currentQuantity : undefined}
                value={bookQuantity}
                onChange={(e) => setBookQuantity(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="modal-book-purpose">Purpose / Utilization Reason *</label>
              <textarea
                id="modal-book-purpose"
                rows="3"
                placeholder="State the requirement reason..."
                value={bookPurpose}
                onChange={(e) => setBookPurpose(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="modal-book-remarks">Remarks (Optional)</label>
              <input
                type="text"
                id="modal-book-remarks"
                placeholder="Optional notes..."
                value={bookRemarks}
                onChange={(e) => setBookRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <Button type="button" variant="outline" onClick={() => setIsBookModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submittingRequest}>
                {submittingRequest ? 'Submitting...' : 'Submit Requisition'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default ProductDetails;
