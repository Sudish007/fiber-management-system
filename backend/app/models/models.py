from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, func
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), default="user", nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Port(Base):
    __tablename__ = "ports"

    id = Column(Integer, primary_key=True, index=True)
    equipment_name = Column(String(100), nullable=False)
    equipment_ip = Column(String(50), nullable=False)
    equipment_type = Column(String(50), nullable=False)
    port_number = Column(String(50), nullable=False)
    port_type = Column(String(50), nullable=False)
    fibre_tag = Column(String(50))
    ddf_name = Column(String(50))
    ddf_port = Column(String(50))
    status = Column(String(20), default="active")
    remarks = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class DDFLog(Base):
    __tablename__ = "ddf_log"

    id = Column(Integer, primary_key=True, index=True)
    ddf_name = Column(String(100), nullable=False)
    ddf_port = Column(String(50), nullable=False)
    connected_to = Column(String(100))
    connection_type = Column(String(50))
    status = Column(String(20), default="active")
    remarks = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class OFCRoute(Base):
    __tablename__ = "ofc_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_name = Column(String(100), nullable=False)
    start_location = Column(String(100), nullable=False)
    end_location = Column(String(100), nullable=False)
    route_length = Column(Numeric(10, 2))
    fiber_count = Column(Integer)
    core_utilization = Column(Integer)
    status = Column(String(20), default="active")
    remarks = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    action = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer)
    details = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
