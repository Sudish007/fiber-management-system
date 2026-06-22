from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ============ User Schemas ============
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: Optional[str] = "user"


class UserResponse(UserBase):
    id: int
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str


class LoginRequest(BaseModel):
    username: str
    password: str


# ============ Port Schemas ============
class PortBase(BaseModel):
    equipment_name: str = Field(..., max_length=100)
    equipment_ip: str = Field(..., max_length=50)
    equipment_type: str = Field(..., max_length=50)
    port_number: str = Field(..., max_length=50)
    port_type: str = Field(..., max_length=50)
    fibre_tag: Optional[str] = None
    ddf_name: Optional[str] = None
    ddf_port: Optional[str] = None
    status: Optional[str] = "active"
    remarks: Optional[str] = None


class PortCreate(PortBase):
    pass


class PortUpdate(BaseModel):
    equipment_name: Optional[str] = None
    equipment_ip: Optional[str] = None
    equipment_type: Optional[str] = None
    port_number: Optional[str] = None
    port_type: Optional[str] = None
    fibre_tag: Optional[str] = None
    ddf_name: Optional[str] = None
    ddf_port: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None


class PortResponse(PortBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ DDF Schemas ============
class DDFBase(BaseModel):
    ddf_name: str = Field(..., max_length=100)
    ddf_port: str = Field(..., max_length=50)
    connected_to: Optional[str] = None
    connection_type: Optional[str] = None
    status: Optional[str] = "active"
    remarks: Optional[str] = None


class DDFCreate(DDFBase):
    pass


class DDFUpdate(BaseModel):
    ddf_name: Optional[str] = None
    ddf_port: Optional[str] = None
    connected_to: Optional[str] = None
    connection_type: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None


class DDFResponse(DDFBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ OFC Route Schemas ============
class OFCRouteBase(BaseModel):
    route_name: str = Field(..., max_length=100)
    start_location: str = Field(..., max_length=100)
    end_location: str = Field(..., max_length=100)
    route_length: Optional[float] = None
    fiber_count: Optional[int] = None
    core_utilization: Optional[int] = None
    status: Optional[str] = "active"
    remarks: Optional[str] = None


class OFCRouteCreate(OFCRouteBase):
    pass


class OFCRouteUpdate(BaseModel):
    route_name: Optional[str] = None
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    route_length: Optional[float] = None
    fiber_count: Optional[int] = None
    core_utilization: Optional[int] = None
    status: Optional[str] = None
    remarks: Optional[str] = None


class OFCRouteResponse(OFCRouteBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ Dashboard Schema ============
class DashboardResponse(BaseModel):
    total_ports: int
    active_ports: int
    ddf_connections: int
    ofc_routes: int
    utilization_percentage: float
    recent_activities: list


# ============ Audit Log Schema ============
class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    details: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
