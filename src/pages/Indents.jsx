import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import IndentTable from '../components/indents/IndentTable';
import IndentApprovalModal from '../components/indents/IndentApprovalModal';
import { indentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export const Indents = () => {
  const { isAdmin } = useAuth();
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndentForReview, setSelectedIndentForReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchIndents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await indentApi.getIndents(params);
      if (res.success) {
        setIndents(res.indents || []);
        setTotalItems(res.total !== undefined ? res.total : (res.count || res.indents?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch indents:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchIndents();
  }, [fetchIndents]);

  const handleOpenReview = (indent) => {
    setSelectedIndentForReview(indent);
    setIsReviewModalOpen(true);
  };

  const handleIndentProcessed = (updatedIndent) => {
    setActionSuccessMessage(`Indent ${updatedIndent.indentNumber} processed successfully (${updatedIndent.status})!`);
    fetchIndents();
    setTimeout(() => setActionSuccessMessage(''), 5000);
  };

  const pendingCount = indents.filter((i) => i.status === 'PENDING').length;
  const approvedCount = indents.filter((i) => i.status === 'APPROVED' || i.status === 'COMPLETED').length;

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">
          <h1>{isAdmin ? 'Online Indent Requests' : 'My Indent Requests'}</h1>
          <p>
            {isAdmin
              ? 'Review faculty material requisitions, approve stock allocations, and issue transfers.'
              : 'Track the progress of your departmental material requisitions and view approval statuses.'}
          </p>
        </div>
        {!isAdmin && (
          <div className="topbar-actions">
            <Link to="/indents/create" className="btn-primary">
              <span className="icon">＋</span> Create New Indent
            </Link>
          </div>
        )}
      </div>

      <div className="content-area">
        {actionSuccessMessage && (
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
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Stats row */}
        <div className="grid-4col" style={{ marginBottom: '24px' }}>
          <div className="metric-card">
            <div className="metric-label">Total Indents</div>
            <div className="metric-value">{totalItems}</div>
            <div className="metric-sub">Across all statuses</div>
          </div>
          <div className="metric-card" style={{ borderColor: pendingCount > 0 ? 'var(--amber-400)' : 'inherit' }}>
            <div className="metric-label">Pending Approval</div>
            <div className="metric-value" style={{ color: pendingCount > 0 ? 'var(--amber-600)' : 'inherit' }}>
              {pendingCount}
            </div>
            <div className="metric-sub">{pendingCount > 0 ? 'Action required by Store' : 'All indents up to date'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Approved & Completed</div>
            <div className="metric-value" style={{ color: 'var(--green-700)' }}>
              {approvedCount}
            </div>
            <div className="metric-sub">Issued to departments</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Workflow Mode</div>
            <div className="metric-value" style={{ fontSize: '1.2rem', color: 'var(--blue-700)' }}>
              {isAdmin ? 'Store Admin' : 'Department Faculty'}
            </div>
            <div className="metric-sub">{isAdmin ? 'Full review & issuance rights' : 'Requisition submitter'}</div>
          </div>
        </div>

        {/* Indents Table Card */}
        <div className="card">
          <div className="card-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <span className="card-title">Indent Requisition Records</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search indent no, faculty, dept..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem'
                }}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PARTIALLY_APPROVED">PARTIALLY_APPROVED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading && indents.length === 0 ? (
              <Loading message="Loading indent requisitions..." />
            ) : (
              <>
                <IndentTable indents={indents} onReview={handleOpenReview} />
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

      {/* Review Modal */}
      {isReviewModalOpen && selectedIndentForReview && (
        <IndentApprovalModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          indent={selectedIndentForReview}
          onIndentProcessed={handleIndentProcessed}
        />
      )}
    </Layout>
  );
};

export default Indents;
