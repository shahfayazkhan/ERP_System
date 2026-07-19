import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchPurchaseOrders, 
  fetchSuppliers, 
  addPurchaseOrder, 
  updatePurchaseOrderStatus, 
  addSupplier, 
  clearPurchaseError 
} from '../store/slices/purchaseSlice';
import { fetchProducts } from '../store/slices/inventorySlice';
import { Plus, Check, ShoppingBag, Eye, Trash2, X, PlusCircle, MinusCircle, Printer, FileText } from 'lucide-react';

const Purchases = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { orders, suppliers, error } = useSelector(state => state.purchase);
  const { products } = useSelector(state => state.inventory);

  // Tab state
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'new-order', 'suppliers'

  // Modals
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Supplier Form
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // PO Builder Form
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderStatus, setOrderStatus] = useState('Pending');
  const [poItems, setPoItems] = useState([]); // [{ productId, name, sku, quantity, cost }]

  // Product Add state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQty, setProductQty] = useState(1);
  const [productCost, setProductCost] = useState('');

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchSuppliers());
    dispatch(fetchProducts()); // For listing products to restock
  }, [dispatch]);

  const handleOpenSupplierModal = () => {
    setSupName('');
    setSupContact('');
    setSupEmail('');
    setSupPhone('');
    setSupAddress('');
    setSupplierModalOpen(true);
  };

  const handleSaveSupplier = (e) => {
    e.preventDefault();
    if (!supName) return;
    dispatch(addSupplier({
      name: supName,
      contactName: supContact,
      email: supEmail,
      phone: supPhone,
      address: supAddress
    }));
    setSupplierModalOpen(false);
  };

  // Sync default cost when product is selected in selector
  const handleProductSelect = (prodId) => {
    setSelectedProduct(prodId);
    if (prodId) {
      const prod = products.find(p => p.id === prodId);
      setProductCost(prod ? prod.cost : '');
    } else {
      setProductCost('');
    }
  };

  const handleAddProductToPO = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;

    const costNum = Number(productCost) !== undefined && productCost !== '' ? Number(productCost) : prod.cost;

    const existingIdx = poItems.findIndex(item => item.productId === selectedProduct);
    if (existingIdx !== -1) {
      const updated = [...poItems];
      updated[existingIdx].quantity += Number(productQty);
      setPoItems(updated);
    } else {
      setPoItems([
        ...poItems,
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          cost: costNum,
          quantity: Number(productQty)
        }
      ]);
    }
    setSelectedProduct('');
    setProductQty(1);
    setProductCost('');
  };

  const handleRemovePOItem = (index) => {
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQty = (index, delta) => {
    const updated = [...poItems];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      handleRemovePOItem(index);
    } else {
      setPoItems(updated);
    }
  };

  const calculatePOTotal = () => {
    return poItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
  };

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      alert('Please select a supplier');
      return;
    }
    if (!poItems.length) {
      alert('Please add at least one product');
      return;
    }

    const items = poItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.cost
    }));

    const result = await dispatch(addPurchaseOrder({
      supplierId: selectedSupplier,
      status: orderStatus,
      notes: orderNotes,
      items
    }));

    if (result.meta.requestStatus === 'fulfilled') {
      setSelectedSupplier('');
      setOrderNotes('');
      setOrderStatus('Pending');
      setPoItems([]);
      setActiveTab('orders');
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updatePurchaseOrderStatus({ id: orderId, status: newStatus }));
  };

  const handleViewPO = (order) => {
    setSelectedOrder(order);
    setPurchaseModalOpen(true);
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Purchasing & Restocking</h1>
          <p className="page-subtitle">Draft, dispatch, and check off purchase orders for inventory restocking.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('orders')}
          >
            Order History
          </button>
          <button 
            className={`btn ${activeTab === 'new-order' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('new-order')}
          >
            <Plus size={16} />
            <span>Create PO</span>
          </button>
          <button 
            className={`btn ${activeTab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('suppliers')}
          >
            Suppliers
          </button>
        </div>
      </div>

      {error && (
        <div className="notification-banner error">
          <span>{error}</span>
          <button onClick={() => dispatch(clearPurchaseError())} style={{ background: 'none', border: 'none', color: 'inherit' }}><X size={16} /></button>
        </div>
      )}

      {/* --- TAB 1: PO HISTORY --- */}
      {activeTab === 'orders' && (
        <div className="table-container">
          <div className="table-wrapper">
            {orders.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No purchase orders recorded yet. Restock items to create one.
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Supplier</th>
                    <th>Date</th>
                    <th>Total Cost</th>
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
                        {order.supplier ? order.supplier.name : 'Unknown Supplier'}
                      </td>
                      <td>{formatDate(order.orderDate)}</td>
                      <td style={{ fontWeight: '700' }}>
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td>
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
                          <option value="Received">Received</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleViewPO(order)} 
                          className="btn btn-secondary btn-icon"
                          title="View PO Details"
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

      {/* --- TAB 2: PO BUILDER --- */}
      {activeTab === 'new-order' && (
        <form onSubmit={handleSubmitPO} className="invoice-grid">
          {/* PO item rows */}
          <div className="invoice-builder-card">
            <h2>Add Items to Purchase Order</h2>
            <p className="page-subtitle" style={{ marginBottom: '20px' }}>Specify cost and volume for each replenishment model.</p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ flexGrow: 1, minWidth: '200px' }}>
                <label className="form-label">Restock Product</label>
                <select 
                  className="form-select"
                  value={selectedProduct}
                  onChange={(e) => handleProductSelect(e.target.value)}
                >
                  <option value="">-- Choose item --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Current Stock: {p.stockQuantity}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ width: '120px' }}>
                <label className="form-label">Supply Cost ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  placeholder="Cost"
                  value={productCost}
                  onChange={(e) => setProductCost(e.target.value)}
                />
              </div>

              <div style={{ width: '90px' }}>
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
                  onClick={handleAddProductToPO} 
                  className="btn btn-primary"
                  style={{ height: '40px' }}
                >
                  <PlusCircle size={16} />
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            <div className="invoice-items-list">
              {poItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                  No lines added to purchase sheet. Select a product.
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr 0.5fr', gap: '12px', fontWeight: '700', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <span>Product Detail</span>
                    <span>Cost</span>
                    <span>Total Cost</span>
                    <span></span>
                  </div>
                  {poItems.map((item, idx) => (
                    <div key={item.productId} className="invoice-item-row" style={{ gridTemplateColumns: '2.5fr 1fr 1.2fr 0.5fr' }}>
                      <div>
                        <div style={{ fontWeight: '700' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {item.sku}</div>
                      </div>
                      
                      <div style={{ fontSize: '13px' }}>{formatCurrency(item.cost)}</div>
                      
                      <div style={{ fontWeight: '700' }}>
                        {formatCurrency(item.quantity * item.cost)}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => handleUpdateItemQty(idx, -1)} className="btn btn-secondary btn-icon" style={{ padding: '4px' }}><MinusCircle size={12} /></button>
                        <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: '700' }}>{item.quantity}</span>
                        <button type="button" onClick={() => handleUpdateItemQty(idx, 1)} className="btn btn-secondary btn-icon" style={{ padding: '4px' }}><PlusCircle size={12} /></button>
                        <button 
                          type="button" 
                          onClick={() => handleRemovePOItem(idx)} 
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

          {/* Supplier details sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="invoice-builder-card">
              <h2>PO Parameters</h2>
              <p className="page-subtitle" style={{ marginBottom: '20px' }}>Supplier profiles and dispatch status.</p>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Supplier Name *</span>
                  <button type="button" onClick={handleOpenSupplierModal} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '11px' }}>+ Register New</button>
                </label>
                <select 
                  className="form-select"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  required
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Restocking Status</label>
                <select 
                  className="form-select"
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                >
                  <option value="Draft">Draft (No stock changes)</option>
                  <option value="Pending">Pending (No stock changes)</option>
                  <option value="Received">Received (Increments Stock Quantity)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">PO Notes</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Terms, logistics data, warehouse dock tags..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>

              <div className="invoice-summary-box" style={{ marginBottom: '20px' }}>
                <div className="invoice-summary-line">
                  <span>Subtotal Expenses</span>
                  <span>{formatCurrency(calculatePOTotal())}</span>
                </div>
                <div className="invoice-summary-line total">
                  <span>Estimated Total</span>
                  <span>{formatCurrency(calculatePOTotal())}</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={poItems.length === 0}
              >
                Create Purchase Order
              </button>
            </div>
          </div>
        </form>
      )}

      {/* --- TAB 3: SUPPLIERS MANAGER --- */}
      {activeTab === 'suppliers' && (
        <div className="table-container">
          <div className="table-header-bar">
            <h2>Registered Suppliers & Vendors</h2>
            <button onClick={handleOpenSupplierModal} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Supplier</span>
            </button>
          </div>
          <div className="table-wrapper">
            {suppliers.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No supplier profiles registered.
              </div>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Contact Person</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Warehouse Address</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '700' }}>{s.name}</td>
                      <td>{s.contactName || '--'}</td>
                      <td>{s.email || '--'}</td>
                      <td>{s.phone || '--'}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.address || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SUPPLIER REGISTRATION MODAL */}
      {supplierModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Register New Supplier</h2>
              <button onClick={() => setSupplierModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveSupplier}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Global Tech Distributors"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Person</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Robert Miles"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. sales@globaltech.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. +1-800-555-0922"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Warehouse Address</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="e.g. 40 Restock Blvd, Seattle, WA"
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setSupplierModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PO MODAL */}
      {purchaseModalOpen && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h2>Purchase Order {selectedOrder.orderNumber}</h2>
              <button onClick={() => setPurchaseModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>
            
            <div className="modal-body" style={{ color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '800', background: 'linear-gradient(135deg, #FFF, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ADVANCE ERP</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Tech Logistics & Warehouse Solutions</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>PURCHASE ORDER</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Date: {formatDate(selectedOrder.orderDate)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>PO Recipient</div>
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>ERP Warehouse Dock B</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>100 Pine Street, San Francisco, CA</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>Supplier Partner</div>
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>{selectedOrder.supplier ? selectedOrder.supplier.name : 'Unknown Supplier'}</div>
                  {selectedOrder.supplier && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {selectedOrder.supplier.contactName && <div>Contact: {selectedOrder.supplier.contactName}</div>}
                      {selectedOrder.supplier.email && <div>Email: {selectedOrder.supplier.email}</div>}
                      {selectedOrder.supplier.phone && <div>Phone: {selectedOrder.supplier.phone}</div>}
                      {selectedOrder.supplier.address && <div>Warehouse: {selectedOrder.supplier.address}</div>}
                    </div>
                  )}
                </div>
              </div>

              <table className="erp-table" style={{ marginBottom: '24px' }}>
                <thead>
                  <tr>
                    <th>Product details</th>
                    <th>Qty</th>
                    <th>Unit Cost</th>
                    <th style={{ textAlign: 'right' }}>Total Cost</th>
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
                      <td>{formatCurrency(item.unitCost)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ maxWidth: '300px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>PO notes & terms</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{selectedOrder.notes || 'No custom terms or dispatch tags.'}</p>
                </div>
                <div style={{ width: '240px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>Receiving Status</span>
                    <span className={`badge badge-${selectedOrder.status.toLowerCase()}`}>{selectedOrder.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                    <span>Total Expense</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => window.print()} className="btn btn-secondary">
                <Printer size={16} />
                <span>Print PO</span>
              </button>
              <button onClick={() => setPurchaseModalOpen(false)} className="btn btn-primary">Close Sheet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
