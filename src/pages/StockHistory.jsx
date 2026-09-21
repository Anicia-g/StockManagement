import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import StockHistoryTable from '../components/stock/StockHistoryTable';
import { historyApi, masterDataApi } from '../services/api';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export const StockHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter form states (interactive inputs)
  const [searchInput, setSearchInput] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [registerInput, setRegisterInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  const [fromDateInput, setFromDateInput] = useState('');
  const [toDateInput, setToDateInput] = useState('');

  // Applied filter states (passed to API queries)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    type: '',
    register: '',
    department: '',
    startDate: '',
    endDate: ''
  });

  // Department options for dropdown
  const [departments, setDepartments] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [counts, setCounts] = useState({ totalPurchases: 0, totalTransfers: 0 });

  // Load department list for the filter dropdown
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await masterDataApi.getDepartments();
        if (res.success && res.departments) {
          setDepartments(res.departments);
        }
      } catch (err) {
        console.error('Failed to load departments for filter:', err);
      }
    };
    loadDepartments();
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (appliedFilters.search) params.search = appliedFilters.search;
      if (appliedFilters.type) params.type = appliedFilters.type;
      if (appliedFilters.register) params.stockRegister = appliedFilters.register;
      if (appliedFilters.department) params.department = appliedFilters.department;
      if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
      if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;

      const res = await historyApi.getStockHistory(params);
      if (res && res.success) {
        setHistory(res.history || res.transactions || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.history?.length || 0));
        setCounts({
          totalPurchases: res.totalPurchases !== undefined ? res.totalPurchases : (res.history?.filter((h) => (h.type || h.transactionType) === 'PURCHASE').length || 0),
          totalTransfers: res.totalTransfers !== undefined ? res.totalTransfers : (res.history?.filter((h) => (h.type || h.transactionType) === 'TRANSFER').length || 0)
        });
      } else {
        throw new Error(res?.message || 'Failed to fetch stock movement records');
      }
    } catch (err) {
      console.error('Failed to fetch stock history:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage, pageSize]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    setAppliedFilters({
      search: searchInput.trim(),
      type: typeInput,
      register: registerInput,
      department: departmentInput,
      startDate: fromDateInput,
      endDate: toDateInput
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setTypeInput('');
    setRegisterInput('');
    setDepartmentInput('');
    setFromDateInput('');
    setToDateInput('');
    setCurrentPage(1);
    setAppliedFilters({
      search: '',
      type: '',
      register: '',
      department: '',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters =
    appliedFilters.search !== '' ||
    appliedFilters.type !== '' ||
    appliedFilters.register !== '' ||
    appliedFilters.department !== '' ||
    appliedFilters.startDate !== '' ||
    appliedFilters.endDate !== '';

  return (
    <Layout
      title="Stock History"
      breadcrumb="Inventory / Stock Movement History"
    >
      {/* Top Title Bar */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
          Stock History
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.84rem', margin: 0 }}>
          Comprehensive ledger of all recorded inward purchases and outward departmental transfers.
        </p>
      </div>

      {/* TOP 3 SUMMARY KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        {/* Card 1: TOTAL TRANSACTIONS */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Transactions
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, margin: '4px 0 2px 0' }}>
              {totalItems}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Total stock movements
            </div>
          </div>
        </div>

        {/* Card 2: TOTAL PURCHASES */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Purchases
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#059669', lineHeight: 1.2, margin: '4px 0 2px 0' }}>
              {counts.totalPurchases}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Inward stock entries
            </div>
          </div>
        </div>

        {/* Card 3: TOTAL TRANSFERS */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 1l4 4-4 4"></path>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <path d="M7 23l-4-4 4-4"></path>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Transfers
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#d97706', lineHeight: 1.2, margin: '4px 0 2px 0' }}>
              {counts.totalTransfers}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Outward department issues
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          marginBottom: '24px'
        }}
      >
        <form onSubmit={handleApplyFilters}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search product, ID, ref..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            {/* Type Select */}
            <div>
              <select
                value={typeInput}
                onChange={(e) => setTypeInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  color: '#0f172a',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Types</option>
                <option value="PURCHASE">Purchase (Inward)</option>
                <option value="TRANSFER">Transfer (Outward)</option>
              </select>
            </div>

            {/* Department Select */}
            <div>
              <select
                value={departmentInput}
                onChange={(e) => setDepartmentInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  color: '#0f172a',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Departments</option>
                {departments.map((dept, idx) => (
                  <option key={dept.id || dept._id || dept.code || `dept-${idx}`} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Register Select */}
            <div>
              <select
                value={registerInput}
                onChange={(e) => setRegisterInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.84rem',
                  color: '#0f172a',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">All Registers</option>
                <option value="SR1">SR1</option>
                <option value="SR2">SR2</option>
                <option value="SR3">SR3</option>
                <option value="CSSR1">CSSR1</option>
              </select>
            </div>

            {/* From Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>From:</span>
              <input
                type="date"
                value={fromDateInput}
                onChange={(e) => setFromDateInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* To Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>To:</span>
              <input
                type="date"
                value={toDateInput}
                onChange={(e) => setToDateInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid #f1f5f9'
            }}
          >
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  padding: '7px 14px',
                  background: 'transparent',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                Clear Filters
              </button>
            )}

            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 18px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span>Apply Filters</span>
            </button>
          </div>
        </form>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            background: '#fef2f2',
            borderRadius: '10px',
            border: '1px solid #fecaca',
            marginBottom: '24px'
          }}
        >
          <div style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.94rem', marginBottom: '4px' }}>
            Unable to load data. Please try again.
          </div>
          <p style={{ color: '#7f1d1d', fontSize: '0.82rem', marginBottom: '14px' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={fetchHistory}
            style={{
              padding: '6px 18px',
              background: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* TRANSACTION LEDGER TABLE */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Stock Movement Transactions
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Detailed audit trail of incoming and outgoing inventory events
            </div>
          </div>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '12px',
              background: '#f1f5f9',
              color: '#475569'
            }}
          >
            Showing {history.length} of {totalItems} records
          </span>
        </div>

        <div style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '60px 20px' }}>
              <Loading message="Loading stock history..." />
            </div>
          ) : (
            <>
              <StockHistoryTable transactions={history} />
              <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StockHistory;
