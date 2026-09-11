import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { masterDataApi } from '../services/api';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export const Units = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [formData, setFormData] = useState({ name: '', symbol: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterDataApi.getUnits({
        search: searchTerm,
        page: currentPage,
        limit: pageSize
      });
      if (res.success) {
        setUnits(res.units || res.data || []);
        setTotalItems(res.total !== undefined ? res.total : (res.units?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch units:', err);
      setFeedback({ type: 'error', message: 'Failed to load units from database.' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, pageSize]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedUnit(null);
    setFormData({ name: '', symbol: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unit) => {
    setIsEditMode(true);
    setSelectedUnit(unit);
    setFormData({ name: unit.name, symbol: unit.symbol || '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Unit name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (isEditMode && selectedUnit) {
        await masterDataApi.updateUnit(selectedUnit._id, formData);
        setFeedback({ type: 'success', message: `Unit "${formData.name}" updated successfully.` });
      } else {
        await masterDataApi.createUnit(formData);
        setFeedback({ type: 'success', message: `Unit "${formData.name}" created successfully.` });
      }
      setIsModalOpen(false);
      fetchUnits();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save unit.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (unit) => {
    if (!window.confirm(`Are you sure you want to delete unit "${unit.name}"?`)) {
      return;
    }
    try {
      await masterDataApi.deleteUnit(unit._id);
      setFeedback({ type: 'success', message: `Unit "${unit.name}" deleted successfully.` });
      fetchUnits();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete unit.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    }
  };

  return (
    <Layout
      title="Units of Measurement"
      breadcrumb="Master Data / Units"
    >
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Units of Measurement</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Maintain units (Pieces, Meter, Roll, Coil, Box) used across physical stock registers.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={handleOpenAdd}>
            <span className="icon">＋</span> Add Unit
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
              placeholder="Search unit name or symbol..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {units.length} of {totalItems} units
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Loading units from database..." />
        ) : units.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No units found matching your search.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Unit Name</th>
                  <th>Symbol / Abbreviation</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, idx) => (
                  <tr key={unit._id || idx}>
                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td style={{ fontWeight: '600', color: 'var(--navy-900)' }}>
                      {unit.name}
                    </td>
                    <td>
                      <code style={{ background: 'var(--navy-50)', padding: '2px 6px', borderRadius: '4px', color: 'var(--navy-800)' }}>
                        {unit.symbol || '—'}
                      </code>
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
                          onClick={() => handleOpenEdit(unit)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleDelete(unit)}
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
              <h2>{isEditMode ? 'Edit Unit' : 'Add New Unit'}</h2>
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
                  <label htmlFor="unit-name">Unit Name *</label>
                  <input
                    id="unit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Pieces, Meter, Roll, Coil"
                    required
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="unit-symbol">Symbol / Abbreviation</label>
                  <input
                    id="unit-symbol"
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="e.g. pcs, m, roll, coil, box"
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
                  {saving ? 'Saving...' : isEditMode ? 'Update Unit' : 'Create Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Units;
