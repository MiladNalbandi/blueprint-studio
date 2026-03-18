"""Zip exporter adapter."""

import io
import zipfile

from app.domain.models.project import GeneratedFile
from app.ports.interfaces import FileExporterPort


class ZipExporter(FileExporterPort):
    def export_zip(self, files: list[GeneratedFile], project_name: str) -> bytes:
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in files:
                zf.writestr(f"{project_name}/{f.path}", f.content)
        buffer.seek(0)
        return buffer.read()
