import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';

export const StockHistoryTable = ({ transactions = [] }) => {
  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="≣"
        title="No stock movements found"
        description="No purchase or transfer transactions match your filter criteria."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Txn ID</th>
            <th>Date</th>
            <th>Product Code</th>
            <th>Product Name</th>
            <th>Stock Register</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Prev Stock</th>
            <th>New Stock</th>
            <th>Department / Source</th>
            <th>Reference ID</th>
            <th>Performed By</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => {
            const isPurchase = txn.type === 'PURCHASE';

            return (
              <tr key={txn._id || txn.transactionId}>
                <td className="code" style={{ whiteSpace: 'nowrap' }}>
                  {txn.transactionId}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{txn.date}</td>
                <td className="code">{txn.productCode}</td>
                <td>
                  <Link
                    to={`/products/${txn.productId || txn.productCode}`}
                    className="cell-strong"
                  >
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
                <td>{txn.previousQuantity !== undefined ? txn.previousQuantity : '—'}</td>
                <td>
                  <strong>{txn.newQuantity !== undefined ? txn.newQuantity : '—'}</strong>
                </td>
                <td>{txn.department || 'Store'}</td>
                <td className="code">{txn.referenceId || '—'}</td>
                <td>{txn.performedBy || 'Admin'}</td>
                <td className="small" style={{ maxWidth: '240px' }}>
                  {txn.remarks || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockHistoryTable;
