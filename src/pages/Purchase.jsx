import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import PurchaseForm from '../components/stock/PurchaseForm';
import { purchaseApi } from '../services/api';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export const Purchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [registerFilter, setRegisterFilter] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (registerFilter) params.stockRegister = registerFilter;

      const res = await purchaseApi.getPurchases(params);
      if (res.success) {
        setPurchases(res.purchases || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.purchases?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, registerFilter, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, registerFilter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handlePurchaseSuccess = (result) => {
    setSuccessToast(`Successfully recorded purchase of ${result.quantity} units for ${result.productName}!`);
    fetchPurchases();
    setTimeout(() => setSuccessToast(''), 5000);
  };

  const totalSpent = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalItemsReceived = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Purchase Intake (Stock IN)</h1>
          <p>Record newly purchased electrical goods, components, and replenishment stock.</p>
        </div>
      </div>

      <div className="content-area">
        {successToast && (
          <div
            style={{
              background: 'var(--green-50)',
              border: '1px solid var(--green-600)',
              color: 'var(--green-800)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <span>✓</span>
            <span>{successToast}</span>
          </div>
        )}

        <div className="grid-2col" style={{ alignItems: 'start', marginBottom: '32px' }}>
          {/* Form */}
          <div>
            <PurchaseForm onPurchaseSuccess={handlePurchaseSuccess} />
          </div>

          {/* Guidelines & Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <div className="card-head">
                <span className="card-title">Purchase Intake Summary</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div
                    style={{
                      background: 'var(--navy-50)',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--navy-100)'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Total Purchases Logged
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '4px' }}>
                      {totalItems}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--blue-50)',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--blue-100)'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Units on Page
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--blue-700)', marginTop: '4px' }}>
                      {totalItemsReceived}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    marginTop: '16px'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Page Procurement Value
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-700)', marginTop: '4px' }}>
                    ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <span className="card-title">Procurement Standard Operating Procedure</span>
              </div>
              <div className="card-body" style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Verify physical count against vendor Delivery Challan / Tax Invoice before recording.</li>
                  <li>Check stock register tag (<strong>SR1</strong> for general stock, <strong>SR2</strong> for specialized tools, <strong>SR3</strong> for consumable wiring).</li>
                  <li>Every purchase automatically generates an immutable audit record in <strong>Stock History</strong> and increments current warehouse stock.</li>
                  <li>Invoices must be handed over to Accounts department with the generated Purchase record reference.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Purchases List */}
        <div className="card">
          <div className="card-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <span className="card-title">Recent Purchase Logs</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search vendor, invoice, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  minWidth: '220px'
                }}
              />
              <select
                value={registerFilter}
                onChange={(e) => setRegisterFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem'
                }}
              >
                <option value="">All Registers</option>
                <option value="SR1">SR1</option>
                <option value="SR2">SR2</option>
                <option value="SR3">SR3</option>
                <option value="CSSR1">CSSR1</option>
              </select>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading && purchases.length === 0 ? (
              <Loading message="Loading purchase records..." />
            ) : purchases.length === 0 ? (
              <EmptyState
                icon="↧"
                title="No purchase logs found"
                description="No purchase transactions match your current filters."
              />
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Purchase Date</th>
                        <th>Invoice / DC No.</th>
                        <th>Product</th>
                        <th>Stock Register</th>
                        <th>Supplier / Vendor</th>
                        <th>Qty In</th>
                        <th>Unit Price</th>
                        <th>Total Value</th>
                        <th>Received By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((item) => (
                        <tr key={item._id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{item.purchaseDate}</td>
                          <td className="code" style={{ fontWeight: 700 }}>
                            {item.invoiceNumber || '—'}
                          </td>
                          <td>
                            <div className="cell-strong">{item.productName}</div>
                            <span className="code">{item.productCode}</span>
                          </td>
                          <td>
                            <span className="badge badge-blue">{item.stockRegister || 'SR1'}</span>
                          </td>
                          <td>{item.supplierName}</td>
                          <td>
                            <strong style={{ color: 'var(--green-700)' }}>
                              +{item.quantity} {item.unit || 'Units'}
                            </strong>
                          </td>
                          <td>₹{(item.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td>
                            <strong>₹{(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {item.receivedBy || 'Store Keeper'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Purchase;
