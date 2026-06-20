## Overview 

Adding per-component SVG icons stored next to each `.py` file, served via a dedicated endpoint, displayed in frontend dropdowns with fallback placeholder.

### Backend
#### Component class
set `icon = "MyName.svg"` and place the `.svg` file next to the `.py`
`backend/app/components/documentloaders/Pdf/PyPDFLoader.py`
- Add: `icon = "pdf.svg"`

#### registry.py
`backend/app/components/registry.py`
- Add: `import inspect`, `from pathlib import Path`
- Add: `_icon_url()` helper — finds `.py` via `inspect.getfile`, returns `/admin/components/{category}/{name}/icon`
- `get_component_schema()` — add `"icon"` (filename) and `"icon_path"` (URL) to return dict

#### admin.py
`backend/app/api/Admin/admin.py`
- Add: `from fastapi.responses import FileResponse`, `import inspect`, `from pathlib import Path`
- New endpoint `GET /components/{category}/{name}/icon`:
  - looks up component class from `registry._store`
  - resolves `.svg` path via `inspect.getfile`
  - returns `FileResponse` or 404

## Summary

1. Set `icon = "MyName.svg"` in component class + put `.svg` next to `.py`
2. `_icon_url()` helper + update `get_component_schema()` → registry.py
3. `FileResponse` endpoint → admin.py
4. `ComponentIcon.jsx` + add to dropdowns → frontend
