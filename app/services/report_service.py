"""
Report Service — aggregates Attendance/Activity data into pandas DataFrames
and exports to CSV, Excel, and PDF under media/reports/.
Sync-first (no Celery yet) — Phase 9 Step A. Celery wrap comes later.
"""
import uuid
from datetime import date, datetime, time
from pathlib import Path
from typing import Optional, List
from uuid import UUID

import pandas as pd
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.activity_repository import ActivityRepository
from app.core.constants import ActivityType

# Activity types treated as "security incidents" for the incident report
INCIDENT_TYPES = [
    ActivityType.UNAUTHORIZED_ACCESS,
    ActivityType.RESTRICTED_AREA_VIOLATION,
    ActivityType.SUSPICIOUS_ACTIVITY,
    ActivityType.UNKNOWN_PERSON_DETECTED,
]


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.attendance_repo = AttendanceRepository(db)
        self.activity_repo = ActivityRepository(db)
        self.reports_dir = Path("media") / "reports"
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    # -----------------------------------------------------------------------
    # DATA AGGREGATION
    # -----------------------------------------------------------------------

    async def _attendance_dataframe(
        self,
        date_from: date,
        date_to: date,
        department_id: Optional[UUID] = None,
        employee_id: Optional[UUID] = None,
    ) -> pd.DataFrame:
        rows = await self.attendance_repo.list_by_date_range(
            date_from=date_from, date_to=date_to,
            department_id=department_id, employee_id=employee_id,
        )
        data = []
        for r in rows:
            emp = r.employee
            dept_name = emp.department.name if emp and emp.department else None
            data.append({
                "Employee Code": emp.employee_code if emp else None,
                "Full Name": emp.full_name if emp else None,
                "Department": dept_name,
                "Work Date": r.work_date.isoformat() if r.work_date else None,
                "Check-In": r.check_in_time.strftime("%H:%M:%S") if r.check_in_time else None,
                "Check-Out": r.check_out_time.strftime("%H:%M:%S") if r.check_out_time else None,
                "Total Hours": r.total_hours,
                "Status": r.status.value if hasattr(r.status, "value") else r.status,
            })
        return pd.DataFrame(data)

    async def _activity_dataframe(
        self,
        date_from: datetime,
        date_to: datetime,
        activity_type: Optional[ActivityType] = None,
        employee_id: Optional[UUID] = None,
        camera_id: Optional[UUID] = None,
        restrict_to_incidents: bool = False,
    ) -> pd.DataFrame:
        rows = await self.activity_repo.list_by_date_range(
            date_from=date_from, date_to=date_to,
            activity_type=activity_type, employee_id=employee_id, camera_id=camera_id,
        )
        if restrict_to_incidents:
            rows = [r for r in rows if r.activity_type in INCIDENT_TYPES]

        data = []
        for r in rows:
            emp = r.employee
            a_type = r.activity_type.value if hasattr(r.activity_type, "value") else r.activity_type
            data.append({
                "Employee": emp.full_name if emp else "Unknown",
                "Activity Type": a_type.replace("_", " ").title(),
                "Confidence": round(r.confidence_score, 2) if r.confidence_score else None,
                "Duration (s)": r.duration_seconds,
                "Resolved": r.is_resolved,
                "Detected At": r.detected_at.strftime("%Y-%m-%d %H:%M:%S") if r.detected_at else None,
            })
        return pd.DataFrame(data)

    # -----------------------------------------------------------------------
    # PUBLIC REPORT GENERATORS — return dict with file info
    # -----------------------------------------------------------------------

    async def generate_attendance_report(
        self, date_from: date, date_to: date, fmt: str,
        department_id: Optional[UUID] = None, employee_id: Optional[UUID] = None,
    ) -> dict:
        df = await self._attendance_dataframe(date_from, date_to, department_id, employee_id)
        title = f"Attendance Report ({date_from} to {date_to})"
        return self._export(df, "attendance", fmt, title)

    async def generate_activity_report(
        self, date_from: datetime, date_to: datetime, fmt: str,
        activity_type: Optional[ActivityType] = None,
        employee_id: Optional[UUID] = None, camera_id: Optional[UUID] = None,
    ) -> dict:
        df = await self._activity_dataframe(
            date_from, date_to, activity_type, employee_id, camera_id
        )
        title = f"Activity Report ({date_from.date()} to {date_to.date()})"
        return self._export(df, "activity", fmt, title)

    async def generate_incident_report(
        self, date_from: datetime, date_to: datetime, fmt: str,
    ) -> dict:
        df = await self._activity_dataframe(
            date_from, date_to, restrict_to_incidents=True
        )
        title = f"Security Incident Report ({date_from.date()} to {date_to.date()})"
        return self._export(df, "incident", fmt, title)

    # -----------------------------------------------------------------------
    # EXPORT — dispatch to CSV / Excel / PDF
    # -----------------------------------------------------------------------

    def _export(self, df: pd.DataFrame, report_type: str, fmt: str, title: str) -> dict:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        uid = uuid.uuid4().hex[:8]
        base_name = f"{report_type}_{ts}_{uid}"

        if fmt == "csv":
            filename = f"{base_name}.csv"
            path = self.reports_dir / filename
            df.to_csv(path, index=False)
        elif fmt == "excel":
            filename = f"{base_name}.xlsx"
            path = self.reports_dir / filename
            self._to_excel(df, path, title)
        elif fmt == "pdf":
            filename = f"{base_name}.pdf"
            path = self.reports_dir / filename
            self._to_pdf(df, path, title)
        else:
            raise ValueError(f"Unsupported format '{fmt}'. Use csv, excel, or pdf.")

        return {
            "filename": filename,
            "file_path": str(path),
            "row_count": len(df),
            "generated_at": datetime.now(),
        }

    @staticmethod
    def _to_excel(df: pd.DataFrame, path: Path, title: str) -> None:
        with pd.ExcelWriter(path, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Report")
            ws = writer.sheets["Report"]
            # Auto-width columns
            for i, col in enumerate(df.columns, start=1):
                max_len = max(
                    [len(str(col))] + [len(str(v)) for v in df[col].astype(str)]
                ) + 2
                ws.column_dimensions[get_column_letter(i)].width = min(max_len, 40)

    @staticmethod
    def _to_pdf(df: pd.DataFrame, path: Path, title: str) -> None:
        doc = SimpleDocTemplate(
            str(path), pagesize=landscape(A4),
            leftMargin=1.5 * cm, rightMargin=1.5 * cm,
            topMargin=1.5 * cm, bottomMargin=1.5 * cm,
        )
        styles = getSampleStyleSheet()
        elements = [Paragraph(title, styles["Title"]), Spacer(1, 12)]

        if df.empty:
            elements.append(Paragraph("No records found for this range.", styles["Normal"]))
        else:
            data = [list(df.columns)] + df.astype(str).values.tolist()
            table = Table(data, repeatRows=1)
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f2f2")]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            elements.append(table)

        doc.build(elements)
