import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

// Categories Thunks
export const fetchCategories = createAsyncThunk(
  'inventory/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get('/inventory/categories');
      return data.categories;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addCategory = createAsyncThunk(
  'inventory/addCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const data = await api.post('/inventory/categories', categoryData);
      return data.category;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Products Thunks
export const fetchProducts = createAsyncThunk(
  'inventory/fetchProducts',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
      if (filters.lowStock) queryParams.append('lowStock', filters.lowStock);
      
      const endpoint = `/inventory/products?${queryParams.toString()}`;
      const data = await api.get(endpoint);
      return data.products;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addProduct = createAsyncThunk(
  'inventory/addProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const data = await api.post('/inventory/products', productData);
      return data.product;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  'inventory/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const data = await api.put(`/inventory/products/${id}`, productData);
      return data.product;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'inventory/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/inventory/products/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const adjustProductStock = createAsyncThunk(
  'inventory/adjustStock',
  async ({ id, adjustmentData }, { rejectWithValue }) => {
    try {
      const data = await api.post(`/inventory/products/${id}/adjust`, adjustmentData);
      return data.product;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  products: [],
  categories: [],
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    clearInventoryError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Category
      .addCase(addCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
        state.categories.sort((a, b) => a.name.localeCompare(b.name));
      })
      
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Product
      .addCase(addProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
        state.products.sort((a, b) => a.name.localeCompare(b.name));
      })
      
      // Update Product
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      
      // Delete Product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(p => p.id !== action.payload);
      })
      
      // Adjust Stock
      .addCase(adjustProductStock.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      });
  }
});

export const { clearInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer;
