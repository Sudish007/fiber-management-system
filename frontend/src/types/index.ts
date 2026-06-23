export interface User {
  id: number;
  username: string;
  role: string;
  created_at?: string;
}

export interface Port {
  id: number;
  equipment_name: string;
  equipment_ip: string;
  equipment_type: string;
  port_number: string;
  port_type: string;
  fibre_tag?: string;
  ddf_name?: string;
  ddf_port?: string;
  status: string;
  remarks?: string;
  created_at?: string;
}

export interface DDFRecord {
  id: number;
  ddf_name: string;
  ddf_port: string;
  connected_to?: string;
  connection_type?: string;
  status: string;
  remarks?: string;
  created_at?: string;
}

export interface OFCRoute {
  id: number;
  route_name: string;
  start_location: string;
  end_location: string;
  route_length?: number;
  fiber_count?: number;
  core_utilization?: number;
  status: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  fiber_cores: FiberCore[];
}

export interface FiberCore {
  id: number;
  route_id: number;
  fiber_number: number;
  color: string;
  status: string;
  from_to?: string;
  connected_equipment?: string;
  port?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardData {
  total_ports: number;
  active_ports: number;
  ddf_connections: number;
  ofc_routes: number;
  utilization_percentage: number;
  total_fibers: number;
  used_fibers: number;
  spare_fibers: number;
  recent_activities: Activity[];
}

export interface Activity {
  id: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: string;
  created_at?: string;
}

export interface SearchResults {
  query: string;
  results: {
    ports: SearchResultItem[];
    ddf: SearchResultItem[];
    ofc_routes: SearchResultItem[];
  };
  total_count: number;
}

export interface SearchResultItem {
  id: number;
  type: string;
  [key: string]: string | number | undefined;
}

export interface AuthState {
  token: string | null;
  username: string | null;
  role: string | null;
  isAuthenticated: boolean;
}
