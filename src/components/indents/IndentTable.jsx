import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import { useAuth } from '../../context/AuthContext';

export const IndentTable = ({ indents = [], onReview = null }) => {
  const { isAdmin } = useAuth();

  if (indents.length === 0) {
    return (
      <EmptyState
        icon="▧"
        title="No indent requests found"
        description="No online indents match your search or filter criteria."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Indent No.</th>
            <th>Request Date</th>
            <th>Requester</th>
            <th>Department</th>
            <th>Purpose</th>
            <th>No. of Items</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {indents.map((indent) => {
            const isPending = indent.status === 'PENDING';

            return (
              <tr key={indent._id || indent.indentNumber}>
                <td className="code" style={{ fontWeight: 700 }}>
                  <Link to={`/indents/${indent._id || indent.indentNumber}`}>
                    {indent.indentNumber}
                  </Link>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{indent.requestDate}</td>
                <td><strong>{indent.requesterName}</strong></td>
                <td>{indent.department}</td>
                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {indent.purpose}
                </td>
                <td>
                  <strong>{indent.items?.length || 0} items</strong>
                </td>
                <td>
                  <StatusBadge status={indent.status} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Link
                      to={`/indents/${indent._id || indent.indentNumber}`}
                      className="btn-outline btn-sm"
                    >
                      View
                    </Link>

                    {isAdmin && isPending && onReview && (
                      <button
                        type="button"
                        onClick={() => onReview(indent)}
                        className="btn-primary btn-sm"
                        style={{ padding: '5px 10px' }}
                      >
                        Review / Issue
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

export default IndentTable;
