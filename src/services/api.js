import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for injecting JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  getUsers: async () => {
    const res = await api.get('/auth/users');
    return res.data;
  }
};

export const masterDataApi = {
  getDepartments: async () => {
    const res = await api.get('/departments');
    return res.data;
  },
  createDepartment: async (data) => {
    const res = await api.post('/departments', data);
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },
  createCategory: async (data) => {
    const res = await api.post('/categories', data);
    return res.data;
  },
  getUnits: async () => {
    const res = await api.get('/units');
    return res.data;
  },
  createUnit: async (data) => {
    const res = await api.post('/units', data);
    return res.data;
  },
  getStockDocuments: async () => {
    const res = await api.get('/stock-documents');
    return res.data;
  },
  createStockDocument: async (data) => {
    const res = await api.post('/stock-documents', data);
    return res.data;
  }
};

export const productApi = {
  getProducts: async (params = {}) => {
    const res = await api.get('/products', { params });
    return res.data;
  },
  getProductById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },
  getProductDetails: async (id) => {
    const res = await api.get(`/products/${id}/details`);
    return res.data;
  },
  createProduct: async (productData) => {
    const res = await api.post('/products', productData);
    return res.data;
  },
  updateProduct: async (id, productData) => {
    const res = await api.put(`/products/${id}`, productData);
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
  getReferences: async (id) => {
    const res = await api.get(`/products/${id}/references`);
    return res.data;
  },
  createReference: async (id, refData) => {
    const res = await api.post(`/products/${id}/references`, refData);
    return res.data;
  },
  updateReference: async (id, refId, refData) => {
    const res = await api.put(`/products/${id}/references/${refId}`, refData);
    return res.data;
  },
  deleteReference: async (id, refId) => {
    const res = await api.delete(`/products/${id}/references/${refId}`);
    return res.data;
  },
  getRemarks: async (id) => {
    const res = await api.get(`/products/${id}/remarks`);
    return res.data;
  },
  addRemark: async (id, remarkData) => {
    const res = await api.post(`/products/${id}/remarks`, remarkData);
    return res.data;
  }
};

export const stockApi = {
  incoming: async (stockData) => {
    const res = await api.post('/stock/incoming', stockData);
    return res.data;
  },
  outgoing: async (stockData) => {
    const res = await api.post('/stock/outgoing', stockData);
    return res.data;
  },
  getHistory: async (params = {}) => {
    const res = await api.get('/stock/history', { params });
    return res.data;
  },
  getLowStock: async () => {
    const res = await api.get('/stock/low-stock');
    return res.data;
  }
};

export const purchaseApi = {
  getPurchases: async (params = {}) => {
    const res = await api.get('/purchases', { params });
    return res.data;
  },
  recordPurchase: async (purchaseData) => {
    const res = await api.post('/purchases', purchaseData);
    return res.data;
  }
};

export const transferApi = {
  getTransfers: async (params = {}) => {
    const res = await api.get('/transfers', { params });
    return res.data;
  },
  issueTransfer: async (transferData) => {
    const res = await api.post('/transfers', transferData);
    return res.data;
  }
};

export const indentApi = {
  getIndents: async (params = {}) => {
    const res = await api.get('/indents', { params });
    return res.data;
  },
  getIndentById: async (id) => {
    const res = await api.get(`/indents/${id}`);
    return res.data;
  },
  createIndent: async (indentData) => {
    const res = await api.post('/indents', indentData);
    return res.data;
  },
  updateIndent: async (id, indentData) => {
    const res = await api.put(`/indents/${id}`, indentData);
    return res.data;
  },
  submitIndent: async (id) => {
    const res = await api.post(`/indents/${id}/submit`);
    return res.data;
  },
  recommendIndent: async (id, data) => {
    const res = await api.post(`/indents/${id}/recommend`, data);
    return res.data;
  },
  approveIndent: async (id, data) => {
    const res = await api.post(`/indents/${id}/approve`, data);
    return res.data;
  },
  rejectIndent: async (id, data) => {
    const res = await api.post(`/indents/${id}/reject`, data);
    return res.data;
  },
  issueIndent: async (id, data) => {
    const res = await api.post(`/indents/${id}/issue`, data);
    return res.data;
  },
  reviewIndent: async (id, reviewData) => {
    const res = await api.post(`/indents/${id}/review`, reviewData);
    return res.data;
  }
};

export const historyApi = {
  getStockHistory: async (params = {}) => {
    const res = await api.get('/history', { params });
    return res.data;
  }
};

export const notificationApi = {
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },
  markRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  }
};

export const analyticsApi = {
  getDashboardStats: async () => {
    const res = await api.get('/dashboard');
    return res.data;
  },
  getAnalyticsOverview: async (params = {}) => {
    const res = await api.get('/analytics/overview', { params });
    return res.data;
  }
};

export const reportApi = {
  getReportData: async (params = {}) => {
    const res = await api.get('/reports', { params });
    return res.data;
  }
};

export default api;
