from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models.models import Port, DDFLog, OFCRoute
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["Search"])


@router.get("/search")
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    search_term = f"%{q}%"

    # Search ports
    ports = db.query(Port).filter(
        or_(
            Port.equipment_name.ilike(search_term),
            Port.equipment_ip.ilike(search_term),
            Port.port_number.ilike(search_term),
            Port.fibre_tag.ilike(search_term),
            Port.ddf_name.ilike(search_term),
        )
    ).limit(20).all()

    # Search DDF
    ddf_records = db.query(DDFLog).filter(
        or_(
            DDFLog.ddf_name.ilike(search_term),
            DDFLog.ddf_port.ilike(search_term),
            DDFLog.connected_to.ilike(search_term),
        )
    ).limit(20).all()

    # Search OFC Routes
    ofc_routes = db.query(OFCRoute).filter(
        or_(
            OFCRoute.route_name.ilike(search_term),
            OFCRoute.start_location.ilike(search_term),
            OFCRoute.end_location.ilike(search_term),
        )
    ).limit(20).all()

    return {
        "query": q,
        "results": {
            "ports": [
                {
                    "id": p.id,
                    "type": "port",
                    "equipment_name": p.equipment_name,
                    "equipment_ip": p.equipment_ip,
                    "port_number": p.port_number,
                    "fibre_tag": p.fibre_tag,
                    "status": p.status
                } for p in ports
            ],
            "ddf": [
                {
                    "id": d.id,
                    "type": "ddf",
                    "ddf_name": d.ddf_name,
                    "ddf_port": d.ddf_port,
                    "connected_to": d.connected_to,
                    "status": d.status
                } for d in ddf_records
            ],
            "ofc_routes": [
                {
                    "id": r.id,
                    "type": "ofc_route",
                    "route_name": r.route_name,
                    "start_location": r.start_location,
                    "end_location": r.end_location,
                    "status": r.status
                } for r in ofc_routes
            ]
        },
        "total_count": len(ports) + len(ddf_records) + len(ofc_routes)
    }
