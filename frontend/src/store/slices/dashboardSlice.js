import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchDashboardSummary = createAsyncThunk(
  'dashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get('/dashboard/summary');
      return data.data; // { totalSales, totalPurchases, netProfit, totalProducts, lowStockCount }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDashboardTrends = createAsyncThunk(
  'dashboard/fetchTrends',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get('/dashboard/trends');
      return data.trends; // Array of { month, sales, purchases }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDashboardActivities = createAsyncThunk(
  'dashboard/fetchActivities',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get('/dashboard/activities');
      return data.activities;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  summary: {
    totalSales: 0,
    totalPurchases: 0,
    netProfit: 0,
    totalProducts: 0,
    lowStockCount: 0
  },
  trends: [],
  activities: [],
  loading: false,
  error: null
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Summary
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Trends
      .addCase(fetchDashboardTrends.fulfilled, (state, action) => {
        state.trends = action.payload;
      })
      // Activities
      .addCase(fetchDashboardActivities.fulfilled, (state, action) => {
        state.activities = action.payload;
      });
  }
});

export default dashboardSlice.reducer;
