import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import inventoryReducer from './slices/inventorySlice';
import salesReducer from './slices/salesSlice';
import purchaseReducer from './slices/purchaseSlice';
import dashboardReducer from './slices/dashboardSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    inventory: inventoryReducer,
    sales: salesReducer,
    purchase: purchaseReducer,
    dashboard: dashboardReducer,
  },
});

export default store;
