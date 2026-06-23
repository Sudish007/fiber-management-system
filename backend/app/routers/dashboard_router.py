from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.models import Port, DDFLog, OFCRoute, FiberCore, AuditLog
from ..schemas.schemas import DashboardResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["Dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    total_ports = db.query(func.count(Port.id)).scalar() or 0
    active_ports = db.query(func.count(Port.id)).filter(Port.status == "active").scalar() or 0
    ddf_connections = db.query(func.count(DDFLog.id)).scalar() or 0
    ofc_routes = db.query(func.count(OFCRoute.id)).scalar() or 0

    # Fiber core stats
    total_fibers = db.query(func.count(FiberCore.id)).scalar() or 0
    used_fibers = db.query(func.count(FiberCore.id)).filter(FiberCore.status == "used").scalar() or 0
    spare_fibers = db.query(func.count(FiberCore.id)).filter(FiberCore.status == "spare").scalar() or 0

    # Calculate utilization
    utilization_percentage = round((used_fibers / total_fibers * 100), 1) if total_fibers > 0 else 0.0

    # Recent activities from audit logs
    recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(10).all()
    recent_activities = [
        {
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in recent_logs
    ]

    return DashboardResponse(
        total_ports=total_ports,
        active_ports=active_ports,
        ddf_connections=ddf_connections,
        ofc_routes=ofc_routes,
        utilization_percentage=utilization_percentage,
        total_fibers=total_fibers,
        used_fibers=used_fibers,
        spare_fibers=spare_fibers,
        recent_activities=recent_activities
    )
