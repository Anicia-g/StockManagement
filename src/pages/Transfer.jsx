import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import TransferForm from '../components/stock/TransferForm';
import { transferApi } from '../services/api';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

export const Transfer = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (departmentFilter) params.department = departmentFilter;

      const res = await transferApi.getTransfers(params);
      if (res.success) {
        setTransfers(res.transfers || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.transfers?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, departmentFilter, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter]);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  const handleTransferSuccess = (result) => {
    setSuccessToast(`Successfully issued ${result.quantity} units of ${result.productName} to ${result.department}!`);
    fetchTransfers();
    setTimeout(() => setSuccessToast(''), 5000);
  };

  const totalUnitsTransferred = transfers.reduce((sum, t) => sum + (t.quantity || 0), 0);

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Stock Transfer / Issue (Stock OUT)</h1>
          <p>Directly issue materials or fulfill department requisitions with live stock deduction.</p>
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
          {/* Transfer Form */}
          <div>
            <TransferForm onTransferSuccess={handleTransferSuccess} />
          </div>

          {/* Quick Metrics & Rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <div className="card-head">
                <span className="card-title">Transfer Statistics</span>
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
                      Total Issues Logged
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '4px' }}>
                      {totalItems}
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--amber-50)',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--amber-100)'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Units on Page
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--amber-800)', marginTop: '4px' }}>
                      {totalUnitsTransferred}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <span className="card-title">Stock Outflow Policy</span>
              </div>
              <div className="card-body" style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>Transferring stock immediately decreases current warehouse inventory.</li>
                  <li>Cannot transfer more quantity than currently available in store.</li>
                  <li>Online faculty requisitions should be reviewed and approved via the <strong>Indent Requests</strong> page.</li>
                  <li>All outgoing items are recorded in the <strong>Stock History</strong> audit log with department tags.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer History Table */}
        <div className="card">
          <div className="card-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <span className="card-title">Recent Outgoing Transfer Logs</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search department, product..."
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
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem'
                }}
              >
                <option value="">All Departments</option>
                <option value="CSE Department">CSE Department</option>
                <option value="EEE Department">EEE Department</option>
                <option value="ECE Department">ECE Department</option>
                <option value="Mechanical Department">Mechanical Department</option>
                <option value="Civil Department">Civil Department</option>
                <option value="IT Department">IT Department</option>
                <option value="General Maintenance">General Maintenance</option>
              </select>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading && transfers.length === 0 ? (
              <Loading message="Loading transfer records..." />
            ) : transfers.length === 0 ? (
              <EmptyState
                icon="↥"
                title="No transfer logs found"
                description="No stock transfers match your current filter parameters."
              />
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Transfer Date</th>
                        <th>Department / Lab</th>
                        <th>Product</th>
                        <th>Stock Register</th>
                        <th>Qty Issued</th>
                        <th>Indent Reference</th>
                        <th>Issued By</th>
                        <th>Purpose / Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((item) => (
                        <tr key={item._id}>
                          <td style={{ whiteSpace: 'nowrap' }}>{item.transferDate}</td>
                          <td>
                            <strong>{item.department}</strong>
                            {item.receivedByPerson && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Req by: {item.receivedByPerson}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="cell-strong">{item.productName}</div>
                            <span className="code">{item.productCode}</span>
                          </td>
                          <td>
                            <span className="badge badge-blue">{item.stockRegister || 'SR1'}</span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--amber-700)' }}>
                              -{item.quantity} {item.unit || 'Units'}
                            </strong>
                          </td>
                          <td>
                            {item.indentNumber ? (
                              <span className="code" style={{ fontWeight: 700, color: 'var(--blue-700)' }}>
                                {item.indentNumber}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Direct Issue</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>{item.issuedBy || 'Store Keeper'}</td>
                          <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.remarks || '—'}
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

export default Transfer;
