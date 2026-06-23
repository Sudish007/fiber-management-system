from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
import io
import openpyxl
from ..database import get_db
from ..models.models import OFCRoute, FiberCore, AuditLog
from ..schemas.schemas import (
    OFCRouteCreate, OFCRouteUpdate, OFCRouteResponse,
    FiberCoreCreate, FiberCoreUpdate, FiberCoreResponse, ImportResponse
)
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/api/ofc", tags=["OFC Routes"])


@router.get("", response_model=list[OFCRouteResponse])
def get_ofc_routes(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(OFCRoute).options(joinedload(OFCRoute.fiber_cores))
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
    routes = db.query(OFCRoute).options(joinedload(OFCRoute.fiber_cores)).order_by(OFCRoute.created_at.desc()).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "OFC Routes"

    headers = [
        "Route Name", "Start Location", "End Location",
        "Route Length (km)", "Fiber Count", "Core Utilization (%)",
        "Status", "Remarks", "Created At"
    ]
    ws.append(headers)

    for route in routes:
        ws.append([
            route.route_name, route.start_location,
            route.end_location, float(route.route_length) if route.route_length else 0,
            route.fiber_count, route.core_utilization,
            route.status, route.remarks,
            route.created_at.strftime("%Y-%m-%d %H:%M") if route.created_at else ""
        ])

    # Second sheet for fiber cores
    ws2 = wb.create_sheet("Fiber Cores")
    fiber_headers = [
        "Route Name", "Fiber Number", "Color", "Status",
        "From → To", "Connected Equipment", "Port", "Remarks", "Updated At"
    ]
    ws2.append(fiber_headers)

    for route in routes:
        for core in route.fiber_cores:
            ws2.append([
                route.route_name, core.fiber_number, core.color,
                core.status, core.from_to, core.connected_equipment,
                core.port, core.remarks,
                core.updated_at.strftime("%Y-%m-%d %H:%M") if core.updated_at else ""
            ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ofc_routes_export.xlsx"}
    )


@router.post("/import", response_model=ImportResponse)
async def import_ofc(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin)
):
    if not file.filename.endswith(('.xlsx', '.csv')):
        raise HTTPException(status_code=400, detail="Only .xlsx or .csv files are accepted")

    content = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(content))
    ws = wb.active

    imported = 0
    errors = []
    rows = list(ws.iter_rows(min_row=2, values_only=True))

    for i, row in enumerate(rows, start=2):
        try:
            if not row[0]:
                continue
            route = OFCRoute(
                route_name=str(row[0]) if row[0] else "",
                start_location=str(row[1]) if row[1] else "",
                end_location=str(row[2]) if row[2] else "",
                route_length=float(row[3]) if row[3] else None,
                fiber_count=int(row[4]) if row[4] else None,
                core_utilization=int(row[5]) if row[5] else None,
                status=str(row[6]) if row[6] else "active",
                remarks=str(row[7]) if len(row) > 7 and row[7] else None,
            )
            db.add(route)
            imported += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        action="IMPORT",
        entity_type="ofc_route",
        details=f"Imported {imported} OFC routes from {file.filename}"
    )
    db.add(audit)
    db.commit()

    return ImportResponse(imported=imported, errors=errors)


@router.get("/{ofc_id}", response_model=OFCRouteResponse)
def get_ofc_route(ofc_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    route = db.query(OFCRoute).options(joinedload(OFCRoute.fiber_cores)).filter(OFCRoute.id == ofc_id).first()
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


# ============ Fiber Core Endpoints ============

@router.get("/{ofc_id}/fibers", response_model=list[FiberCoreResponse])
def get_fiber_cores(ofc_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    route = db.query(OFCRoute).filter(OFCRoute.id == ofc_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="OFC Route not found")
    return db.query(FiberCore).filter(FiberCore.route_id == ofc_id).order_by(FiberCore.fiber_number).all()


@router.post("/{ofc_id}/fibers", response_model=FiberCoreResponse, status_code=status.HTTP_201_CREATED)
def create_fiber_core(ofc_id: int, fiber: FiberCoreCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    route = db.query(OFCRoute).filter(OFCRoute.id == ofc_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="OFC Route not found")

    db_fiber = FiberCore(route_id=ofc_id, **fiber.model_dump())
    db.add(db_fiber)
    db.commit()
    db.refresh(db_fiber)

    # Update route utilization
    used_count = db.query(FiberCore).filter(FiberCore.route_id == ofc_id, FiberCore.status == "used").count()
    total_count = db.query(FiberCore).filter(FiberCore.route_id == ofc_id).count()
    route.core_utilization = int((used_count / total_count) * 100) if total_count > 0 else 0
    route.fiber_count = total_count
    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity_type="fiber_core",
        entity_id=db_fiber.id,
        details=f"Added fiber #{fiber.fiber_number} ({fiber.color}) to route {route.route_name}"
    )
    db.add(audit)
    db.commit()

    return db_fiber


@router.put("/{ofc_id}/fibers/{fiber_id}", response_model=FiberCoreResponse)
def update_fiber_core(ofc_id: int, fiber_id: int, fiber: FiberCoreUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_fiber = db.query(FiberCore).filter(FiberCore.id == fiber_id, FiberCore.route_id == ofc_id).first()
    if not db_fiber:
        raise HTTPException(status_code=404, detail="Fiber core not found")

    update_data = fiber.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_fiber, key, value)

    db.commit()
    db.refresh(db_fiber)

    # Update route utilization
    route = db.query(OFCRoute).filter(OFCRoute.id == ofc_id).first()
    used_count = db.query(FiberCore).filter(FiberCore.route_id == ofc_id, FiberCore.status == "used").count()
    total_count = db.query(FiberCore).filter(FiberCore.route_id == ofc_id).count()
    route.core_utilization = int((used_count / total_count) * 100) if total_count > 0 else 0
    db.commit()

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        entity_type="fiber_core",
        entity_id=db_fiber.id,
        details=f"Updated fiber #{db_fiber.fiber_number} on route {route.route_name}"
    )
    db.add(audit)
    db.commit()

    return db_fiber


@router.delete("/{ofc_id}/fibers/{fiber_id}")
def delete_fiber_core(ofc_id: int, fiber_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_fiber = db.query(FiberCore).filter(FiberCore.id == fiber_id, FiberCore.route_id == ofc_id).first()
    if not db_fiber:
        raise HTTPException(status_code=404, detail="Fiber core not found")

    route = db.query(OFCRoute).filter(OFCRoute.id == ofc_id).first()

    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE",
        entity_type="fiber_core",
        entity_id=db_fiber.id,
        details=f"Deleted fiber #{db_fiber.fiber_number} from route {route.route_name}"
    )
    db.add(audit)

    db.delete(db_fiber)
    db.commit()

    # Update route utilization
    used_count = db.query(FiberCore).filter(FiberCore.route_id == ofc_id, FiberCore.status == "used").count()
    total_count = db.query(FiberCore).filter(FiberCore.route_id == ofc_id).count()
    route.core_utilization = int((used_count / total_count) * 100) if total_count > 0 else 0
    route.fiber_count = total_count
    db.commit()

    return {"message": "Fiber core deleted successfully"}
