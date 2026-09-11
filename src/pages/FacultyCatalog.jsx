import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import { productApi, masterDataApi, indentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const FacultyCatalog = () => {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [totalItems, setTotalItems] = useState(0);

  // Booking / Requisition Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Fetch categories from MongoDB
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await masterDataApi.getCategories();
        if (res?.success && res.categories?.length > 0) {
          setCategories(res.categories.map(c => c.name));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch products from MongoDB Atlas
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
        status: 'ACTIVE'
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;

      const res = await productApi.getProducts(params);
      if (res.success) {
        setProducts(res.products || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.products?.length || 0));
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleOpenBookModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setPurpose('');
    setRemarks('');
    setBookingError('');
    setIsBookModalOpen(true);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setBookingError('Please enter a valid quantity greater than 0.');
      return;
    }
    if (!purpose.trim()) {
      setBookingError('Please state the purpose of your requirement.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        department: user?.department || 'Electrical & Electronics Engineering',
        requestingDepartment: user?.department || 'Electrical & Electronics Engineering',
        purpose: purpose.trim(),
        remarks: remarks.trim(),
        items: [
          {
            productId: selectedProduct._id || selectedProduct.id,
            productCode: selectedProduct.productCode,
            productName: selectedProduct.productName || selectedProduct.name,
            unit: selectedProduct.unit || 'Pieces',
            requestedQuantity: qty,
            quantityRequired: qty
          }
        ]
      };

      const res = await indentApi.createIndent(payload);
      if (res.success) {
        fetchNotifications();
        setIsBookModalOpen(false);
        setToastMessage(`Requisition ${res.indent?.indentNumber || ''} submitted successfully!`);
        setTimeout(() => setToastMessage(''), 6000);
        fetchProducts();
      } else {
        setBookingError(res.message || 'Failed to submit request.');
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title="Product Catalog"
      breadcrumb="Browse store items and request materials for departmental requirements"
    >
      {toastMessage && (
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
          <span>✓ {toastMessage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/faculty/requests')}
            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
          >
            View My Requests →
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card card-pad" style={{ marginBottom: '22px' }}>
        <div
          style={{
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ flex: '1 1 280px', minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search by product name or code (e.g. LED, Switch, EL-BULB)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-700)' }}>
              Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                background: 'var(--white)'
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <Loading message="Loading product catalog from store database..." />
      ) : products.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No products available"
          description="No store products matched your search or category filter."
        />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '18px',
              marginBottom: '24px'
            }}
          >
            {products.map((p) => {
              const minStock = p.minimumQuantity !== undefined ? p.minimumQuantity : (p.minimumStockLevel || 5);
              const isLowStock = p.currentQuantity <= minStock;
              const isOutOfStock = p.currentQuantity === 0;
              const pageNumber = p.pageNumber || p.registerRefs?.[0]?.page || 1;

              return (
                <div
                  key={p._id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '20px',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    border: isLowStock ? '1px solid #f0c6c6' : '1px solid var(--border)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          color: 'var(--blue-700)',
                          background: 'var(--blue-50)',
                          padding: '3px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {p.productCode}
                      </span>
                      <StatusBadge status={isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Available'} />
                    </div>

                    <h3 style={{ fontSize: '1.02rem', marginBottom: '6px', color: 'var(--navy-950)' }}>
                      {p.productName || p.name}
                    </h3>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-500)', marginBottom: '12px' }}>
                      Category: <strong>{p.category}</strong> · Unit: <strong>{p.unit || 'Pieces'}</strong>
                    </div>

                    {p.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-700)', marginBottom: '14px', lineClamp: 2 }}>
                        {p.description}
                      </p>
                    )}

                    {/* Faculty-safe page/location reference without internal SR administration info */}
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-700)',
                        background: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        marginBottom: '16px'
                      }}
                    >
                      📍 Location Index: <strong>Page {pageNumber}</strong>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-500)', textTransform: 'uppercase' }}>Available Stock</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: isLowStock ? 'var(--red-600)' : 'var(--navy-900)' }}>
                        {p.currentQuantity} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>{p.unit || 'pcs'}</span>
                      </div>
                    </div>

                    <Button
                      variant={isOutOfStock ? 'outline' : 'primary'}
                      size="sm"
                      disabled={isOutOfStock}
                      onClick={() => handleOpenBookModal(p)}
                    >
                      {isOutOfStock ? 'Out of Stock' : 'Request / Book →'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / pageSize)}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </>
      )}

      {/* Book / Request Product Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          title={`Request Item: ${selectedProduct.productName || selectedProduct.name}`}
          maxWidth="540px"
        >
          <form onSubmit={handleBookSubmit}>
            {bookingError && (
              <div className="login-error-box" style={{ marginBottom: '14px' }}>
                ⚠ {bookingError}
              </div>
            )}

            <div
              style={{
                background: 'var(--blue-50)',
                border: '1px solid var(--blue-100)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                fontSize: '0.84rem',
                color: 'var(--blue-700)',
                marginBottom: '18px'
              }}
            >
              <div><strong>Product Code:</strong> {selectedProduct.productCode}</div>
              <div><strong>Category:</strong> {selectedProduct.category} · <strong>Unit:</strong> {selectedProduct.unit}</div>
              <div><strong>Available in Central Store:</strong> {selectedProduct.currentQuantity} {selectedProduct.unit}</div>
            </div>

            <div className="field">
              <label htmlFor="req-qty">Quantity Required *</label>
              <input
                type="number"
                id="req-qty"
                min="1"
                max={selectedProduct.currentQuantity > 0 ? selectedProduct.currentQuantity : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-500)' }}>
                Maximum recommended based on current stock: {selectedProduct.currentQuantity} {selectedProduct.unit}
              </span>
            </div>

            <div className="field">
              <label htmlFor="req-purpose">Purpose / Utilization Reason *</label>
              <textarea
                id="req-purpose"
                rows="3"
                placeholder="e.g. For Power Electronics Lab experiment setup / replacement of damaged classroom switch"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="req-remarks">Additional Remarks (Optional)</label>
              <input
                type="text"
                id="req-remarks"
                placeholder="e.g. Urgently required for university inspection next Tuesday"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button type="button" variant="outline" onClick={() => setIsBookModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Submitting to Store...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
};

export default FacultyCatalog;
