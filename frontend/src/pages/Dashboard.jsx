import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardSummary, fetchDashboardTrends, fetchDashboardActivities } from '../store/slices/dashboardSlice';
import CustomChart from '../components/CustomChart';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Boxes, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { summary, trends, activities, loading } = useSelector(state => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardSummary());
    dispatch(fetchDashboardTrends());
    dispatch(fetchDashboardActivities());
  }, [dispatch]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1>Welcome Back</h1>
        <p className="page-subtitle">Here is the active operational status of your enterprise database.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="card-grid">
        <div className="card card-primary">
          <div className="card-header">
            <span className="card-title">Net Revenue (Sales)</span>
            <div className="card-icon"><DollarSign size={20} /></div>
          </div>
          <div className="card-value">{formatCurrency(summary.totalSales)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From completed invoices</div>
        </div>

        <div className="card card-warning">
          <div className="card-header">
            <span className="card-title">Restocking Costs</span>
            <div className="card-icon"><ShoppingBag size={20} /></div>
          </div>
          <div className="card-value">{formatCurrency(summary.totalPurchases)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From completed purchase orders</div>
        </div>

        <div className="card card-success">
          <div className="card-header">
            <span className="card-title">Operating Profit</span>
            <div className="card-icon"><TrendingUp size={20} /></div>
          </div>
          <div className={`card-value ${summary.netProfit < 0 ? 'text-danger' : ''}`} style={{ color: summary.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {formatCurrency(summary.netProfit)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sales minus Purchasing costs</div>
        </div>

        <div className="card card-primary">
          <div className="card-header">
            <span className="card-title">Inventory SKUs</span>
            <div className="card-icon"><Boxes size={20} /></div>
          </div>
          <div className="card-value">{summary.totalProducts}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Active catalog models</div>
        </div>

        {summary.lowStockCount > 0 && (
          <div className="card card-danger card-low-stock-critical">
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--danger)' }}>Stock Deficit Alert</span>
              <div className="card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="card-value" style={{ color: 'var(--danger)' }}>{summary.lowStockCount}</div>
            <div style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '600' }}>Products below minimum thresholds!</div>
          </div>
        )}
      </div>

      {/* Main Dashboard Visual Grid */}
      <div className="dashboard-grid">
        {/* Trend Analysis */}
        <div className="table-container" style={{ padding: '24px' }}>
          <h2>Revenue vs Expenses Trend</h2>
          <p className="page-subtitle" style={{ marginBottom: '16px' }}>6-month performance summary of business transactions.</p>
          <div style={{ height: '300px' }}>
            <CustomChart data={trends} />
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="table-container" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h2>Recent Activity</h2>
          </div>
          <div className="table-wrapper" style={{ flexGrow: 1 }}>
            {activities.length === 0 ? (
              <div style={{ display: 'flex', height: '200px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No recent activity logged
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Party</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act) => (
                    <tr key={`${act.type}-${act.id}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {act.type === 'SALE' ? (
                            <ArrowUpRight size={14} style={{ color: 'var(--success)' }} />
                          ) : (
                            <ArrowDownLeft size={14} style={{ color: 'var(--warning)' }} />
                          )}
                          <div>
                            <div style={{ fontWeight: '700' }}>{act.reference}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatDate(act.date)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {act.party}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: act.type === 'SALE' ? 'var(--success)' : 'var(--text-main)' }}>
                          {act.type === 'SALE' ? '+' : '-'}{formatCurrency(act.amount)}
                        </div>
                        <span className={`badge badge-${act.status.toLowerCase()}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {act.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
