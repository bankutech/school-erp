import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  X,
  Search,
  Download,
  Edit3,
  Trash2,
  Package,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'items' | 'movements'>('items');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [selectedItemForMove, setSelectedItemForMove] = useState<any | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Queries
  const { data: summaryData } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => api.get<any>('/inventory/summary'),
  });

  const { data: itemsData, isLoading: isItemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['inventory-items', categoryFilter, lowStockOnly, searchTerm],
    queryFn: () =>
      api.get<any>('/inventory/items', {
        category: categoryFilter || undefined,
        lowStockOnly: lowStockOnly ? 'true' : undefined,
        search: searchTerm.trim() || undefined,
      }),
  });

  const { data: movementsData, isLoading: isMovementsLoading } = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: () => api.get<any>('/inventory/movements'),
  });

  // Form States
  const [itemForm, setItemForm] = useState({
    itemCode: 'INV-' + Math.floor(1000 + Math.random() * 9000),
    name: '',
    category: 'Stationery',
    unit: 'PCS',
    minQuantity: 10,
    quantity: 50,
  });

  const [movementForm, setMovementForm] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: 10,
    reason: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      setIsItemModalOpen(false);
      setFormError(null);
      setItemForm({
        itemCode: 'INV-' + Math.floor(1000 + Math.random() * 9000),
        name: '',
        category: 'Stationery',
        unit: 'PCS',
        minQuantity: 10,
        quantity: 50,
      });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create inventory item.');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/inventory/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      setEditingItem(null);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to update item.');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      setDeletingItem(null);
    },
  });

  const recordMovementMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/movements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      setSelectedItemForMove(null);
      setFormError(null);
      setMovementForm({ type: 'IN', quantity: 10, reason: '' });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to record stock movement.');
    },
  });

  // CSV Export Handler
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = sessionStorage.getItem('school_erp_token') || localStorage.getItem('school_erp_token');
      const response = await fetch('/api/v1/inventory/export', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-stock-audit-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export inventory CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const summary = summaryData?.data || {
    totalItems: itemsData?.data?.length || 0,
    totalStockUnits: itemsData?.data?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0,
    lowStockCount: itemsData?.data?.filter((i: any) => i.isLowStock).length || 0,
    totalMovements: movementsData?.data?.length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Assets</h1>
          <p className="text-sm text-slate-500 mt-1">
            School assets, stationery consumables, lab supplies, and replenishment ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{isExporting ? 'Exporting...' : 'Export Stock CSV'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsItemModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Catalogued Items
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
              {summary.totalItems}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Unique SKU Codes</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Total Stock Units
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
              {Number(summary.totalStockUnits).toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">In Campus Stores</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            summary.lowStockCount > 0
              ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Low Stock Alerts
            </span>
            <span
              className={`text-2xl font-bold mt-1 block tabular-nums ${
                summary.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {summary.lowStockCount}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {lowStockOnly ? 'Filtered: Low Stock' : 'Below Minimum Threshold'}
            </span>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              summary.lowStockCount > 0
                ? 'bg-rose-100 text-rose-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Movement Logs
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block tabular-nums">
              {summary.totalMovements}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Audited Transactions</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`pb-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'items'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Items in Stock ({itemsData?.data?.length ?? 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`pb-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'movements'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement Audit Ledger</span>
        </button>
      </div>

      {/* TAB 1: ITEMS */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stock by item name or SKU code..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="Stationery">Stationery</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Sports">Sports</option>
                <option value="IT Assets">IT Assets</option>
                <option value="Uniforms">Uniforms</option>
              </select>

              <button
                type="button"
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  lowStockOnly
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Stock Only</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Code / SKU</th>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">In Stock</th>
                    <th className="px-4 py-3">Threshold</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isItemsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                          <span>Loading stock items...</span>
                        </div>
                      </td>
                    </tr>
                  ) : itemsData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-600 font-semibold text-xs">No matching inventory items found</p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Try adjusting your search criteria or add a new stock item.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    itemsData?.data?.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-brand-700 text-xs">
                          {item.itemCode}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.category}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-slate-500 tabular-nums">
                          {item.minQuantity} {item.unit}
                        </td>
                        <td className="px-4 py-3">
                          {item.isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Adequate</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItemForMove(item);
                                setFormError(null);
                                setMovementForm({ type: 'IN', quantity: 10, reason: '' });
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              Record Movement
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setFormError(null);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit Item Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENT LEDGER */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Item Details</th>
                  <th className="px-4 py-3">Movement Type</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Reason / Reference</th>
                  <th className="px-4 py-3">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isMovementsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Loading stock audit ledger...
                    </td>
                  </tr>
                ) : movementsData?.data?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No stock movement audit records found.
                    </td>
                  </tr>
                ) : (
                  movementsData?.data?.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {new Date(m.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <span>{m.item?.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {m.item?.itemCode} • {m.item?.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            m.type === 'IN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.type === 'OUT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {m.type === 'IN' && <ArrowDownRight className="w-3 h-3" />}
                          {m.type === 'OUT' && <ArrowUpRight className="w-3 h-3" />}
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">
                        {m.quantity} {m.item?.unit}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{m.reason || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{m.performedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Create Stock Item */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add Inventory Stock Item</h2>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createItemMutation.mutate(itemForm);
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item SKU / Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.itemCode}
                    onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Stationery">Stationery</option>
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Sports">Sports</option>
                    <option value="IT Assets">IT Assets</option>
                    <option value="Uniforms">Uniforms</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Description / Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A4 Copy Paper Ream 75 GSM"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value.toUpperCase() })}
                    placeholder="PCS"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Level</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.minQuantity}
                    onChange={(e) => setItemForm({ ...itemForm, minQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createItemMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {createItemMutation.isPending ? 'Cataloguing...' : 'Create Stock Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Movement */}
      {selectedItemForMove && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Record Stock Movement</h2>
              <button
                type="button"
                onClick={() => setSelectedItemForMove(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Item:</span>
                <span className="font-bold text-slate-900">{selectedItemForMove.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Stock:</span>
                <span className="font-bold text-brand-700">
                  {selectedItemForMove.quantity} {selectedItemForMove.unit}
                </span>
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                recordMovementMutation.mutate({
                  itemId: selectedItemForMove.id,
                  type: movementForm.type,
                  quantity: Number(movementForm.quantity),
                  reason: movementForm.reason,
                });
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type</label>
                <select
                  value={movementForm.type}
                  onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                >
                  <option value="IN">IN (Stock Received / Restocked)</option>
                  <option value="OUT">OUT (Issued / Consumed)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Audit Correction)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {movementForm.type === 'ADJUSTMENT' ? 'New Target Stock Quantity' : 'Quantity'}
                </label>
                <input
                  type="number"
                  min={movementForm.type === 'ADJUSTMENT' ? '0' : '1'}
                  max={movementForm.type === 'OUT' ? selectedItemForMove.quantity : undefined}
                  required
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
                {movementForm.type === 'OUT' && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Maximum available for issue: {selectedItemForMove.quantity} {selectedItemForMove.unit}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Issued to Senior Science Lab, PO-9941"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedItemForMove(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordMovementMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {recordMovementMutation.isPending ? 'Recording...' : 'Confirm Movement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Edit Inventory Item</h2>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateItemMutation.mutate({
                  id: editingItem.id,
                  data: {
                    name: editingItem.name,
                    category: editingItem.category,
                    unit: editingItem.unit,
                    minQuantity: Number(editingItem.minQuantity),
                  },
                });
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Code</label>
                <input
                  type="text"
                  disabled
                  value={editingItem.itemCode}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Stationery">Stationery</option>
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Sports">Sports</option>
                    <option value="IT Assets">IT Assets</option>
                    <option value="Uniforms">Uniforms</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Level</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.minQuantity}
                    onChange={(e) => setEditingItem({ ...editingItem, minQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateItemMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {updateItemMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Delete Inventory Item</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{deletingItem.name}</strong> ({deletingItem.itemCode})?
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteItemMutation.isPending}
                onClick={() => deleteItemMutation.mutate(deletingItem.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteItemMutation.isPending ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
