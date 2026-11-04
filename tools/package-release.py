"""Create verified offline web and source downloads; no network publishing."""
from pathlib import Path
import hashlib,json,os,shutil,zipfile
from release_files import ROOT as root,source_files
out=Path(os.environ.get('STUDIO_RELEASE_DIR',str(root/'release'))).resolve();out.mkdir(parents=True,exist_ok=True)
version=json.loads((root/'package.json').read_text(encoding='utf-8-sig'))['version']
display_version='.'.join(version.split('.')[:2])
assert json.loads((root/'data/initial-project.json').read_text(encoding='utf-8-sig'))['documents']==[]
html=(root/'dist/index.html').read_bytes()
assert b'<script src=' not in html and b'HELP_BUILD_GIF' not in html
source=out/f'LevelDesignToolkits-{version}-Source.zip';files=source_files()
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,p.relative_to(root))
with zipfile.ZipFile(source) as z:
 assert z.testzip() is None
 for p in files:assert z.read(p.relative_to(root).as_posix())==p.read_bytes()
archive=out/f'LevelDesignToolkits-{version}-Web.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 z.writestr('关卡设计工具箱/index.html',html)
 for name in ['LICENSE','THIRD_PARTY_NOTICES.md','docs/使用说明.html']:
  z.write(root/name,'关卡设计工具箱/'+name)
 z.write(root/'data/曲线图示例.json','关卡设计工具箱/曲线图示例.json')
 z.write(root/'data/空间图示例.json','关卡设计工具箱/空间图示例.json')
 z.writestr('关卡设计工具箱/开始使用.txt','完整解压后使用 Chrome 或 Edge 打开 index.html。\n程序顶部使用说明或F1打开完整离线教程。\n保存工程JSON用于长期备份。工具快捷键使用英文输入法。\n')
with zipfile.ZipFile(archive) as z:
 assert len(z.namelist())==len(set(z.namelist())), 'Duplicate archive entries'
 assert z.testzip() is None
 assert z.read('关卡设计工具箱/index.html')==html
 assert z.read('关卡设计工具箱/LICENSE')==(root/'LICENSE').read_bytes()
(out/f'关卡设计工具箱_v{display_version}.html').write_bytes(html)
shutil.copyfile(root/'docs/使用说明.html',out/'使用说明.html')
shutil.copyfile(root/'data/空间图示例.json',out/'空间图示例.json')
shutil.copyfile(root/'data/曲线图示例.json',out/'曲线图示例.json')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
artifacts=[source,archive,out/f'关卡设计工具箱_v{display_version}.html',out/'使用说明.html',out/'空间图示例.json',out/'曲线图示例.json']
(out/'SHA256SUMS.txt').write_text(''.join(sha(p)+'  '+p.name+'\n' for p in sorted(artifacts)),encoding='utf-8')
print(json.dumps({'sourceFiles':len(files),'downloads':{p.name:p.stat().st_size for p in artifacts}},ensure_ascii=False))
