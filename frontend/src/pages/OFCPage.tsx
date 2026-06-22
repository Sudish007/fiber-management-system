import { useEffect, useState } from 'react';
import { Plus, Search, Download, Edit, Trash2 } from 'lucide-react';
import { ofcApi } from '../services/api';
import { OFCRoute } from '../types';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

interface OFCPageProps {
  darkMode: boolean;
  isAdmin: boolean;
}

export default function OFCPage({ darkMode, isAdmin }: OFCPageProps) {
  const [routes, setRoutes] = useState<OFCRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<OFCRoute | null>(null);
  const [form, setForm] = useState({
    route_name: '', start_location: '', end_location: '',
    route_length: '', fiber_count: '', core_utilization: '',
    status: 'active', remarks: ''
  });

  useEffect(() => {
    fetchRoutes();
  }, [search, statusFilter]);

  const fetchRoutes = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const response = await ofcApi.getAll(params);
      setRoutes(response.data);
    } catch {
      toast.error('Failed to load OFC routes');
    } finally {
      setLoading(false);
    }
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
      if (editingRoute) {
        await ofcApi.update(editingRoute.id, payload);
        toast.success('OFC route updated');
      } else {
        await ofcApi.create(payload);
        toast.success('OFC route created');
      }
      setShowModal(false);
      resetForm();
      fetchRoutes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (route: OFCRoute) => {
    setEditingRoute(route);
    setForm({
      route_name: route.route_name,
      start_location: route.start_location,
      end_location: route.end_location,
      route_length: route.route_length?.toString() || '',
      fiber_count: route.fiber_count?.toString() || '',
      core_utilization: route.core_utilization?.toString() || '',
      status: route.status,
      remarks: route.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this OFC route?')) return;
    try {
      await ofcApi.delete(id);
      toast.success('OFC route deleted');
      fetchRoutes();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleExport = async () => {
    try {
      const response = await ofcApi.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ofc_routes_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const resetForm = () => {
    setEditingRoute(null);
    setForm({ route_name: '', start_location: '', end_location: '', route_length: '', fiber_count: '', core_utilization: '', status: 'active', remarks: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>OFC Route Management</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Optical Fiber Cable route planning and tracking
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300">
            <Download className="w-4 h-4" /> Export
          </button>
          {isAdmin && (
            <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Route
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search OFC routes..." value={search} onChange={(e) => setSearch(e.target.value)}
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

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Route Name</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>From → To</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Length (km)</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Fibers</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Utilization</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
                {isAdmin && <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : routes.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No OFC routes found</td></tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id} className={darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                    <td className={`px-4 py-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{route.route_name}</td>
                    <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="text-xs">{route.start_location}</div>
                      <div className="text-xs">→ {route.end_location}</div>
                    </td>
                    <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{route.route_length || '-'}</td>
                    <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{route.fiber_count || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (route.core_utilization || 0) > 80 ? 'bg-red-500' :
                              (route.core_utilization || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(route.core_utilization || 0, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {route.core_utilization || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={route.status} /></td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(route)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/30" aria-label="Edit route">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(route.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/30" aria-label="Delete route">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRoute ? 'Edit OFC Route' : 'Add OFC Route'} darkMode={darkMode}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Route Name*</label>
              <input required value={form.route_name} onChange={(e) => setForm({...form, route_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Start Location*</label>
              <input required value={form.start_location} onChange={(e) => setForm({...form, start_location: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>End Location*</label>
              <input required value={form.end_location} onChange={(e) => setForm({...form, end_location: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Route Length (km)</label>
              <input type="number" step="0.01" value={form.route_length} onChange={(e) => setForm({...form, route_length: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fiber Count</label>
              <input type="number" value={form.fiber_count} onChange={(e) => setForm({...form, fiber_count: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Core Utilization (%)</label>
              <input type="number" min="0" max="100" value={form.core_utilization} onChange={(e) => setForm({...form, core_utilization: e.target.value})}
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
            <button type="button" onClick={() => setShowModal(false)}
              className={`px-4 py-2 text-sm rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingRoute ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
