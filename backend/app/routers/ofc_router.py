from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import io
import openpyxl
from ..database import get_db
from ..models.models import OFCRoute, AuditLog
from ..schemas.schemas import OFCRouteCreate, OFCRouteUpdate, OFCRouteResponse
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/api/ofc", tags=["OFC Routes"])


@router.get("", response_model=list[OFCRouteResponse])
def get_ofc_routes(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(OFCRoute)
    if status_filter:
        query = query.filter(OFCRoute.status == status_filter)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                OFCRoute.route_name.ilike(search_term),
                OFCRoute.start_location.ilike(search_term),
                OFCRoute.end_location.ilike(search_term),
            )
        )
    return query.order_by(OFCRoute.created_at.desc()).all()


@router.get("/export")
def export_ofc(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    routes = db.query(OFCRoute).order_by(OFCRoute.created_at.desc()).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "OFC Routes"

    headers = [
        "ID", "Route Name", "Start Location", "End Location",
        "Route Length (km)", "Fiber Count", "Core Utilization (%)",
        "Status", "Remarks", "Created At"
    ]
    ws.append(headers)

    for route in routes:
        ws.append([
            route.id, route.route_name, route.start_location,
            route.end_location, float(route.route_length) if route.route_length else 0,
            route.fiber_count, route.core_utilization,
            route.status, route.remarks,
            route.created_at.strftime("%Y-%m-%d %H:%M") if route.created_at else ""
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ofc_routes_export.xlsx"}
    )


@router.get("/{ofc_id}", response_model=OFCRouteResponse)
def get_ofc_route(ofc_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    route = db.query(OFCRoute).filter(OFCRoute.id == ofc_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="OFC Route not found")
    return route


@router.post("", response_model=OFCRouteResponse, status_code=status.HTTP_201_CREATED)
def create_ofc_route(route: OFCRouteCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_route = OFCRoute(**route.model_dump())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)

    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity_type="ofc_route",
        entity_id=db_route.id,
        details=f"Created OFC route {db_route.route_name}"
    )
    db.add(audit)
    db.commit()

    return db_route


@router.put("/{ofc_id}", response_model=OFCRouteResponse)
def update_ofc_route(ofc_id: int, route: OFCRouteUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_route = db.query(OFCRoute).filter(OFCRoute.id == ofc_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="OFC Route not found")

    update_data = route.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_route, key, value)

    db.commit()
    db.refresh(db_route)

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        entity_type="ofc_route",
        entity_id=db_route.id,
        details=f"Updated OFC route {db_route.route_name}"
    )
    db.add(audit)
    db.commit()

    return db_route


@router.delete("/{ofc_id}")
def delete_ofc_route(ofc_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_route = db.query(OFCRoute).filter(OFCRoute.id == ofc_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="OFC Route not found")

    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE",
        entity_type="ofc_route",
        entity_id=db_route.id,
        details=f"Deleted OFC route {db_route.route_name}"
    )
    db.add(audit)

    db.delete(db_route)
    db.commit()

    return {"message": "OFC Route deleted successfully"}
