import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import IndentApprovalModal from '../components/indents/IndentApprovalModal';
import { indentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';

export const IndentDetails = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [indent, setIndent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fetchIndent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await indentApi.getIndentById(id);
      if (res.success) {
        setIndent(res.indent);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load indent details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIndent();
  }, [fetchIndent]);

  const handleIndentProcessed = (updatedIndent) => {
    setIndent(updatedIndent);
    setSuccessToast(`Indent ${updatedIndent.indentNumber} successfully processed!`);
    setTimeout(() => setSuccessToast(''), 5000);
  };

  if (loading) {
    return (
      <Layout>
        <Loading message="Loading indent record..." />
      </Layout>
    );
  }

  if (error || !indent) {
    return (
      <Layout>
        <div className="content-area">
          <div className="login-error-box" style={{ marginBottom: '20px' }}>
            <span>⚠</span>
            <span>{error || 'Indent not found.'}</span>
          </div>
          <Button variant="outline" onClick={() => navigate('/indents')}>
            ← Back to Indents
          </Button>
        </div>
      </Layout>
    );
  }

  const isPending = indent.status === 'PENDING';

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/indents" style={{ fontSize: '0.85rem', color: 'var(--blue-600)', textDecoration: 'none' }}>
              ← Indents
            </Link>
            <h1>Requisition {indent.indentNumber}</h1>
            <StatusBadge status={indent.status} />
          </div>
          <p>
            Submitted by <strong>{indent.requesterName}</strong> for <strong>{indent.department}</strong> on{' '}
            {indent.requestDate}
          </p>
        </div>

        <div className="topbar-actions">
          {isAdmin && isPending && (
            <Button variant="primary" onClick={() => setIsReviewModalOpen(true)}>
              <span className="icon">✓</span> Review & Issue Stock
            </Button>
          )}
          <button
            type="button"
            className="btn-outline"
            onClick={() => window.print()}
          >
            🖨 Print Indent Slip
          </button>
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

        {/* Overview cards */}
        <div className="grid-3col" style={{ marginBottom: '24px' }}>
          <div className="card">
            <div className="card-head">
              <span className="card-title">Department & Requester</span>
            </div>
            <div className="card-body" style={{ fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Department:</span>{' '}
                <strong>{indent.department}</strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Faculty / Staff:</span>{' '}
                <strong>{indent.requesterName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Purpose:</span>{' '}
                <strong>{indent.purpose}</strong>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <span className="card-title">Timeline & Schedule</span>
            </div>
            <div className="card-body" style={{ fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date Requested:</span>{' '}
                <strong>{indent.requestDate}</strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Required By:</span>{' '}
                <strong style={{ color: 'var(--blue-700)' }}>{indent.requiredDate}</strong>
              </div>
              {indent.reviewedDate && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Reviewed On:</span>{' '}
                  <strong>{indent.reviewedDate}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <span className="card-title">Approval & Review Status</span>
            </div>
            <div className="card-body" style={{ fontSize: '0.88rem' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                <StatusBadge status={indent.status} />
              </div>
              {indent.reviewedBy && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reviewed By:</span>{' '}
                  <strong>{indent.reviewedBy}</strong>
                </div>
              )}
              {indent.adminRemarks && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Admin Note:</span>{' '}
                  <em>{indent.adminRemarks}</em>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <span className="card-title">Requisition Item Details</span>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {indent.items?.length || 0} line items
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item #</th>
                    <th>Product Details</th>
                    <th>Stock Register</th>
                    <th>Requested Qty</th>
                    <th>Approved Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {indent.items?.map((item, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600 }}>{index + 1}</td>
                      <td>
                        <div className="cell-strong">{item.productName}</div>
                        <span className="code">{item.productCode}</span>
                      </td>
                      <td>
                        <span className="badge badge-blue">{item.stockRegister || 'SR1'}</span>
                      </td>
                      <td>
                        <strong>
                          {item.requestedQuantity} {item.unit}
                        </strong>
                      </td>
                      <td>
                        <strong
                          style={{
                            color:
                              item.approvedQuantity > 0
                                ? 'var(--green-700)'
                                : isPending
                                ? 'var(--text-muted)'
                                : 'var(--red-600)'
                          }}
                        >
                          {isPending ? '—' : `${item.approvedQuantity} ${item.unit}`}
                        </strong>
                      </td>
                      <td>
                        {isPending ? (
                          <span className="badge badge-amber">Awaiting Review</span>
                        ) : item.approvedQuantity === item.requestedQuantity ? (
                          <span className="badge badge-green">Fully Approved</span>
                        ) : item.approvedQuantity > 0 ? (
                          <span className="badge badge-amber">Partially Approved</span>
                        ) : (
                          <span className="badge badge-red">Rejected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Remarks / Justification */}
        {indent.remarks && (
          <div className="card">
            <div className="card-head">
              <span className="card-title">Faculty Remarks / Justification</span>
            </div>
            <div className="card-body">
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {indent.remarks}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <IndentApprovalModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          indent={indent}
          onIndentProcessed={handleIndentProcessed}
        />
      )}
    </Layout>
  );
};

export default IndentDetails;
