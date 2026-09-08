import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { analyticsApi } from '../services/api';
import Loading from '../components/common/Loading';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'];
const REGISTER_COLORS = {
  SR1: '#2563eb',
  SR2: '#10b981',
  SR3: '#f59e0b',
  CSSR1: '#8b5cf6'
};

export const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getAnalyticsOverview();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <Layout>
        <Loading message="Aggregating inventory & stock analytics..." />
      </Layout>
    );
  }

  const { inventory, purchases, transfers, indents, trends } = data;

  const indentPieData = [
    { name: 'Pending', value: indents.pending, color: '#f59e0b' },
    { name: 'Approved', value: indents.approved, color: '#3b82f6' },
    { name: 'Completed', value: indents.completed, color: '#10b981' },
    { name: 'Rejected', value: indents.rejected, color: '#ef4444' }
  ].filter((item) => item.value > 0);

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Stock & Movement Analytics</h1>
          <p>Institutional analytics dashboard displaying inventory health, stock turnover, and department distribution.</p>
        </div>
      </div>

      <div className="content-area">
        {/* KPI Cards */}
        <div className="grid-4col" style={{ marginBottom: '24px' }}>
          <div className="metric-card">
            <div className="metric-label">Total Inventory Units</div>
            <div className="metric-value">{inventory.totalStock?.toLocaleString('en-IN')}</div>
            <div className="metric-sub">Across {inventory.totalProducts} registered products</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Monthly Purchases (IN)</div>
            <div className="metric-value" style={{ color: 'var(--green-700)' }}>
              +{purchases.monthlyPurchases?.toLocaleString('en-IN')}
            </div>
            <div className="metric-sub">This month’s replenishment units</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Monthly Transfers (OUT)</div>
            <div className="metric-value" style={{ color: 'var(--amber-700)' }}>
              -{transfers.monthlyTransfers?.toLocaleString('en-IN')}
            </div>
            <div className="metric-sub">Units issued to labs & departments</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Deficit Stock Alerts</div>
            <div
              className="metric-value"
              style={{ color: inventory.lowStockCount > 0 ? 'var(--red-600)' : 'var(--green-700)' }}
            >
              {inventory.lowStockCount}
            </div>
            <div className="metric-sub">
              {inventory.criticalStockCount > 0
                ? `${inventory.criticalStockCount} items at critical level`
                : 'All items above critical threshold'}
            </div>
          </div>
        </div>

        {/* Chart Row 1: 14-Day Purchase vs Transfer Trend */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <span className="card-title">Stock Flow Trends (14-Day Inflow vs Outflow)</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Daily unit volume of purchases (IN) vs department transfers (OUT)
            </span>
          </div>
          <div className="card-body" style={{ height: '320px', padding: '16px 20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Bar dataKey="purchases" name="Purchases (Stock IN)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="transfers" name="Transfers (Stock OUT)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Row 2: Department-wise Transfers & Stock Register Breakdown */}
        <div className="grid-2col" style={{ marginBottom: '24px' }}>
          {/* Department breakdown */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Department Consumption Breakdown</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Units issued by department
              </span>
            </div>
            <div className="card-body" style={{ height: '300px', padding: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={transfers.departmentTransfers || []}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis type="category" dataKey="department" stroke="#64748b" fontSize={12} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="quantity" name="Units Consumed" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stock Register Distribution */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Stock Register Distribution (SR1 / SR2 / SR3)</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Total inventory allocated per Register
              </span>
            </div>
            <div className="card-body" style={{ height: '300px', padding: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventory.registerDistribution || []}
                    dataKey="stock"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {inventory.registerDistribution?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={REGISTER_COLORS[entry.name] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} Units`, `Register ${name}`]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart Row 3: Category Inventory & Indent Status Distribution */}
        <div className="grid-2col">
          {/* Category breakdown */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Inventory Stock by Category</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Units per component classification
              </span>
            </div>
            <div className="card-body" style={{ height: '280px', padding: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventory.categoryDistribution || []} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="stock" name="Current Stock Units" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Indent Statuses */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Online Requisitions Status</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {indents.total} total indent requests
              </span>
            </div>
            <div className="card-body" style={{ height: '280px', padding: '16px' }}>
              {indentPieData.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  No indent data recorded yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={indentPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {indentPieData.map((entry, index) => (
                        <Cell key={`cell-ind-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} Indents`, name]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
