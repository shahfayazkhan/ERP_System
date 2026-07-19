import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

// Customers Thunks
export const fetchCustomers = createAsyncThunk(
  'sales/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get('/sales/customers');
      return data.customers;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addCustomer = createAsyncThunk(
  'sales/addCustomer',
  async (customerData, { rejectWithValue }) => {
    try {
      const data = await api.post('/sales/customers', customerData);
      return data.customer;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Sales Orders Thunks
export const fetchSalesOrders = createAsyncThunk(
  'sales/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get('/sales/orders');
      return data.orders;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addSalesOrder = createAsyncThunk(
  'sales/addOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const data = await api.post('/sales/orders', orderData);
      return data.order;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'sales/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const data = await api.put(`/sales/orders/${id}/status`, { status });
      return data.order;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  customers: [],
  orders: [],
  loading: false,
  error: null,
};

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    clearSalesError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Customer
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
        state.customers.sort((a, b) => a.name.localeCompare(b.name));
      })
      
      // Fetch Sales Orders
      .addCase(fetchSalesOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSalesOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchSalesOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Sales Order
      .addCase(addSalesOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
      })
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      });
  }
});

export const { clearSalesError } = salesSlice.actions;
export default salesSlice.reducer;
