from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import io
import openpyxl
from ..database import get_db
from ..models.models import Port, AuditLog
from ..schemas.schemas import PortCreate, PortUpdate, PortResponse
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/api/ports", tags=["Ports"])


@router.get("", response_model=list[PortResponse])
def get_ports(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(Port)
    if status_filter:
        query = query.filter(Port.status == status_filter)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Port.equipment_name.ilike(search_term),
                Port.equipment_ip.ilike(search_term),
                Port.port_number.ilike(search_term),
                Port.fibre_tag.ilike(search_term),
                Port.ddf_name.ilike(search_term),
            )
        )
    return query.order_by(Port.created_at.desc()).all()


@router.get("/export")
def export_ports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    ports = db.query(Port).order_by(Port.created_at.desc()).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Ports"

    headers = [
        "ID", "Equipment Name", "Equipment IP", "Equipment Type",
        "Port Number", "Port Type", "Fibre Tag", "DDF Name",
        "DDF Port", "Status", "Remarks", "Created At"
    ]
    ws.append(headers)

    for port in ports:
        ws.append([
            port.id, port.equipment_name, port.equipment_ip,
            port.equipment_type, port.port_number, port.port_type,
            port.fibre_tag, port.ddf_name, port.ddf_port,
            port.status, port.remarks,
            port.created_at.strftime("%Y-%m-%d %H:%M") if port.created_at else ""
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ports_export.xlsx"}
    )


@router.get("/{port_id}", response_model=PortResponse)
def get_port(port_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    return port


@router.post("", response_model=PortResponse, status_code=status.HTTP_201_CREATED)
def create_port(port: PortCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_port = Port(**port.model_dump())
    db.add(db_port)
    db.commit()
    db.refresh(db_port)

    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity_type="port",
        entity_id=db_port.id,
        details=f"Created port {db_port.port_number} on {db_port.equipment_name}"
    )
    db.add(audit)
    db.commit()

    return db_port


@router.put("/{port_id}", response_model=PortResponse)
def update_port(port_id: int, port: PortUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_port = db.query(Port).filter(Port.id == port_id).first()
    if not db_port:
        raise HTTPException(status_code=404, detail="Port not found")

    update_data = port.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_port, key, value)

    db.commit()
    db.refresh(db_port)

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        entity_type="port",
        entity_id=db_port.id,
        details=f"Updated port {db_port.port_number}"
    )
    db.add(audit)
    db.commit()

    return db_port


@router.delete("/{port_id}")
def delete_port(port_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_port = db.query(Port).filter(Port.id == port_id).first()
    if not db_port:
        raise HTTPException(status_code=404, detail="Port not found")

    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE",
        entity_type="port",
        entity_id=db_port.id,
        details=f"Deleted port {db_port.port_number} from {db_port.equipment_name}"
    )
    db.add(audit)

    db.delete(db_port)
    db.commit()

    return {"message": "Port deleted successfully"}
