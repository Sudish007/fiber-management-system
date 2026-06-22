import { useState } from 'react';
import { Search, Network, Cable, Route } from 'lucide-react';
import { searchApi } from '../services/api';
import { SearchResults } from '../types';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

interface SearchPageProps {
  darkMode: boolean;
}

export default function SearchPage({ darkMode }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await searchApi.search(query);
      setResults(response.data);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Global Search</h1>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Search across ports, DDF records, and OFC routes
        </p>
      </div>

      {/* Search box */}
      <form onSubmit={handleSearch} className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by equipment name, IP, port number, fibre tag, route name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500
                ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200'}`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Found {results.total_count} results for "{results.query}"
          </p>

          {/* Ports */}
          {results.results.ports.length > 0 && (
            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-4 h-4 text-blue-600" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Ports ({results.results.ports.length})
                </h3>
              </div>
              <div className="space-y-2">
                {results.results.ports.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.equipment_name}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        IP: {item.equipment_ip} | Port: {item.port_number} | Tag: {item.fibre_tag || 'N/A'}
                      </p>
                    </div>
                    <StatusBadge status={item.status as string} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DDF */}
          {results.results.ddf.length > 0 && (
            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Cable className="w-4 h-4 text-purple-600" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  DDF Records ({results.results.ddf.length})
                </h3>
              </div>
              <div className="space-y-2">
                {results.results.ddf.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.ddf_name}:{item.ddf_port}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Connected to: {item.connected_to || 'N/A'}
                      </p>
                    </div>
                    <StatusBadge status={item.status as string} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OFC Routes */}
          {results.results.ofc_routes.length > 0 && (
            <div className={`rounded-xl border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Route className="w-4 h-4 text-orange-600" />
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  OFC Routes ({results.results.ofc_routes.length})
                </h3>
              </div>
              <div className="space-y-2">
                {results.results.ofc_routes.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.route_name}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.start_location} → {item.end_location}
                      </p>
                    </div>
                    <StatusBadge status={item.status as string} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.total_count === 0 && (
            <div className={`text-center py-12 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No results found for "{results.query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
