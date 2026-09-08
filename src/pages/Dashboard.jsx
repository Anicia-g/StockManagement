import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Loading from '../components/common/Loading';
import { analyticsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to connect to backend service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !data) {
    return (
      <Layout title="Dashboard" breadcrumb="Overview of electrical stock & inventory status">
        <Loading message="Loading real-time stock analytics..." />
      </Layout>
    );
  }

  const stats = data?.stats || {
    totalProducts: 0,
    currentStock: 0,
    lowStockCount: 0,
    pendingIndents: 0,
    todayPurchased: 0,
    todayTransferred: 0
  };

  const lowStockItems = data?.lowStockItems || [];
  const recentActivity = data?.recentActivity || [];
  const recentIndents = data?.recentIndents || [];

  return (
    <Layout title="Dashboard" breadcrumb="Overview of electrical stock & inventory status">
      {error && (
        <div className="alert-box" style={{ marginBottom: '18px' }}>
          ⚠ {error}
        </div>
      )}

      {/* Dynamic Summary Metric Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <StatCard
          label="Total Products"
          figure={stats.totalProducts}
          icon="▦"
          variant="blue"
          onClick={() => navigate('/products')}
        />
        <StatCard
          label="Current Stock Units"
          figure={stats.currentStock.toLocaleString()}
          icon="✓"
          variant="green"
          onClick={() => navigate('/products')}
        />
        <StatCard
          label="Low Stock Items"
          figure={stats.lowStockCount}
          icon="!"
          variant="red"
          onClick={() => navigate(isAdmin ? '/low-stock' : '/products')}
        />
        <StatCard
          label="Pending Indents"
          figure={stats.pendingIndents}
          icon="▧"
          variant="amber"
          onClick={() => navigate('/indents')}
        />
        {isAdmin && (
          <>
            <StatCard
              label="Today's Purchased"
              figure={`+${stats.todayPurchased}`}
              icon="↧"
              variant="green"
              onClick={() => navigate('/purchases')}
            />
            <StatCard
              label="Today's Transferred"
              figure={`-${stats.todayTransferred}`}
              icon="↥"
              variant="blue"
              onClick={() => navigate('/transfers')}
            />
          </>
        )}
      </div>

      {/* Grid: Low Stock Alert Items & Quick Actions / Recent Indents */}
      <div className="grid-2" style={{ marginBottom: '22px' }}>
        {/* Low Stock Items Card */}
        <div className="card">
          <div className="card-head">
            <h2>Low Stock Items</h2>
            {isAdmin && (
              <Link to="/low-stock" className="small">
                View all deficits →
              </Link>
            )}
          </div>
          <div className="table-wrap">
            {lowStockItems.length === 0 ? (
              <EmptyState
                icon="✓"
                title="All stock levels healthy"
                description="No items are currently below minimum stock requirements."
              />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock Register</th>
                    <th>Available Qty</th>
                    <th>Minimum Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item._id || item.id}>
                      <td>
                        <Link to={`/products/${item._id || item.id}`} className="cell-strong">
                          {item.name}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-blue">{item.stockRegister || 'SR1'}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--red-600)' }}>
                          {item.currentQuantity} {item.unit}
                        </strong>
                      </td>
                      <td>
                        {item.minimumStockLevel} {item.unit}
                      </td>
                      <td>
                        <StatusBadge status="Low Stock" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions & Recent Indents */}
        <div className="card">
          <div className="card-head">
            <h2>{isAdmin ? 'Quick Stock Operations' : 'Department Indent Portal'}</h2>
          </div>
          <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p className="small muted">
              {isAdmin
                ? 'Record intake purchases, issue stock transfers, or process department online indents:'
                : `Welcome, ${user?.name}. Raise material requests or track department indents:`}
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => navigate('/purchases')}
                  >
                    ↧ Record Purchase
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => navigate('/transfers')}
                  >
                    ↥ Issue Transfer
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => navigate('/indents/create')}
                  >
                    ＋ Create Online Indent
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => navigate('/indents')}
                  >
                    ▧ View My Indents
                  </button>
                </>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '8px' }}>
                Recent Indent Requests:
              </div>
              {recentIndents.length === 0 ? (
                <div className="small muted">No recent indents submitted.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recentIndents.slice(0, 3).map((ind) => (
                    <div
                      key={ind._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem',
                        padding: '6px 8px',
                        background: 'var(--blue-50)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <div>
                        <Link to={`/indents/${ind._id}`} style={{ fontWeight: 700 }}>
                          {ind.indentNumber}
                        </Link>{' '}
                        <span style={{ color: 'var(--text-500)', fontSize: '0.74rem' }}>
                          ({ind.department})
                        </span>
                      </div>
                      <StatusBadge status={ind.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Stock Activity (Purchases & Transfers) */}
      <div className="card">
        <div className="card-head">
          <h2>Recent Stock Activity (Purchases & Transfers)</h2>
          {isAdmin && (
            <Link to="/history" className="small">
              View full audit history →
            </Link>
          )}
        </div>
        <div className="table-wrap">
          {recentActivity.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No recent transactions"
              description="Stock purchases and department transfers will appear here."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Stock Register</th>
                  <th>Transaction Type</th>
                  <th>Quantity</th>
                  <th>Department / Vendor</th>
                  <th>Reference ID</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((txn) => {
                  const isPurchase = txn.type === 'PURCHASE';
                  return (
                    <tr key={txn._id || txn.transactionId}>
                      <td>{txn.date}</td>
                      <td>
                        <Link to={`/products/${txn.productId || txn.productCode}`} className="cell-strong">
                          {txn.productName}
                        </Link>
                      </td>
                      <td>
                        <span className="badge badge-blue">{txn.stockRegister || 'SR1'}</span>
                      </td>
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
                      <td>{txn.department}</td>
                      <td className="code">{txn.referenceId || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
