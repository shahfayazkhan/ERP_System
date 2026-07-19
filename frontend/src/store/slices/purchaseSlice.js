import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

// Suppliers Thunks
export const fetchSuppliers = createAsyncThunk(
  'purchase/fetchSuppliers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get('/purchases/suppliers');
      return data.suppliers;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addSupplier = createAsyncThunk(
  'purchase/addSupplier',
  async (supplierData, { rejectWithValue }) => {
    try {
      const data = await api.post('/purchases/suppliers', supplierData);
      return data.supplier;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Purchase Orders Thunks
export const fetchPurchaseOrders = createAsyncThunk(
  'purchase/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get('/purchases/orders');
      return data.orders;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addPurchaseOrder = createAsyncThunk(
  'purchase/addOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const data = await api.post('/purchases/orders', orderData);
      return data.order;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePurchaseOrderStatus = createAsyncThunk(
  'purchase/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const data = await api.put(`/purchases/orders/${id}/status`, { status });
      return data.order;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  suppliers: [],
  orders: [],
  loading: false,
  error: null,
};

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState,
  reducers: {
    clearPurchaseError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Suppliers
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Supplier
      .addCase(addSupplier.fulfilled, (state, action) => {
        state.suppliers.push(action.payload);
        state.suppliers.sort((a, b) => a.name.localeCompare(b.name));
      })
      
      // Fetch Purchase Orders
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Purchase Order
      .addCase(addPurchaseOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
      })
      // Update Purchase Order Status
      .addCase(updatePurchaseOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      });
  }
});

export const { clearPurchaseError } = purchaseSlice.actions;
export default purchaseSlice.reducer;
