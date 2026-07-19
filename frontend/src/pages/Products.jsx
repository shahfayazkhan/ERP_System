import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchProducts, 
  fetchCategories, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  adjustProductStock,
  addCategory,
  clearInventoryError 
} from '../store/slices/inventorySlice';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Sliders, 
  AlertTriangle, 
  Search, 
  X,
  TrendingUp,
  FolderPlus
} from 'lucide-react';

const Products = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { products, categories, loading, error } = useSelector(state => state.inventory);

  // Filter States
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStock, setLowStock] = useState(false);

  // Modal States
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null); // If editing
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);

  // Form States - Product
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodStock, setProdStock] = useState(0);
  const [prodThreshold, setProdThreshold] = useState(10);
  const [prodCategory, setProdCategory] = useState('');

  // Form States - Category
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Form States - Adjust Stock
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('IN');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Load Initial Data
  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchProducts({ search, categoryId, lowStock }));
  }, [dispatch, search, categoryId, lowStock]);

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditProduct(product);
      setProdName(product.name);
      setProdSku(product.sku);
      setProdDesc(product.description || '');
      setProdPrice(product.price);
      setProdCost(product.cost);
      setProdStock(product.stockQuantity);
      setProdThreshold(product.lowStockThreshold);
      setProdCategory(product.categoryId || '');
    } else {
      setEditProduct(null);
      setProdName('');
      setProdSku('');
      setProdDesc('');
      setProdPrice('');
      setProdCost('');
      setProdStock(0);
      setProdThreshold(10);
      setProdCategory(categories[0]?.id || '');
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const productData = {
      name: prodName,
      sku: prodSku || undefined,
      description: prodDesc,
      price: Number(prodPrice),
      cost: Number(prodCost),
      stockQuantity: Number(prodStock),
      lowStockThreshold: Number(prodThreshold),
      categoryId: prodCategory || null
    };

    if (editProduct) {
      dispatch(updateProduct({ id: editProduct.id, productData }));
    } else {
      dispatch(addProduct(productData));
    }
    setProductModalOpen(false);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteProduct(id));
    }
  };

  const handleOpenAdjustModal = (product) => {
    setAdjustProduct(product);
    setAdjustQty('');
    setAdjustType('IN');
    setAdjustNotes('');
    setAdjustModalOpen(true);
  };

  const handleAdjustStock = (e) => {
    e.preventDefault();
    const adjustmentQuantity = adjustType === 'OUT' ? -Math.abs(Number(adjustQty)) : Math.abs(Number(adjustQty));
    dispatch(adjustProductStock({
      id: adjustProduct.id,
      adjustmentData: {
        adjustmentQuantity,
        type: adjustType,
        notes: adjustNotes
      }
    }));
    setAdjustModalOpen(false);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!catName) return;
    dispatch(addCategory({ name: catName, description: catDesc }));
    setCatName('');
    setCatDesc('');
    setCategoryModalOpen(false);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const isEditor = ['admin', 'manager'].includes(user?.role);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Inventory Items</h1>
          <p className="page-subtitle">Track, register, and restock warehouse items.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {isEditor && (
            <>
              <button onClick={() => setCategoryModalOpen(true)} className="btn btn-secondary">
                <FolderPlus size={16} />
                <span>Add Category</span>
              </button>
              <button onClick={() => handleOpenProductModal(null)} className="btn btn-primary">
                <Plus size={16} />
                <span>Add Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="notification-banner error">
          <span>{error}</span>
          <button onClick={() => dispatch(clearInventoryError())} style={{ background: 'none', border: 'none', color: 'inherit' }}><X size={16} /></button>
        </div>
      )}

      {/* Grid search and filtering */}
      <div className="table-container">
        <div className="table-header-bar">
          <div className="table-search-filters">
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-search" 
                placeholder="Search by SKU or Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select 
              className="select-filter"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', marginLeft: '8px' }}>
              <input 
                type="checkbox" 
                checked={lowStock} 
                onChange={(e) => setLowStock(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>Low Stock Alerts</span>
            </label>
          </div>
        </div>

        <div className="table-wrapper">
          {products.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No inventory products found matching filters.
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Cost</th>
                  <th>Selling Price</th>
                  <th>Stock Qty</th>
                  <th>Min Alert</th>
                  {isEditor && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => {
                  const isLow = prod.stockQuantity <= prod.lowStockThreshold;
                  return (
                    <tr key={prod.id} className={isLow ? 'row-low-stock' : ''}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--primary)' }}>
                        {prod.sku}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{prod.name}</div>
                        {prod.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.description}</div>}
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {prod.category ? prod.category.name : <span style={{ color: 'var(--text-muted)' }}>Uncategorized</span>}
                      </td>
                      <td>{formatCurrency(prod.cost)}</td>
                      <td>{formatCurrency(prod.price)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', color: isLow ? 'var(--danger)' : 'var(--text-main)' }}>
                            {prod.stockQuantity}
                          </span>
                          {isLow && (
                            <span title="Low Stock Deficit" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center' }}>
                              <AlertTriangle size={14} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{prod.lowStockThreshold}</td>
                      
                      {isEditor && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => handleOpenAdjustModal(prod)} 
                              className="btn btn-secondary btn-icon" 
                              title="Quick Stock Adjustment"
                            >
                              <Sliders size={14} />
                            </button>
                            <button 
                              onClick={() => handleOpenProductModal(prod)} 
                              className="btn btn-secondary btn-icon" 
                              title="Edit Product"
                            >
                              <Edit size={14} />
                            </button>
                            {user?.role === 'admin' && (
                              <button 
                                onClick={() => handleDeleteProduct(prod.id)} 
                                className="btn btn-secondary btn-icon" 
                                style={{ color: 'var(--danger)' }}
                                title="Delete Product"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* PRODUCT ADD/EDIT MODAL */}
      {productModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setProductModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">SKU (Stock Keeping Unit)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. PROD-1004 (Leave blank for auto-generate)"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. MacBook Pro"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Enter details..."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                  />
                </div>

                <div className="cols-2">
                  <div className="form-group">
                    <label className="form-label">Cost Price ($) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      value={prodCost}
                      onChange={(e) => setProdCost(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Selling Price ($) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="cols-2">
                  <div className="form-group">
                    <label className="form-label">Initial Stock</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      disabled={!!editProduct} // Disable editing quantity directly from here
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Low Stock Threshold</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={prodThreshold}
                      onChange={(e) => setProdThreshold(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-select"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                  >
                    <option value="">None</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setProductModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUST MODAL */}
      {adjustModalOpen && adjustProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Adjust Inventory Stock</h2>
              <button onClick={() => setAdjustModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAdjustStock}>
              <div className="modal-body">
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Product</div>
                  <div style={{ fontWeight: '700' }}>{adjustProduct.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Quantity: <strong>{adjustProduct.stockQuantity}</strong></div>
                </div>

                <div className="cols-2">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select 
                      className="form-select" 
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value)}
                    >
                      <option value="IN">Restock (IN)</option>
                      <option value="OUT">Deduction (OUT)</option>
                      <option value="ADJUSTMENT">Reconciliation (ADJ)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 5"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Audit Notes</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Stock count reconciliation"
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setAdjustModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Process Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY ADD MODAL */}
      {categoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Create Product Category</h2>
              <button onClick={() => setCategoryModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Stationery"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Describe category..."
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setCategoryModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
