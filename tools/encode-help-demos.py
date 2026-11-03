"""Encode current-UI browser frames from tests/record-help-demos.js."""
from pathlib import Path
import json
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parents[1]
qa, assets = root / 'qa/help-ui', root / 'src/help'
names = ('build', 'place', 'shape', 'annotate', 'world', 'curve', 'export')
size, report = (1152, 800), []
contact = Image.new('RGB', (1152, 430 * 4), '#deded8')
draw = ImageDraw.Draw(contact)
for index, name in enumerate(names):
    files = sorted((qa / 'frames').glob(f'{name}_*.png'))
    if len(files) < 8:
        raise RuntimeError(f'Missing actual browser frames for {name}')
    frames = []
    for file in files:
        with Image.open(file) as source:
            frames.append(source.convert('RGB').resize(size, Image.Resampling.LANCZOS))
    samples = [frames[round(i * (len(frames) - 1) / 11)] for i in range(12)]
    montage = Image.new('RGB', (size[0], size[1] * len(samples)))
    for i, frame in enumerate(samples):
        montage.paste(frame, (0, size[1] * i))
    # Shared palette keeps small text and signal colors stable between frames.
    palette = montage.quantize(colors=240, method=Image.Quantize.MEDIANCUT)
    colors = palette.getpalette()
    for i, rgb in enumerate(((232, 237, 56), (34, 37, 31), (197, 59, 53), (37, 131, 66), (37, 102, 197), (255, 255, 255))):
        colors[(240+i)*3:(241+i)*3] = rgb
    palette.putpalette(colors)
    encoded = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    durations = [int(file.stem.rsplit('_', 1)[1]) for file in files]
    target = assets / f'{name}.gif'
    encoded[0].save(target, save_all=True, append_images=encoded[1:], duration=durations, loop=0, optimize=True, disposal=1)
    frames[-1].save(assets / f'{name}.png', optimize=True)
    for i, frame in enumerate((frames[0], frames[len(frames)//2], frames[-1])):
        frame.save(qa / f'{name}-sample-{i}.png')
    x, y = (index % 2) * 576, (index // 2) * 430
    draw.text((x+10, y+8), name, fill='black')
    contact.paste(ImageOps.contain(frames[len(frames)//2], (576, 400)), (x, y+28))
    with Image.open(target) as gif:
        assert gif.size == size and gif.n_frames >= 8
        duration = 0
        for i in range(gif.n_frames):
            gif.seek(i)
            duration += gif.info['duration']
        assert duration == sum(durations) and gif.info.get('loop') == 0
        report.append({'name': name, 'size': size, 'frames': gif.n_frames, 'duration_ms': duration, 'gif_bytes': target.stat().st_size, 'poster_bytes': (assets / f'{name}.png').stat().st_size})
contact.save(qa / 'after-contact.png')
(qa / 'gif-checks.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report))
