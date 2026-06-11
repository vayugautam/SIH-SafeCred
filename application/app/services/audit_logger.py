import hashlib
import json
import io
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

from app.models.db_models import AuditTrail

class AuditLogger:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def log(self, entity_type: str, entity_id: str, action: str, actor_id: str, actor_role: str,
                  old_val: Optional[Dict[str, Any]] = None, new_val: Optional[Dict[str, Any]] = None, 
                  reason: str = None, ip_address: str = None, request_id: str = None) -> AuditTrail:
        
        # 1. Fetch previous record hash to maintain the chain
        stmt = select(AuditTrail.hash).where(AuditTrail.entity_id == entity_id).order_by(AuditTrail.created_at.desc()).limit(1)
        result = await self.session.execute(stmt)
        prev_hash = result.scalar_one_or_none() or "GENESIS_HASH"
        
        # 2. Build deterministic record dict for hashing
        record_content = {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            "actor_id": actor_id,
            "actor_role": actor_role,
            "old_value": old_val or {},
            "new_value": new_val or {},
            "reason": reason or ""
        }
        # JSON dump with sorted keys ensures exact deterministic string matching
        record_json = json.dumps(record_content, sort_keys=True)
        
        # 3. Hash computation: SHA256(previous_hash + current_content)
        current_hash = hashlib.sha256((prev_hash + record_json).encode('utf-8')).hexdigest()
        
        # 4. Insert into database
        record = AuditTrail(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor_id=actor_id,
            actor_role=actor_role,
            old_value=old_val,
            new_value=new_val,
            reason=reason,
            ip_address=ip_address,
            request_id=request_id,
            hash=current_hash
        )
        self.session.add(record)
        await self.session.flush() # Flush to capture any generated fields if needed
        return record

    async def verify_chain(self, entity_id: str) -> bool:
        """Validates the SHA-256 integrity chain for a specific entity."""
        stmt = select(AuditTrail).where(AuditTrail.entity_id == entity_id).order_by(asc(AuditTrail.created_at))
        result = await self.session.execute(stmt)
        records = result.scalars().all()
        
        if not records:
            return True # Empty chain is technically valid
            
        prev_hash = "GENESIS_HASH"
        for r in records:
            content = {
                "entity_type": r.entity_type,
                "entity_id": r.entity_id,
                "action": r.action,
                "actor_id": r.actor_id,
                "actor_role": r.actor_role,
                "old_value": r.old_value or {},
                "new_value": r.new_value or {},
                "reason": r.reason or ""
            }
            record_json = json.dumps(content, sort_keys=True)
            expected_hash = hashlib.sha256((prev_hash + record_json).encode('utf-8')).hexdigest()
            
            if expected_hash != r.hash:
                return False # Chain broken!
                
            prev_hash = r.hash
            
        return True

    async def export_pdf_report(self, entity_id: str, start_date: datetime, end_date: datetime) -> bytes:
        """Generates a tabular PDF report for audit compliance."""
        stmt = select(AuditTrail).where(
            AuditTrail.entity_id == entity_id,
            AuditTrail.created_at >= start_date,
            AuditTrail.created_at <= end_date
        ).order_by(asc(AuditTrail.created_at))
        
        result = await self.session.execute(stmt)
        records = result.scalars().all()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        
        styles = getSampleStyleSheet()
        elements = [Paragraph(f"Audit Trail Compliance Report: Entity {entity_id}", styles['Title']), Paragraph("<br/><br/>", styles['Normal'])]
        
        # Table Header
        data = [["Timestamp", "Action", "Actor", "Role", "Reason", "Chain Hash"]]
        
        for r in records:
            # Format timestamp safely
            ts = r.created_at.strftime('%Y-%m-%d %H:%M:%S') if r.created_at else "Pending"
            
            data.append([
                ts, 
                r.action, 
                r.actor_id, 
                r.actor_role or "N/A", 
                str(r.reason)[:30] + ("..." if r.reason and len(str(r.reason)) > 30 else ""), 
                r.hash[:12] + "..."
            ])
            
        # Format Table
        t = Table(data, colWidths=[100, 100, 80, 80, 100, 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,0), 12),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f9f9f9'), colors.HexColor('#ffffff')])
        ]))
        
        elements.append(t)
        doc.build(elements)
        
        return buffer.getvalue()
