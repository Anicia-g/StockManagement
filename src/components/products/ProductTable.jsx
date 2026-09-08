import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

export const ProductTable = ({ products = [], onEdit = null, onDelete = null }) => {
  const { isAdmin } = useAuth();

  if (products.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="No products found"
        description="Try adjusting your search criteria or filter options."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product Code</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Available Qty</th>
            <th>Minimum Qty</th>
            <th>Unit</th>
            <th>Stock Register</th>
            <th>Page No.</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLowStock = product.currentQuantity <= product.minimumStockLevel;
            const isNearing =
              !isLowStock && product.currentQuantity <= product.minimumStockLevel + 2;
            const statusText = isLowStock
              ? 'Low Stock'
              : isNearing
              ? 'Nearing Limit'
              : 'Available';

            const registerName = product.stockRegister || product.registerRefs?.[0]?.sheet || 'SR1';
            const pageNum = product.pageNumber || product.registerRefs?.[0]?.page || '—';

            return (
              <tr key={product._id || product.id}>
                <td className="code">{product.productCode}</td>
                <td>
                  <Link to={`/products/${product._id || product.id}`} className="cell-strong">
                    {product.name || product.productName}
                  </Link>
                </td>
                <td>{product.category}</td>
                <td>
                  <strong style={{ color: isLowStock ? 'var(--red-600)' : 'inherit' }}>
                    {product.currentQuantity}
                  </strong>
                </td>
                <td>{product.minimumStockLevel}</td>
                <td>{product.unit || 'Pieces'}</td>
                <td>
                  <span className="badge badge-blue" style={{ fontWeight: 700 }}>
                    {registerName}
                  </span>
                </td>
                <td>{pageNum}</td>
                <td>
                  <StatusBadge status={statusText} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Link
                      to={`/products/${product._id || product.id}`}
                      className="btn-outline btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                    >
                      View
                    </Link>

                    {isAdmin && onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                        title="Edit product"
                      >
                        Edit
                      </button>
                    )}

                    {isAdmin && onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        className="btn-danger btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                        title="Delete product"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
