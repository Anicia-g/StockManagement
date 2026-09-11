import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { masterDataApi } from '../services/api';
import Loading from '../components/common/Loading';
import Pagination from '../components/common/Pagination';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterDataApi.getCategories({
        search: searchTerm,
        page: currentPage,
        limit: pageSize
      });
      if (res.success) {
        setCategories(res.categories || res.data || []);
        setTotalItems(res.total !== undefined ? res.total : (res.categories?.length || 0));
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setFeedback({ type: 'error', message: 'Failed to load categories from database.' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, pageSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setIsEditMode(true);
    setSelectedCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (isEditMode && selectedCategory) {
        await masterDataApi.updateCategory(selectedCategory._id, formData);
        setFeedback({ type: 'success', message: `Category "${formData.name}" updated successfully.` });
      } else {
        await masterDataApi.createCategory(formData);
        setFeedback({ type: 'success', message: `Category "${formData.name}" created successfully.` });
      }
      setIsModalOpen(false);
      fetchCategories();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }
    try {
      await masterDataApi.deleteCategory(cat._id);
      setFeedback({ type: 'success', message: `Category "${cat.name}" deleted successfully.` });
      fetchCategories();
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to delete category.' });
      setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
    }
  };

  return (
    <Layout
      title="Category Management"
      breadcrumb="Master Data / Categories"
    >
      <div className="section" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', marginBottom: '2px' }}>Product Categories</h1>
            <p style={{ color: 'var(--text-500)', margin: 0, fontSize: '0.84rem' }}>
              Define and manage consumable component classifications stored in MongoDB.
            </p>
          </div>
          <button type="button" className="btn-primary" onClick={handleOpenAdd}>
            <span className="icon">＋</span> Add Category
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
              placeholder="Search category name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {categories.length} of {totalItems} categories
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Loading categories from database..." />
        ) : categories.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No categories found matching your search.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th style={{ width: '120px' }}>Status</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, idx) => (
                  <tr key={cat._id || idx}>
                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td style={{ fontWeight: '600', color: 'var(--navy-900)' }}>
                      {cat.name}
                    </td>
                    <td style={{ color: 'var(--text-600)' }}>
                      {cat.description || '—'}
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
                          onClick={() => handleOpenEdit(cat)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-danger"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => handleDelete(cat)}
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
              <h2>{isEditMode ? 'Edit Category' : 'Add New Category'}</h2>
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
                  <label htmlFor="cat-name">Category Name *</label>
                  <input
                    id="cat-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Lighting, Wiring, Switchgear"
                    required
                    style={{ width: '100%', padding: '8px 12px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cat-desc">Description</label>
                  <textarea
                    id="cat-desc"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this category..."
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
                  {saving ? 'Saving...' : isEditMode ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Categories;
