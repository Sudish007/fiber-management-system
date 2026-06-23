import { useEffect, useState, useRef } from 'react';
import { Plus, Search, Download, Upload, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { ofcApi } from '../services/api';
import { OFCRoute, FiberCore } from '../types';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

interface OFCPageProps {
  darkMode: boolean;
  isAdmin: boolean;
}

const FIBER_COLORS = ['Blue','Orange','Green','Brown','Slate','White','Red','Black','Yellow','Violet','Aqua','Rose'];

export default function OFCPage({ darkMode, isAdmin }: OFCPageProps) {
  const [routes, setRoutes] = useState<OFCRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showFiberModal, setShowFiberModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<OFCRoute | null>(null);
  const [expandedRoute, setExpandedRoute] = useState<number | null>(null);
  const [editingFiber, setEditingFiber] = useState<FiberCore | null>(null);
  const [activeFiberRouteId, setActiveFiberRouteId] = useState<number | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    route_name: '', start_location: '', end_location: '',
    route_length: '', fiber_count: '', core_utilization: '',
    status: 'active', remarks: ''
  });

  const [fiberForm, setFiberForm] = useState({
    fiber_number: '', color: 'Blue', status: 'spare',
    from_to: '', connected_equipment: '', port: '', remarks: ''
  });

  useEffect(() => { fetchRoutes(); }, [search, statusFilter]);

  const fetchRoutes = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const response = await ofcApi.getAll(params);
      setRoutes(response.data);
    } catch { toast.error('Failed to load OFC routes'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      route_length: form.route_length ? parseFloat(form.route_length) : null,
      fiber_count: form.fiber_count ? parseInt(form.fiber_count) : null,
      core_utilization: form.core_utilization ? parseInt(form.core_utilization) : null,
    };
    try {
      if (editingRoute) { await ofcApi.update(editingRoute.id, payload); toast.success('Route updated'); }
      else { await ofcApi.create(payload); toast.success('Route created'); }
      setShowModal(false); resetForm(); fetchRoutes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Operation failed');
    }
  };

  const handleFiberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFiberRouteId) return;
    const payload = { ...fiberForm, fiber_number: parseInt(fiberForm.fiber_number) };
    try {
      if (editingFiber) {
        await ofcApi.updateFiber(activeFiberRouteId, editingFiber.id, payload);
        toast.success('Fiber updated');
      } else {
        await ofcApi.createFiber(activeFiberRouteId, payload);
        toast.success('Fiber added');
      }
      setShowFiberModal(false); resetFiberForm(); fetchRoutes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (route: OFCRoute) => {
    setEditingRoute(route);
    setForm({
      route_name: route.route_name, start_location: route.start_location,
      end_location: route.end_location, route_length: route.route_length?.toString() || '',
      fiber_count: route.fiber_count?.toString() || '',
      core_utilization: route.core_utilization?.toString() || '',
      status: route.status, remarks: route.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this OFC route and all its fiber data?')) return;
    try { await ofcApi.delete(id); toast.success('Route deleted'); fetchRoutes(); }
    catch { toast.error('Delete failed'); }
  };

  const handleDeleteFiber = async (routeId: number, fiberId: number) => {
    if (!confirm('Delete this fiber core?')) return;
    try { await ofcApi.deleteFiber(routeId, fiberId); toast.success('Fiber deleted'); fetchRoutes(); }
    catch { toast.error('Delete failed'); }
  };

  const handleExport = async () => {
    try {
      const response = await ofcApi.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', 'ofc_routes_export.xlsx');
      document.body.appendChild(link); link.click(); link.remove();
      toast.success('Export downloaded');
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const response = await ofcApi.import(file);
      toast.success(`Imported ${response.data.imported} routes`);
      if (response.data.errors?.length) toast.error(`${response.data.errors.length} rows had errors`);
      fetchRoutes();
    } catch { toast.error('Import failed'); }
    if (importRef.current) importRef.current.value = '';
  };

  const openFiberModal = (routeId: number, fiber?: FiberCore) => {
    setActiveFiberRouteId(routeId);
    if (fiber) {
      setEditingFiber(fiber);
      setFiberForm({
        fiber_number: fiber.fiber_number.toString(), color: fiber.color,
        status: fiber.status, from_to: fiber.from_to || '',
        connected_equipment: fiber.connected_equipment || '',
        port: fiber.port || '', remarks: fiber.remarks || ''
      });
    } else { resetFiberForm(); }
    setShowFiberModal(true);
  };

  const resetForm = () => { setEditingRoute(null); setForm({ route_name: '', start_location: '', end_location: '', route_length: '', fiber_count: '', core_utilization: '', status: 'active', remarks: '' }); };
  const resetFiberForm = () => { setEditingFiber(null); setFiberForm({ fiber_number: '', color: 'Blue', status: 'spare', from_to: '', connected_equipment: '', port: '', remarks: '' }); };

  // Compute summary stats
  const totalFibers = routes.reduce((sum, r) => sum + (r.fiber_cores?.length || 0), 0);
  const usedFibers = routes.reduce((sum, r) => sum + (r.fiber_cores?.filter(f => f.status === 'used').length || 0), 0);
  const spareFibers = routes.reduce((sum, r) => sum + (r.fiber_cores?.filter(f => f.status === 'spare').length || 0), 0);

  const getColorDot = (color: string) => {
    const colorMap: Record<string, string> = {
      Blue: '#3b82f6', Orange: '#f97316', Green: '#22c55e', Brown: '#92400e',
      Slate: '#64748b', White: '#e2e8f0', Red: '#ef4444', Black: '#1e293b',
      Yellow: '#eab308', Violet: '#8b5cf6', Aqua: '#06b6d4', Rose: '#f43f5e'
    };
    return colorMap[color] || '#6b7280';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>OFC Route Management</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage optical fiber cable routes and individual fiber cores
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300">
            <Download className="w-4 h-4" /> Export
          </button>
          {isAdmin && (
            <>
              <input type="file" ref={importRef} accept=".xlsx,.csv" onChange={handleImport} className="hidden" />
              <button onClick={() => importRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm border border-green-300 text-green-700 rounded-lg hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/30">
                <Upload className="w-4 h-4" /> Import
              </button>
              <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add Route
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Routes</p>
          <p className={`text-2xl font-bold text-blue-600`}>{routes.length}</p>
        </div>
        <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Fibers</p>
          <p className={`text-2xl font-bold text-purple-600`}>{totalFibers}</p>
        </div>
        <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Used Fibers</p>
          <p className={`text-2xl font-bold text-orange-600`}>{usedFibers}</p>
        </div>
        <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Spare Fibers</p>
          <p className={`text-2xl font-bold text-green-600`}>{spareFibers}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search routes..." value={search} onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500
              ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'}`} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="under_maintenance">Under Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Routes Table with Expandable Fiber Details */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Route / Path</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Length (km)</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Fibers</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Utilization</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : routes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No OFC routes found</td></tr>
              ) : (
                routes.map((route) => {
                  const isExpanded = expandedRoute === route.id;
                  const fiberCores = route.fiber_cores || [];
                  const usedCount = fiberCores.filter(f => f.status === 'used').length;
                  const totalCount = fiberCores.length;
                  const utilPct = totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : (route.core_utilization || 0);

                  return (
                    <>
                      <tr key={route.id} className={`cursor-pointer ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`} onClick={() => setExpandedRoute(isExpanded ? null : route.id)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            <div>
                              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {route.start_location} → {route.end_location}
                              </p>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{route.route_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{route.route_length || '-'}</td>
                        <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{totalCount || route.fiber_count || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${utilPct > 80 ? 'bg-red-500' : utilPct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(utilPct, 100)}%` }} />
                            </div>
                            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {utilPct}% ({usedCount}/{totalCount})
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={route.status} /></td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            {isAdmin && <button onClick={() => handleEdit(route)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/30" aria-label="Edit route"><Edit className="w-4 h-4" /></button>}
                            {isAdmin && <button onClick={() => handleDelete(route.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/30" aria-label="Delete route"><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Fiber Core Details */}
                      {isExpanded && (
                        <tr key={`${route.id}-fibers`}>
                          <td colSpan={6} className={`px-4 py-4 ${darkMode ? 'bg-gray-750' : 'bg-blue-50/50'}`}>
                            <div className={`rounded-lg border p-4 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-blue-200'}`}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className={`text-sm font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                                  Fiber Core Details ({totalCount} Fibers)
                                </h4>
                                {isAdmin && (
                                  <button onClick={() => openFiberModal(route.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <Plus className="w-3 h-3" /> Assign Fiber
                                  </button>
                                )}
                              </div>
                              {fiberCores.length === 0 ? (
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No fiber cores assigned. Click "Assign Fiber" to add.</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className={darkMode ? 'border-b border-gray-600' : 'border-b border-gray-200'}>
                                        <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>#</th>
                                        <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Color</th>
                                        <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                                        <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>From → To</th>
                                        <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Connected Equipment</th>
                                        <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Port</th>
                                        <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Remarks</th>
                                        <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Updated</th>
                                        {isAdmin && <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {fiberCores.map((fiber) => (
                                        <tr key={fiber.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                          <td className={`px-2 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fiber.fiber_number}</td>
                                          <td className="px-2 py-2">
                                            <div className="flex items-center gap-1.5">
                                              <span className="w-3 h-3 rounded-full inline-block border border-gray-300" style={{ backgroundColor: getColorDot(fiber.color) }}></span>
                                              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{fiber.color}</span>
                                            </div>
                                          </td>
                                          <td className="px-2 py-2"><StatusBadge status={fiber.status} /></td>
                                          <td className={`px-2 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fiber.from_to || 'Not Assigned'}</td>
                                          <td className={`px-2 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fiber.connected_equipment || '-'}</td>
                                          <td className={`px-2 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fiber.port || '-'}</td>
                                          <td className={`px-2 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{fiber.remarks || '-'}</td>
                                          <td className={`px-2 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {fiber.updated_at ? new Date(fiber.updated_at).toLocaleString() : '-'}
                                          </td>
                                          {isAdmin && (
                                            <td className="px-2 py-2">
                                              <div className="flex gap-1">
                                                <button onClick={() => openFiberModal(route.id, fiber)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" aria-label="Edit fiber"><Edit className="w-3 h-3" /></button>
                                                <button onClick={() => handleDeleteFiber(route.id, fiber.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" aria-label="Delete fiber"><Trash2 className="w-3 h-3" /></button>
                                              </div>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRoute ? 'Edit OFC Route' : 'Add OFC Route'} darkMode={darkMode}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Route Name*</label>
              <input required value={form.route_name} onChange={(e) => setForm({...form, route_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Station From*</label>
              <input required value={form.start_location} onChange={(e) => setForm({...form, start_location: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Station To*</label>
              <input required value={form.end_location} onChange={(e) => setForm({...form, end_location: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Route Length (km)</label>
              <input type="number" step="0.01" value={form.route_length} onChange={(e) => setForm({...form, route_length: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Fiber No.</label>
              <input type="number" value={form.fiber_count} onChange={(e) => setForm({...form, fiber_count: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}>
              <option value="active">Active</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Remarks</label>
            <textarea value={form.remarks} onChange={(e) => setForm({...form, remarks: e.target.value})} rows={2}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className={`px-4 py-2 text-sm rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300'}`}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingRoute ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Fiber Core Modal */}
      <Modal isOpen={showFiberModal} onClose={() => setShowFiberModal(false)} title={editingFiber ? 'Edit Fiber Core' : 'Assign Fiber Core'} darkMode={darkMode}>
        <form onSubmit={handleFiberSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fiber Number*</label>
              <input required type="number" min="1" value={fiberForm.fiber_number} onChange={(e) => setFiberForm({...fiberForm, fiber_number: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Color*</label>
              <select value={fiberForm.color} onChange={(e) => setFiberForm({...fiberForm, color: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}>
                {FIBER_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status*</label>
              <select value={fiberForm.status} onChange={(e) => setFiberForm({...fiberForm, status: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}>
                <option value="spare">Spare</option>
                <option value="used">Used</option>
                <option value="faulty">Faulty</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>From → To</label>
              <input value={fiberForm.from_to} onChange={(e) => setFiberForm({...fiberForm, from_to: e.target.value})} placeholder="e.g. OLT-A → ODF-1"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Connected Equipment</label>
              <input value={fiberForm.connected_equipment} onChange={(e) => setFiberForm({...fiberForm, connected_equipment: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Port</label>
              <input value={fiberForm.port} onChange={(e) => setFiberForm({...fiberForm, port: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Remarks</label>
            <textarea value={fiberForm.remarks} onChange={(e) => setFiberForm({...fiberForm, remarks: e.target.value})} rows={2}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowFiberModal(false)} className={`px-4 py-2 text-sm rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300'}`}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingFiber ? 'Update' : 'Assign'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
