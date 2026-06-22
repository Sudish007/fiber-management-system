from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import io
import openpyxl
from ..database import get_db
from ..models.models import DDFLog, AuditLog
from ..schemas.schemas import DDFCreate, DDFUpdate, DDFResponse
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/api/ddf", tags=["DDF Management"])


@router.get("", response_model=list[DDFResponse])
def get_ddf_records(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(DDFLog)
    if status_filter:
        query = query.filter(DDFLog.status == status_filter)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                DDFLog.ddf_name.ilike(search_term),
                DDFLog.ddf_port.ilike(search_term),
                DDFLog.connected_to.ilike(search_term),
            )
        )
    return query.order_by(DDFLog.created_at.desc()).all()


@router.get("/export")
def export_ddf(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    records = db.query(DDFLog).order_by(DDFLog.created_at.desc()).all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "DDF Records"

    headers = ["ID", "DDF Name", "DDF Port", "Connected To", "Connection Type", "Status", "Remarks", "Created At"]
    ws.append(headers)

    for record in records:
        ws.append([
            record.id, record.ddf_name, record.ddf_port,
            record.connected_to, record.connection_type,
            record.status, record.remarks,
            record.created_at.strftime("%Y-%m-%d %H:%M") if record.created_at else ""
        ])

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=ddf_export.xlsx"}
    )


@router.get("/{ddf_id}", response_model=DDFResponse)
def get_ddf(ddf_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    record = db.query(DDFLog).filter(DDFLog.id == ddf_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="DDF record not found")
    return record


@router.post("", response_model=DDFResponse, status_code=status.HTTP_201_CREATED)
def create_ddf(ddf: DDFCreate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_ddf = DDFLog(**ddf.model_dump())
    db.add(db_ddf)
    db.commit()
    db.refresh(db_ddf)

    audit = AuditLog(
        user_id=current_user.id,
        action="CREATE",
        entity_type="ddf",
        entity_id=db_ddf.id,
        details=f"Created DDF record {db_ddf.ddf_name}:{db_ddf.ddf_port}"
    )
    db.add(audit)
    db.commit()

    return db_ddf


@router.put("/{ddf_id}", response_model=DDFResponse)
def update_ddf(ddf_id: int, ddf: DDFUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_ddf = db.query(DDFLog).filter(DDFLog.id == ddf_id).first()
    if not db_ddf:
        raise HTTPException(status_code=404, detail="DDF record not found")

    update_data = ddf.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ddf, key, value)

    db.commit()
    db.refresh(db_ddf)

    audit = AuditLog(
        user_id=current_user.id,
        action="UPDATE",
        entity_type="ddf",
        entity_id=db_ddf.id,
        details=f"Updated DDF record {db_ddf.ddf_name}:{db_ddf.ddf_port}"
    )
    db.add(audit)
    db.commit()

    return db_ddf


@router.delete("/{ddf_id}")
def delete_ddf(ddf_id: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    db_ddf = db.query(DDFLog).filter(DDFLog.id == ddf_id).first()
    if not db_ddf:
        raise HTTPException(status_code=404, detail="DDF record not found")

    audit = AuditLog(
        user_id=current_user.id,
        action="DELETE",
        entity_type="ddf",
        entity_id=db_ddf.id,
        details=f"Deleted DDF record {db_ddf.ddf_name}:{db_ddf.ddf_port}"
    )
    db.add(audit)

    db.delete(db_ddf)
    db.commit()

    return {"message": "DDF record deleted successfully"}
