import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesOrders, fetchCustomers, addSalesOrder, updateOrderStatus, addCustomer, clearSalesError } from '../store/slices/salesSlice';
import { fetchProducts } from '../store/slices/inventorySlice';
import { Plus, Check, ShoppingBag, Eye, Trash2, X, PlusCircle, MinusCircle, Printer, FileText } from 'lucide-react';

const Sales = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { orders, customers, error } = useSelector(state => state.sales);
  const { products } = useSelector(state => state.inventory);

  // UI tabs
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'new-order', 'customers'

  // Modal States
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Customer Form States
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Invoice Builder States
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderStatus, setOrderStatus] = useState('Pending');
  const [invoiceItems, setInvoiceItems] = useState([]); // [{ productId, quantity, price, name, stock }]

  // Product addition state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQty, setProductQty] = useState(1);

  useEffect(() => {
    dispatch(fetchSalesOrders());
    dispatch(fetchCustomers());
    dispatch(fetchProducts()); // To populate product selector in invoice builder
  }, [dispatch]);

  const handleOpenCustomerModal = () => {
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setCustAddress('');
    setCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!custName) return;
    dispatch(addCustomer({ name: custName, email: custEmail, phone: custPhone, address: custAddress }));
    setCustomerModalOpen(false);
  };

  const handleAddProductToInvoice = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;

    // Check if already in list
    const existingIdx = invoiceItems.findIndex(item => item.productId === selectedProduct);
    if (existingIdx !== -1) {
      const updated = [...invoiceItems];
      updated[existingIdx].quantity += Number(productQty);
      setInvoiceItems(updated);
    } else {
      setInvoiceItems([
        ...invoiceItems,
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          price: Number(prod.price),
          quantity: Number(productQty),
          stock: prod.stockQuantity
        }
      ]);
    }
    setSelectedProduct('');
    setProductQty(1);
  };

  const handleRemoveInvoiceItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQty = (index, delta) => {
    const updated = [...invoiceItems];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      handleRemoveInvoiceItem(index);
    } else {
      setInvoiceItems(updated);
    }
  };

  const calculateInvoiceTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (!invoiceItems.length) {
      alert('Please add at least one product');
      return;
    }

    const items = invoiceItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    const result = await dispatch(addSalesOrder({
      customerId: selectedCustomer,
      status: orderStatus,
      notes: orderNotes,
      items
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      // Clear forms and toggle
      setSelectedCustomer('');
      setOrderNotes('');
      setOrderStatus('Pending');
      setInvoiceItems([]);
      setActiveTab('orders');
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
  };

  const handleViewInvoice = (order) => {
    setSelectedOrder(order);
    setInvoiceModalOpen(true);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isEditor = ['admin', 'manager'].includes(user?.role);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Sales & Invoices</h1>
          <p className="page-subtitle">Draft, finalize, and review invoices for customer billing.</p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('orders')}
          >
            Invoice History
          </button>
          <button 
            className={`btn ${activeTab === 'new-order' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('new-order')}
          >
            <Plus size={16} />
            <span>Create Invoice</span>
          </button>
          <button 
            className={`btn ${activeTab === 'customers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('customers')}
          >
            Customers
          </button>
        </div>
      </div>

      {error && (
        <div className="notification-banner error">
          <span>{error}</span>
          <button onClick={() => dispatch(clearSalesError())} style={{ background: 'none', border: 'none', color: 'inherit' }}><X size={16} /></button>
        </div>
      )}

      {/* --- TAB 1: ORDERS LIST --- */}
      {activeTab === 'orders' && (
        <div className="table-container">
          <div className="table-wrapper">
            {orders.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No sales invoices found. Create one to begin.
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>
                        {order.orderNumber}
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {order.customer ? order.customer.name : 'Unknown Customer'}
                      </td>
                      <td>{formatDate(order.orderDate)}</td>
                      <td style={{ fontWeight: '700', color: 'var(--success)' }}>
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td>
                        {isEditor ? (
                          <select 
                            className={`select-filter badge badge-${order.status.toLowerCase()}`}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            style={{ 
                              border: 'none', 
                              padding: '4px 20px 4px 10px',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '11px'
                            }}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span className={`badge badge-${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleViewInvoice(order)} 
                          className="btn btn-secondary btn-icon"
                          title="View Invoice Sheet"
                        >
                          <FileText size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: INVOICE BUILDER (NEW ORDER) --- */}
      {activeTab === 'new-order' && (
        <form onSubmit={handleSubmitInvoice} className="invoice-grid">
          {/* Items addition area */}
          <div className="invoice-builder-card">
            <h2>Add Invoice Items</h2>
            <p className="page-subtitle" style={{ marginBottom: '20px' }}>Select products and quantities to invoice the client.</p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ flexGrow: 1, minWidth: '200px' }}>
                <label className="form-label">Select Product</label>
                <select 
                  className="form-select"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">-- Choose item from inventory --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Price: {formatCurrency(p.price)} (Stock: {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: '100px' }}>
                <label className="form-label">Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  className="form-input" 
                  value={productQty}
                  onChange={(e) => setProductQty(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={handleAddProductToInvoice} 
                  className="btn btn-primary"
                  style={{ height: '40px' }}
                >
                  <PlusCircle size={16} />
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            <div className="invoice-items-list">
              {invoiceItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                  No items added to invoice yet. Select a product above.
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1.2fr 0.5fr', gap: '12px', fontWeight: '700', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <span>Product Detail</span>
                    <span>Stock</span>
                    <span>Price</span>
                    <span>Total</span>
                    <span></span>
                  </div>
                  {invoiceItems.map((item, idx) => (
                    <div key={item.productId} className="invoice-item-row">
                      <div>
                        <div style={{ fontWeight: '700' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {item.sku}</div>
                      </div>
                      
                      <div style={{ fontSize: '13px' }}>{item.stock} units</div>
                      
                      <div style={{ fontSize: '13px' }}>{formatCurrency(item.price)}</div>
                      
                      <div style={{ fontWeight: '700', color: 'var(--success)' }}>
                        {formatCurrency(item.quantity * item.price)}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button type="button" onClick={() => handleUpdateItemQty(idx, -1)} className="btn btn-secondary btn-icon" style={{ padding: '4px' }}><MinusCircle size={12} /></button>
                        <span style={{ minWidth: '24px', textCenter: 'center', display: 'inline-block', textAlign: 'center', lineHeight: '24px', fontSize: '13px', fontWeight: '700' }}>{item.quantity}</span>
                        <button type="button" onClick={() => handleUpdateItemQty(idx, 1)} className="btn btn-secondary btn-icon" style={{ padding: '4px' }}><PlusCircle size={12} /></button>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveInvoiceItem(idx)} 
                          className="btn btn-secondary btn-icon" 
                          style={{ color: 'var(--danger)', marginLeft: '12px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Customer and metadata sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="invoice-builder-card">
              <h2>Invoice Summary</h2>
              <p className="page-subtitle" style={{ marginBottom: '20px' }}>Client registry and checkout parameters.</p>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Customer Name *</span>
                  <button type="button" onClick={handleOpenCustomerModal} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>+ Register New</button>
                </label>
                <select 
                  className="form-select"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  required
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Invoice Status</label>
                <select 
                  className="form-select"
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                >
                  <option value="Draft">Draft (No stock deductions)</option>
                  <option value="Pending">Pending (No stock deductions)</option>
                  <option value="Paid">Paid (Subtracts Inventory Stock)</option>
                  <option value="Shipped">Shipped (Subtracts Inventory Stock)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Comments</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Terms, bank information, delivery terms..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>

              <div className="invoice-summary-box" style={{ marginBottom: '20px' }}>
                <div className="invoice-summary-line">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateInvoiceTotal())}</span>
                </div>
                <div className="invoice-summary-line">
                  <span>Taxes (0%)</span>
                  <span>$0.00</span>
                </div>
                <div className="invoice-summary-line total">
                  <span>Grand Total</span>
                  <span>{formatCurrency(calculateInvoiceTotal())}</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={invoiceItems.length === 0}
              >
                Create Invoice
              </button>
            </div>
          </div>
        </form>
      )}

      {/* --- TAB 3: CUSTOMERS LIST --- */}
      {activeTab === 'customers' && (
        <div className="table-container">
          <div className="table-header-bar">
            <h2>Registered Customers</h2>
            <button onClick={handleOpenCustomerModal} className="btn btn-primary">
              <Plus size={16} />
              <span>Register Customer</span>
            </button>
          </div>
          <div className="table-wrapper">
            {customers.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No customer directories registered yet.
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '700' }}>{c.name}</td>
                      <td>{c.email || <span style={{ color: 'var(--text-muted)' }}>--</span>}</td>
                      <td>{c.phone || <span style={{ color: 'var(--text-muted)' }}>--</span>}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.address || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMER REGISTRATION MODAL */}
      {customerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Register New Customer</h2>
              <button onClick={() => setCustomerModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Customer / Agency Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Wayne Enterprises"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. accounts@wayne.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. +1-555-9011"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="e.g. 1007 Mountain Drive, Gotham"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setCustomerModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Register Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INVOICE MODAL */}
      {invoiceModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h2>Invoice {selectedOrder.orderNumber}</h2>
              <button onClick={() => setInvoiceModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ color: 'var(--text-main)' }}>
              {/* Premium Print-style Invoice view */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '800', background: 'linear-gradient(135deg, #FFF, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ADVANCE ERP</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Tech Logistics & Warehouse Solutions</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>INVOICE SHEET</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Date: {formatDate(selectedOrder.orderDate)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Invoice From</div>
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>ERP Head Office</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>100 Pine Street, San Francisco, CA</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Billed To</div>
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>{selectedOrder.customer ? selectedOrder.customer.name : 'Unknown Customer'}</div>
                  {selectedOrder.customer && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {selectedOrder.customer.email && <div>Email: {selectedOrder.customer.email}</div>}
                      {selectedOrder.customer.phone && <div>Phone: {selectedOrder.customer.phone}</div>}
                      {selectedOrder.customer.address && <div>Addr: {selectedOrder.customer.address}</div>}
                    </div>
                  )}
                </div>
              </div>

              <table className="erp-table" style={{ marginBottom: '24px' }}>
                <thead>
                  <tr>
                    <th>Product details</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: '700' }}>{item.product?.name || 'Deleted Product'}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SKU: {item.product?.sku || '--'}</div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ maxWidth: '300px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Invoice Notes</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{selectedOrder.notes || 'No custom notes provided.'}</p>
                </div>
                <div style={{ width: '240px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>Payment Status</span>
                    <span className={`badge badge-${selectedOrder.status.toLowerCase()}`}>{selectedOrder.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                    <span>Grand Total</span>
                    <span style={{ color: 'var(--success)' }}>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => window.print()} className="btn btn-secondary">
                <Printer size={16} />
                <span>Print Document</span>
              </button>
              <button onClick={() => setInvoiceModalOpen(false)} className="btn btn-primary">Close Sheet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
