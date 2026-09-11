import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthProvider } from '../context/AuthContext';
import { StockProvider } from '../context/StockContext';
import { NotificationProvider } from '../context/NotificationContext';
import FacultyCatalog from '../pages/FacultyCatalog';
import { productApi, indentApi, masterDataApi } from '../services/api';

vi.mock('../services/api', () => ({
  authApi: {
    getMe: vi.fn().mockResolvedValue({ success: true, user: { role: 'FACULTY' } })
  },
  productApi: {
    getProducts: vi.fn().mockResolvedValue({
      success: true,
      products: [
        {
          _id: 'p101',
          productCode: 'EL-FAN-001',
          productName: 'Ceiling Fan 1200mm',
          name: 'Ceiling Fan 1200mm',
          category: 'Motors & Fans',
          currentQuantity: 12,
          minimumStockLevel: 5,
          unit: 'Pieces',
          status: 'ACTIVE'
        },
        {
          _id: 'p102',
          productCode: 'EL-SW-002',
          productName: 'Two-way Switch 16A',
          name: 'Two-way Switch 16A',
          category: 'Wiring Accessories',
          currentQuantity: 0,
          minimumStockLevel: 10,
          unit: 'Pieces',
          status: 'ACTIVE'
        }
      ],
      total: 2
    })
  },
  masterDataApi: {
    getCategories: vi.fn().mockResolvedValue({
      success: true,
      categories: [{ name: 'Motors & Fans' }, { name: 'Wiring Accessories' }]
    }),
    getDepartments: vi.fn().mockResolvedValue({
      success: true,
      departments: [{ name: 'Electrical & Electronics Engineering' }]
    })
  },
  indentApi: {
    createIndent: vi.fn().mockResolvedValue({
      success: true,
      message: 'Requisition IND-2026-009 submitted to MongoDB.',
      indent: { indentNumber: 'IND-2026-009' }
    })
  },
  notificationApi: {
    getNotifications: vi.fn().mockResolvedValue({ success: true, unreadCount: 0, notifications: [] }),
    markAsRead: vi.fn().mockResolvedValue({ success: true })
  }
}));

const mockFaculty = {
  id: 'usr-fac-99',
  username: 'faculty',
  name: 'Prof. Anitha',
  role: 'FACULTY',
  department: 'Electrical & Electronics Engineering',
  avatarText: 'PA'
};

const renderCatalog = () => {
  window.localStorage.setItem('auth_user', JSON.stringify(mockFaculty));
  window.localStorage.setItem('auth_token', 'mock-token-faculty');

  return render(
    <MemoryRouter initialEntries={['/faculty/catalog']}>
      <AuthProvider>
        <NotificationProvider>
          <StockProvider>
            <FacultyCatalog />
          </StockProvider>
        </NotificationProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Faculty Catalog & Direct Requisition Workflow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('Renders product items loaded from database with stock indicators', async () => {
    renderCatalog();

    const productTitle = await screen.findByText('Ceiling Fan 1200mm', {}, { timeout: 4000 });
    expect(productTitle).toBeInTheDocument();
    expect(screen.getByText('Two-way Switch 16A')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getAllByText('Out of Stock').length).toBeGreaterThan(0);
  });

  it('Opens Request / Book modal and submits requisition to MongoDB API', async () => {
    renderCatalog();

    const bookButtons = await screen.findAllByRole('button', { name: /Request \/ Book/i });
    expect(bookButtons.length).toBeGreaterThan(0);
    fireEvent.click(bookButtons[0]);

    // Check modal opens
    expect(screen.getByText(/Request Item: Ceiling Fan 1200mm/i)).toBeInTheDocument();

    // Fill purpose
    const purposeInput = screen.getByLabelText(/Purpose \/ Utilization Reason/i);
    fireEvent.change(purposeInput, { target: { value: 'Machines Lab II experimental bench setup' } });

    // Submit request
    const submitBtn = screen.getByRole('button', { name: /Submit Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(indentApi.createIndent).toHaveBeenCalledTimes(1);
      expect(indentApi.createIndent).toHaveBeenCalledWith(expect.objectContaining({
        department: 'Electrical & Electronics Engineering',
        purpose: 'Machines Lab II experimental bench setup'
      }));
    });
  });
});
