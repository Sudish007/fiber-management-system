import { useEffect, useState, useRef } from 'react';
import { Plus, Search, Download, Upload, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { ddfApi } from '../services/api';
import { DDFRecord } from '../types';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

interface DDFPageProps {
  darkMode: boolean;
  isAdmin: boolean;
}

interface DDFGroup {
  ddf_name: string;
  records: DDFRecord[];
}

export default function DDFPage({ darkMode, isAdmin }: DDFPageProps) {
  const [records, setRecords] = useState<DDFRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DDFRecord | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    ddf_name: '', ddf_port: '', connected_to: '',
    connection_type: '', status: 'active', remarks: ''
  });

  useEffect(() => { fetchRecords(); }, [search, statusFilter]);

  const fetchRecords = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const response = await ddfApi.getAll(params);
      setRecords(response.data);
    } catch { toast.error('Failed to load DDF records'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecord) { await ddfApi.update(editingRecord.id, form); toast.success('DDF record updated'); }
      else { await ddfApi.create(form); toast.success('DDF record created'); }
      setShowModal(false); resetForm(); fetchRecords();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (record: DDFRecord) => {
    setEditingRecord(record);
    setForm({ ddf_name: record.ddf_name, ddf_port: record.ddf_port, connected_to: record.connected_to || '', connection_type: record.connection_type || '', status: record.status, remarks: record.remarks || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this DDF record?')) return;
    try { await ddfApi.delete(id); toast.success('DDF record deleted'); fetchRecords(); }
    catch { toast.error('Delete failed'); }
  };

  const handleExport = async () => {
    try {
      const response = await ddfApi.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', 'ddf_export.xlsx');
      document.body.appendChild(link); link.click(); link.remove();
      toast.success('Export downloaded');
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const response = await ddfApi.import(file);
      toast.success(`Imported ${response.data.imported} DDF records`);
      if (response.data.errors?.length) toast.error(`${response.data.errors.length} rows had errors`);
      fetchRecords();
    } catch { toast.error('Import failed'); }
    if (importRef.current) importRef.current.value = '';
  };

  const resetForm = () => { setEditingRecord(null); setForm({ ddf_name: '', ddf_port: '', connected_to: '', connection_type: '', status: 'active', remarks: '' }); };

  // Group by DDF Name
  const groups: DDFGroup[] = [];
  const groupMap = new Map<string, DDFGroup>();
  records.forEach(record => {
    if (!groupMap.has(record.ddf_name)) {
      const group: DDFGroup = { ddf_name: record.ddf_name, records: [] };
      groupMap.set(record.ddf_name, group);
      groups.push(group);
    }
    groupMap.get(record.ddf_name)!.records.push(record);
  });

  // Stats
  const totalFrames = groups.length;
  const totalConnections = records.length;
  const activeConnections = records.filter(r => r.status === 'active').length;
  const faultyConnections = records.filter(r => r.status === 'faulty').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>DDF Management</h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Digital Distribution Frame connections</p>
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
                <Plus className="w-4 h-4" /> Add DDF Record
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>DDF Frames</p>
          <p className="text-2xl font-bold text-blue-600">{totalFrames}</p>
        </div>
        <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Connections</p>
          <p className="text-2xl font-bold text-purple-600">{totalConnections}</p>
        </div>
        <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Active</p>
          <p className="text-2xl font-bold text-green-600">{activeConnections}</p>
        </div>
        <div className={`rounded-xl p-4 border text-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Faulty</p>
          <p className="text-2xl font-bold text-red-600">{faultyConnections}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search DDF..." value={search} onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'}`} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="faulty">Faulty</option>
        </select>
      </div>

      {/* Grouped Table */}
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>DDF Frame</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Ports</th>
                <th className={`px-4 py-3 text-left font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {loading ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : groups.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No DDF records found</td></tr>
              ) : (
                groups.map((group) => {
                  const isExpanded = expandedGroup === group.ddf_name;
                  const activeCount = group.records.filter(r => r.status === 'active').length;
                  const faultyCount = group.records.filter(r => r.status === 'faulty').length;

                  return (
                    <>
                      <tr key={group.ddf_name} className={`cursor-pointer ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                        onClick={() => setExpandedGroup(isExpanded ? null : group.ddf_name)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{group.ddf_name}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{group.records.length} connections</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {activeCount > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{activeCount} active</span>}
                            {faultyCount > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{faultyCount} faulty</span>}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${group.ddf_name}-details`}>
                          <td colSpan={3} className={`px-4 py-3 ${darkMode ? 'bg-gray-750' : 'bg-blue-50/30'}`}>
                            <div className={`rounded-lg border p-3 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                    <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Port</th>
                                    <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Connected To</th>
                                    <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type</th>
                                    <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                                    <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Remarks</th>
                                    {isAdmin && <th className={`px-2 py-2 text-left font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.records.map((record) => (
                                    <tr key={record.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                      <td className={`px-2 py-2 font-mono ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{record.ddf_port}</td>
                                      <td className={`px-2 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{record.connected_to || '-'}</td>
                                      <td className={`px-2 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{record.connection_type || '-'}</td>
                                      <td className="px-2 py-2"><StatusBadge status={record.status} /></td>
                                      <td className={`px-2 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{record.remarks || '-'}</td>
                                      {isAdmin && (
                                        <td className="px-2 py-2">
                                          <div className="flex gap-1">
                                            <button onClick={() => handleEdit(record)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" aria-label="Edit"><Edit className="w-3 h-3" /></button>
                                            <button onClick={() => handleDelete(record.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" aria-label="Delete"><Trash2 className="w-3 h-3" /></button>
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRecord ? 'Edit DDF Record' : 'Add DDF Record'} darkMode={darkMode}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>DDF Name*</label>
              <input required value={form.ddf_name} onChange={(e) => setForm({...form, ddf_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>DDF Port*</label>
              <input required value={form.ddf_port} onChange={(e) => setForm({...form, ddf_port: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Connected To</label>
              <input value={form.connected_to} onChange={(e) => setForm({...form, connected_to: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Connection Type</label>
              <input value={form.connection_type} onChange={(e) => setForm({...form, connection_type: e.target.value})} placeholder="e.g., SC/APC, LC/UPC"
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
            <button type="button" onClick={() => setShowModal(false)} className={`px-4 py-2 text-sm rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300'}`}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingRecord ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
