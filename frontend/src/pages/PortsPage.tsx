import { useEffect, useState } from 'react';
import { Plus, Search, Download, Edit, Trash2 } from 'lucide-react';
import { portsApi } from '../services/api';
import { Port } from '../types';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

interface PortsPageProps {
  darkMode: boolean;
  isAdmin: boolean;
}

export default function PortsPage({ darkMode, isAdmin }: PortsPageProps) {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [form, setForm] = useState({
    equipment_name: '', equipment_ip: '', equipment_type: '',
    port_number: '', port_type: '', fibre_tag: '',
    ddf_name: '', ddf_port: '', status: 'active', remarks: ''
  });

  useEffect(() => {
    fetchPorts();
  }, [search, statusFilter]);

  const fetchPorts = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const response = await portsApi.getAll(params);
      setPorts(response.data);
    } catch {
      toast.error('Failed to load ports');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPort) {
        await portsApi.update(editingPort.id, form);
        toast.success('Port updated');
      } else {
        await portsApi.create(form);
        toast.success('Port created');
      }
      setShowModal(false);
      resetForm();
      fetchPorts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (port: Port) => {
    setEditingPort(port);
    setForm({
      equipment_name: port.equipment_name,
      equipment_ip: port.equipment_ip,
      equipment_type: port.equipment_type,
      port_number: port.port_number,
      port_type: port.port_type,
      fibre_tag: port.fibre_tag || '',
      ddf_name: port.ddf_name || '',
      ddf_port: port.ddf_port || '',
      status: port.status,
      remarks: port.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this port?')) return;
    try {
      await portsApi.delete(id);
      toast.success('Port deleted');
      fetchPorts();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleExport = async () => {
    try {
      const response = await portsApi.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ports_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const resetForm = () => {
    setEditingPort(null);
    setForm({
      equipment_name: '', equipment_ip: '', equipment_type: '',
      port_number: '', port_type: '', fibre_tag: '',
      ddf_name: '', ddf_port: '', status: 'active', remarks: ''
    });
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Port Management</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage equipment ports and fiber connections
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300">
            <Download className="w-4 h-4" /> Export
          </button>
          {isAdmin && (
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add Port
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500
              ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm outline-none
            ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="faulty">Faulty</option>
        </select>
      </div>

      {/* Table */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Equipment</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>IP</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Port</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Fibre Tag</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>DDF</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
                {isAdmin && <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>}
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : ports.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No ports found</td></tr>
              ) : (
                ports.map((port) => (
                  <tr key={port.id} className={darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                    <td className={`px-4 py-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <div className="font-medium">{port.equipment_name}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{port.equipment_type}</div>
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{port.equipment_ip}</td>
                    <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div>{port.port_number}</div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{port.port_type}</div>
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{port.fibre_tag || '-'}</td>
                    <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {port.ddf_name ? `${port.ddf_name}:${port.ddf_port}` : '-'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={port.status} /></td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(port)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-blue-900/30" aria-label="Edit port">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(port.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:hover:bg-red-900/30" aria-label="Delete port">
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPort ? 'Edit Port' : 'Add Port'} darkMode={darkMode}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Equipment Name*</label>
              <input required value={form.equipment_name} onChange={(e) => setForm({...form, equipment_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Equipment IP*</label>
              <input required value={form.equipment_ip} onChange={(e) => setForm({...form, equipment_ip: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Equipment Type*</label>
              <input required value={form.equipment_type} onChange={(e) => setForm({...form, equipment_type: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Port Number*</label>
              <input required value={form.port_number} onChange={(e) => setForm({...form, port_number: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Port Type*</label>
              <input required value={form.port_type} onChange={(e) => setForm({...form, port_type: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fibre Tag</label>
              <input value={form.fibre_tag} onChange={(e) => setForm({...form, fibre_tag: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>DDF Name</label>
              <input value={form.ddf_name} onChange={(e) => setForm({...form, ddf_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>DDF Port</label>
              <input value={form.ddf_port} onChange={(e) => setForm({...form, ddf_port: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
            <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="faulty">Faulty</option>
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
              {editingPort ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
