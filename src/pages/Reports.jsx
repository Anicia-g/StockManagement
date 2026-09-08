import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import { reportApi } from '../services/api';
import { exportToExcel, exportToPDF } from '../services/exportService';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

const REPORT_COLUMNS = {
  PRODUCT: [
    { header: 'Product Code', dataKey: 'productCode' },
    { header: 'Product Name', dataKey: 'name' },
    { header: 'Category', dataKey: 'category' },
    { header: 'Stock Register', dataKey: 'stockRegister' },
    { header: 'Current Stock', dataKey: 'currentQuantity' },
    { header: 'Min Stock', dataKey: 'minimumStockLevel' },
    { header: 'Unit', dataKey: 'unit' },
    { header: 'Status', dataKey: 'status' }
  ],
  PURCHASE: [
    { header: 'Purchase ID', dataKey: 'purchaseId' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Invoice #', dataKey: 'invoiceNumber' },
    { header: 'Product Code', dataKey: 'productCode' },
    { header: 'Product Name', dataKey: 'productName' },
    { header: 'Stock Register', dataKey: 'stockRegister' },
    { header: 'Quantity In', dataKey: 'quantity' },
    { header: 'Supplier / Vendor', dataKey: 'supplier' },
    { header: 'Received By', dataKey: 'recordedBy' }
  ],
  TRANSFER: [
    { header: 'Transfer ID', dataKey: 'transferId' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Department', dataKey: 'department' },
    { header: 'Product Code', dataKey: 'productCode' },
    { header: 'Product Name', dataKey: 'productName' },
    { header: 'Stock Register', dataKey: 'stockRegister' },
    { header: 'Qty Issued', dataKey: 'quantity' },
    { header: 'Indent Ref', dataKey: 'indentNumber' },
    { header: 'Issued By', dataKey: 'issuedBy' }
  ],
  INDENT: [
    { header: 'Indent Number', dataKey: 'indentNumber' },
    { header: 'Request Date', dataKey: 'date' },
    { header: 'Faculty / Staff', dataKey: 'requester' },
    { header: 'Department', dataKey: 'department' },
    { header: 'Item Count', dataKey: 'itemsCount' },
    { header: 'Items Summary', dataKey: 'itemSummary' },
    { header: 'Status', dataKey: 'status' }
  ],
  HISTORY: [
    { header: 'Txn ID', dataKey: 'transactionId' },
    { header: 'Date', dataKey: 'date' },
    { header: 'Type', dataKey: 'type' },
    { header: 'Product Code', dataKey: 'productCode' },
    { header: 'Product Name', dataKey: 'productName' },
    { header: 'Stock Register', dataKey: 'stockRegister' },
    { header: 'Quantity', dataKey: 'quantity' },
    { header: 'Prev Stock', dataKey: 'previousQuantity' },
    { header: 'New Stock', dataKey: 'newQuantity' },
    { header: 'Department / Source', dataKey: 'department' },
    { header: 'Reference', dataKey: 'referenceId' },
    { header: 'Performed By', dataKey: 'performedBy' }
  ]
};

export const Reports = () => {
  const [reportType, setReportType] = useState('PRODUCT');
  const [reportTitle, setReportTitle] = useState('Product Stock Inventory Report');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [register, setRegister] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination for Preview table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = { reportType };
      if (register) params.register = register;
      if (category) params.category = category;
      if (department) params.department = department;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await reportApi.getReportData(params);
      if (res.success) {
        setData(res.data || []);
        setReportTitle(res.title || 'Stock Report');
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  }, [reportType, register, category, department, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExportExcel = () => {
    exportToExcel(data, `Stock_${reportType}_Report`, reportTitle);
  };

  const handleExportPDF = () => {
    const columns = REPORT_COLUMNS[reportType] || REPORT_COLUMNS.PRODUCT;
    exportToPDF(data, columns, `Stock_${reportType}_Report`, reportTitle);
  };

  const currentColumns = REPORT_COLUMNS[reportType] || REPORT_COLUMNS.PRODUCT;

  // Pagination slice for live preview
  const totalItems = data.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Institutional Stock Reports</h1>
          <p>Generate, preview, and export formal stock ledgers, audit registers, and department requisition reports.</p>
        </div>
        <div className="topbar-actions">
          <Button variant="outline" onClick={handleExportExcel} disabled={data.length === 0}>
            📊 Export to Excel (.xlsx)
          </Button>
          <Button variant="primary" onClick={handleExportPDF} disabled={data.length === 0}>
            📄 Download Official PDF (.pdf)
          </Button>
        </div>
      </div>

      <div className="content-area">
        {/* Report configuration card */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <span className="card-title">Report Parameters & Data Scope</span>
          </div>
          <div className="card-body">
            {/* Report Type selector tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
              {[
                { id: 'PRODUCT', label: '📦 Master Product Inventory' },
                { id: 'PURCHASE', label: '↧ Purchases & Procurement' },
                { id: 'TRANSFER', label: '↥ Department Transfers / Issues' },
                { id: 'INDENT', label: '▧ Online Indent Requisitions' },
                { id: 'HISTORY', label: '≣ Complete Movement Audit' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportType(tab.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: reportType === tab.id ? 'var(--blue-600)' : 'var(--border)',
                    background: reportType === tab.id ? 'var(--blue-50)' : 'var(--surface)',
                    color: reportType === tab.id ? 'var(--blue-700)' : 'var(--text-main)',
                    fontWeight: reportType === tab.id ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.84rem'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter controls */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)'
              }}
            >
              <div className="field">
                <label>Stock Register</label>
                <select value={register} onChange={(e) => setRegister(e.target.value)}>
                  <option value="">All Registers (SR1-3)</option>
                  <option value="SR1">SR1</option>
                  <option value="SR2">SR2</option>
                  <option value="SR3">SR3</option>
                  <option value="CSSR1">CSSR1</option>
                </select>
              </div>

              {reportType === 'PRODUCT' && (
                <div className="field">
                  <label>Product Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Cables & Wires">Cables & Wires</option>
                    <option value="Wiring Accessories">Wiring Accessories</option>
                    <option value="Protection Devices">Protection Devices</option>
                    <option value="Tools">Tools</option>
                    <option value="Motors & Fans">Motors & Fans</option>
                  </select>
                </div>
              )}

              {(reportType === 'TRANSFER' || reportType === 'INDENT' || reportType === 'HISTORY') && (
                <div className="field">
                  <label>Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="">All Departments</option>
                    <option value="CSE">CSE Department</option>
                    <option value="EEE">EEE Department</option>
                    <option value="ECE">ECE Department</option>
                    <option value="Mechanical">Mechanical Department</option>
                    <option value="Civil">Civil Department</option>
                    <option value="IT">IT Department</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>
              )}

              {reportType !== 'PRODUCT' && (
                <>
                  <div className="field">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="card">
          <div className="card-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="card-title">{reportTitle} Preview</span>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                National Engineering College — Maintenance Division · Generated on{' '}
                {new Date().toLocaleDateString()}
              </div>
            </div>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--blue-700)' }}>
              {totalItems} Total Records Found
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <Loading message="Generating structured report preview..." />
            ) : totalItems === 0 ? (
              <EmptyState
                icon="📄"
                title="No records found"
                description="No transactions or products match the selected report scope."
              />
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {currentColumns.map((col, idx) => (
                          <th key={idx}>{col.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {currentColumns.map((col, cIdx) => {
                            const val = row[col.dataKey];
                            const isCode =
                              col.dataKey.toLowerCase().includes('code') ||
                              col.dataKey.toLowerCase().includes('id') ||
                              col.dataKey.toLowerCase().includes('number');
                            const isRegister = col.dataKey === 'stockRegister';

                            return (
                              <td key={cIdx} className={isCode ? 'code' : ''}>
                                {isRegister ? (
                                  <span className="badge badge-blue">{val || 'SR1'}</span>
                                ) : val !== undefined && val !== null ? (
                                  String(val)
                                ) : (
                                  '—'
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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

export default Reports;
