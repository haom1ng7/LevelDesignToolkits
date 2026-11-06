"""Public release allowlist; never traverse private QA, caches or user data."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DOCS=['使用说明.md','使用说明.html','MCP对话创作.md','GitHub发布指南.md','最终检查记录.md','空间图_平面.png','空间图_立面.png','空间图_立体.png','曲线图_总览.png','曲线图_事件.png']
def source_files():
 files=[]
 for directory in ['src','tools','tests','data','.github']:
  files.extend(p for p in (ROOT/directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix not in ['.pyc','.log'])
 files.extend(ROOT/name for name in ['README.md','LICENSE','THIRD_PARTY_NOTICES.md','logs/CHANGELOG.md','package.json','package-lock.json','.gitignore','dist/index.html','.codex/hooks/changelog.cjs'])
 files.extend(ROOT/'docs'/name for name in DOCS)
 for p in files:
  if not p.is_file():raise FileNotFoundError(p)
 return sorted(files)
