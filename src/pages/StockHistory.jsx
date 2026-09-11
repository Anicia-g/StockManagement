import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import StockHistoryTable from '../components/stock/StockHistoryTable';
import SearchBar from '../components/common/SearchBar';
import { historyApi } from '../services/api';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export const StockHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [registerFilter, setRegisterFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [counts, setCounts] = useState({ totalPurchases: 0, totalTransfers: 0 });

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (searchTerm) params.search = searchTerm;
      if (typeFilter) params.type = typeFilter;
      if (registerFilter) params.stockRegister = registerFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await historyApi.getStockHistory(params);
      if (res.success) {
        setHistory(res.history || res.transactions || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.history?.length || 0));
        setCounts({
          totalPurchases: res.totalPurchases !== undefined ? res.totalPurchases : (res.history?.filter(h => h.type === 'PURCHASE').length || 0),
          totalTransfers: res.totalTransfers !== undefined ? res.totalTransfers : (res.history?.filter(h => h.type === 'TRANSFER').length || 0)
        });
      }
    } catch (err) {
      console.error('Failed to fetch stock history:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, registerFilter, startDate, endDate, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, registerFilter, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setRegisterFilter('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    typeFilter !== '' ||
    registerFilter !== '' ||
    startDate !== '' ||
    endDate !== '';

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Stock History</h1>
          <p>Comprehensive ledger of all recorded purchases and departmental transfers.</p>
        </div>
      </div>

      <div className="content-area">
        {/* Metric Cards */}
        <div className="grid-3col" style={{ marginBottom: '24px' }}>
          <div className="metric-card">
            <div className="metric-label">Total Transactions</div>
            <div className="metric-value">{totalItems}</div>
            <div className="metric-sub">Matching current filters</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Purchases</div>
            <div className="metric-value" style={{ color: 'var(--green-700)' }}>
              {counts.totalPurchases}
            </div>
            <div className="metric-sub">Recorded stock purchases</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Transfers</div>
            <div className="metric-value" style={{ color: 'var(--blue-700)' }}>
              {counts.totalTransfers}
            </div>
            <div className="metric-sub">Departmental stock transfers</div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search product code, name, ref..."
                style={{ flex: '1 1 200px' }}
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem'
                }}
              >
                <option value="">All Movement Types</option>
                <option value="PURCHASE">Purchase</option>
                <option value="TRANSFER">Transfer</option>
              </select>

              <select
                value={registerFilter}
                onChange={(e) => setRegisterFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={handleResetFilters}
                  style={{ color: 'var(--blue-700)', fontWeight: 600 }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Stock Movement Log</span>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Showing {history.length} of {totalItems} records
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading && history.length === 0 ? (
              <Loading message="Loading stock history..." />
            ) : (
              <>
                <StockHistoryTable transactions={history} />
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

export default StockHistory;
