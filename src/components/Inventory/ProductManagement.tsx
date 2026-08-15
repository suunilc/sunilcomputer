import React, { useState } from 'react';
import { AppState, Product, ProductCategory, PRODUCT_CATEGORIES } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  X,
  CheckCircle,
  Tag,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface ProductManagementProps {
  state: AppState;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  userRole: string;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  state,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  userRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Password Protected Product Delete State
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDeleteProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = deletePassword.trim();
    if (cleanPass === '23571113' || cleanPass === 'Sunil369@' || cleanPass === 'Sunil 359@' || (state.currentUser?.password && cleanPass === state.currentUser.password)) {
      if (deleteProductTarget) {
        onDeleteProduct(deleteProductTarget.id);
      }
      setDeleteProductTarget(null);
      setDeletePassword('');
      setDeleteError('');
    } else {
      setDeleteError('Invalid Password!');
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: PRODUCT_CATEGORIES[0] as ProductCategory,
    sellingPrice: '',
    stockQuantity: '',
    unit: 'Pcs',
    imageUrl: '',
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: PRODUCT_CATEGORIES[0],
      sellingPrice: '',
      stockQuantity: '10',
      unit: 'Pcs',
      imageUrl: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      sellingPrice: String(p.sellingPrice),
      stockQuantity: String(p.stockQuantity),
      unit: p.unit || 'Pcs',
      imageUrl: p.imageUrl || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sellingPrice) return;

    const productPayload: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      sku: editingProduct ? editingProduct.sku : `PROD-${Date.now().toString().slice(-6)}`,
      name: formData.name.trim(),
      category: formData.category,
      brand: 'Generic',
      purchasePrice: 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      stockQuantity: parseInt(formData.stockQuantity, 10) || 0,
      minStockAlert: 1,
      unit: formData.unit,
      imageUrl: formData.imageUrl || undefined,
      dateAdded: editingProduct ? editingProduct.dateAdded : new Date().toISOString().split('T')[0],
      description: '',
    };

    if (editingProduct) {
      onUpdateProduct(productPayload);
    } else {
      onAddProduct(productPayload);
    }
    setIsModalOpen(false);
  };

  // Filter Products
  const filteredProducts = state.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-3 sm:p-6 space-y-5 text-black">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-black flex items-center space-x-2">
            <Package className="w-6 h-6 text-black" />
            <span>Product & Inventory Management</span>
          </h2>
          <p className="text-xs text-black font-bold mt-0.5">
            Manage stock, purchase rates, selling rates, and inventory for {state.products.length} products.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer border border-black"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>+ Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-black shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex items-center w-full md:w-auto" style={{ minWidth: '220px', height: '40px' }}>
            <Search className="w-4 h-4 absolute left-3 text-black pointer-events-none" />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full pl-9 pr-3 bg-white border border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-500"
            />
          </div>

          {/* Category Tabs / Select */}
          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 border border-black ${
                selectedCategory === 'All'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              All ({state.products.length})
            </button>

            {PRODUCT_CATEGORIES.map((cat) => {
              const count = state.products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 border border-black ${
                    selectedCategory === cat
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-neutral-100'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border-2 border-black shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white text-black uppercase font-black text-[11px] tracking-wider border-b-2 border-black">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Selling Rate</th>
                <th className="py-3 px-4 text-center">Stock Qty</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-black font-bold">
                    No matching products found. Try adjusting filters or click "+ Add New Product".
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-100 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-black text-black text-sm">{p.name}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-white text-black rounded-lg text-[11px] font-black border border-black">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-black text-black text-sm">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      <td className="py-3 px-4 text-center font-black text-sm text-black">
                        {p.stockQuantity} <span className="text-xs font-bold text-black">{p.unit}</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 bg-neutral-200 text-black rounded font-black text-[10px] border border-black">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-white text-black rounded font-black text-[10px] border border-black">
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-black hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-black"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4 text-black" />
                        </button>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => {
                              setDeleteProductTarget(p);
                              setDeletePassword('');
                              setDeleteError('');
                            }}
                            className="p-1.5 text-black hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-black"
                            title="Delete Product (Password Protected)"
                          >
                            <Trash2 className="w-4 h-4 text-black" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-black w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-black">
            
            <div className="flex items-center justify-between px-6 py-4 bg-black text-white border-b-2 border-black">
              <h3 className="font-black text-base text-white">
                {editingProduct ? 'Edit Product' : 'Add New Inventory Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-white hover:bg-neutral-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-black text-black mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell Keyboard or Photo Framing 12x18"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border-2 border-black rounded-xl text-xs font-bold text-black focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-black mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3.5 py-2.5 border-2 border-black rounded-xl text-xs font-black bg-white text-black focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">Selling Price (रु.) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="w-full px-3.5 py-2.5 border-2 border-black rounded-xl text-xs font-black text-black bg-white focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">Unit Type</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black bg-white focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Set">Set</option>
                    <option value="Box">Box</option>
                    <option value="Roll">Roll</option>
                    <option value="Pack">Pack</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Course">Course</option>
                    <option value="Meter">Meter</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border-2 border-black text-black text-xs font-black rounded-xl hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer border border-black"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Password Protected Delete Confirmation Modal */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-black max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-black">
            <div className="flex items-center space-x-3 text-black">
              <AlertTriangle className="w-6 h-6 shrink-0 text-black" />
              <div>
                <h3 className="font-black text-base text-black">Security Password Required</h3>
                <p className="text-xs text-black font-bold">Deletion authorization for Sunil Sharma (Founder)</p>
              </div>
            </div>

            <div className="p-3 bg-neutral-100 border-2 border-black rounded-xl text-xs text-black space-y-1">
              <p className="font-black">Are you sure you want to delete this product?</p>
              <p className="font-bold text-black">{deleteProductTarget.name}</p>
              <p className="text-[11px] text-black font-bold">This action cannot be undone.</p>
            </div>

            <form onSubmit={handleConfirmDeleteProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">
                  Enter Deletion Password *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Password (e.g. Sunil 359@)"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {deleteError && (
                <div className="p-2.5 bg-black text-white rounded-xl text-xs font-black">
                  ⚠️ {deleteError}
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteProductTarget(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="px-4 py-2 border-2 border-black text-black text-xs font-black rounded-xl hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer border border-black"
                >
                  Confirm Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
