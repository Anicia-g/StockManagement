import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { masterDataApi } from '../services/api';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export const StockRegisters = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterDataApi.getStockDocuments({
        search: searchTerm,
        page: currentPage,
        limit: pageSize
      });
      if (res.success) {
        setDocuments(res.documents || res.stockDocuments || res.data || []);
        setTotalItems(res.total !== undefined ? res.total : (res.documents?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch stock registers:', err);
      setFeedback({ type: 'error', message: 'Failed to load stock registers from database.' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, pageSize]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedDoc(null);
    setFormData({ name: '', description: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setIsEditMode(true);
    setSelectedDoc(doc);
    setFormData({ name: doc.name, description: doc.description || '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Register code/name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (isEditMode && selectedDoc) {
        await masterDataApi.updateStockDocument(selectedDoc._id, formData);
        setFeedback({ type: 'success', message: `Stock register "${formData.name.toUpperCase()}" updated successfully.` });
      } else {
        await masterDataApi.createStockDocument(formData);
        setFeedback({ type: 'success', message: `Stock register "${formData.name.toUpperCase()}" created successfully.` });
      }
      setIsModalOpen(false);
      fetchDocuments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save stock register.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete register "${doc.name}"? This physical ledger reference will be removed.`)) {
      return;
    }
    try {
      await masterDataApi.deleteStockDocument(doc._id);
      setFeedback({ type: 'success', message: `Stock register "${doc.name}" deleted successfully.` });
      fetchDocuments();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete stock register.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    }
  };

  return (
    <Layout
      title="Stock Register Documents"
      breadcrumb="Master Data / Stock Registers"
    >
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Physical Stock Registers</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Define physical register books (e.g. CSSR1, SR1, SR2, SR3) mapped to offline record ledgers.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={handleOpenAdd}>
            <span className="icon">＋</span> Add Stock Register
          </button>
        </div>
      </div>

      {feedback.message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            background: feedback.type === 'error' ? 'var(--red-50)' : 'var(--green-50)',
            color: feedback.type === 'error' ? 'var(--red-700)' : 'var(--green-700)',
            border: `1px solid ${feedback.type === 'error' ? 'var(--red-200)' : 'var(--green-200)'}`
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <input
              type="text"
              placeholder="Search register name or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {documents.length} of {totalItems} registers
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Loading stock registers from database..." />
        ) : documents.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No stock registers found matching your search.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Register Code</th>
                  <th>Description / Physical Book Purpose</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => (
                  <tr key={doc._id || idx}>
                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td style={{ fontWeight: '700', color: 'var(--blue-700)', fontSize: '0.95rem' }}>
                      {doc.name}
                    </td>
                    <td style={{ color: 'var(--text-600)' }}>
                      {doc.description || '—'}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        Active
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleOpenEdit(doc)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleDelete(doc)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? 'Edit Stock Register' : 'Add New Stock Register'}</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'var(--red-50)',
                      color: 'var(--red-700)',
                      border: '1px solid var(--red-200)',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      fontSize: '0.85rem'
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label htmlFor="doc-name">Register Code (e.g. CSSR1, SR1, SR2, SR3) *</label>
                  <input
                    id="doc-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    placeholder="e.g. SR4, CSSR2, ELEC-REG"
                    required
                    style={{ width: '100%', padding: '8px 12px', textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc-desc">Description / Physical Ledger Purpose</label>
                  <textarea
                    id="doc-desc"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Central Store Consumables Register Vol 1"
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : isEditMode ? 'Update Register' : 'Create Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StockRegisters;
