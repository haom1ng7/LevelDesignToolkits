# 固定 HTML 画布导出工程约束

仅在 HTML 需要导出为 PNG/PDF 等静态成品时加载本文件。先完成编辑结构和目标渠道设计，再配置画布；不要让截图管线决定视觉版式。

## 1. 建立导出配置

在实现前明确：

- `canvasWidth`：CSS 像素宽度；
- `rootSelector`：被测量和截图的根元素；
- `scale`：设备像素倍率；
- `colorScheme`：亮、暗或由当前物料决定；
- `allowedOrigins`：允许加载的远程素材来源；
- `maxPhysicalHeight`：当前浏览器/图像管线的安全高度；
- `outputFormat`：PNG、JPEG、WebP 或 PDF。

这些值没有品牌级默认配置，必须由当前发布渠道和成品用途决定。

## 2. 静态成品必须独立成立

- 截图时禁用动画、过渡和 hover；任何信息都不能只存在于交互状态。
- 使用固定 viewport 宽度，让页面高度由内容决定。全页截图时 viewport 高度应小于内容高度，避免某些渲染器在页尾增加空白。
- 明确背景色，不依赖系统透明背景或用户暗色偏好。
- 绝对定位内容必须被根元素高度覆盖；装饰出血不得扩大根元素的 scroll width。

## 3. 字体与资源

- 生产导出优先使用本地、内嵌或可稳定缓存的字体，并等待 `document.fonts.ready`。
- 不要求所有项目把字体转成 data URL；是否内嵌取决于导出环境能否访问文件。零网络渲染时必须内嵌或复制到可访问目录。
- 远程图片按项目的 `allowedOrigins` 控制，不采用“只有头像可以远程加载”的通用限制。
- 图片容器需要稳定尺寸和失败回退。删除破图图标可以作为导出兜底，但不能隐藏本应报错的关键图像缺失。
- 背景纹理如果是验收项，使用命名 CSS 变量或可查询属性，以便确认实际加载。

## 4. 截图前等待

下面的通用等待逻辑可按渲染器改写：

```js
async function settle(timeoutMs = 5000) {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  if (document.fonts?.ready) {
    await Promise.race([document.fonts.ready, delay(timeoutMs)]);
  }

  const pending = [...document.images]
    .filter((image) => !image.complete)
    .map((image) => new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    }));

  await Promise.race([Promise.all(pending), delay(timeoutMs)]);
}
```

等待之后分别记录关键图片失败和非关键图片失败。非关键装饰可以移除；关键内容失败应中止导出或显示明确回退。

## 5. 截图前验收

对 `rootSelector` 运行至少以下检查：

```js
function inspectExport(rootSelector, canvasWidth) {
  const root = document.querySelector(rootSelector);
  if (!root) return { ok: false, errors: ["missing root"] };

  const errors = [];
  const rect = root.getBoundingClientRect();

  if (Math.ceil(rect.width) !== canvasWidth) errors.push("unexpected root width");
  if (Math.ceil(root.scrollWidth) > canvasWidth) errors.push("horizontal overflow");
  if (root.scrollHeight < Math.ceil(rect.height)) errors.push("invalid root height");
  if ([...document.images].some((img) => img.dataset.required === "true" && !img.naturalWidth)) {
    errors.push("required image failed");
  }

  return { ok: errors.length === 0, errors, width: rect.width, height: root.scrollHeight };
}
```

另行检查：

- 字体是否加载到预期 family，而不是静默回退；
- 正文最小字号在目标发布尺寸上是否可读；
- 内容层底部是否落在根元素范围内；
- 装饰层是否 `pointer-events:none` 且不影响尺寸；
- 画布边缘的主体、文字和二维码是否留有安全区。

## 6. 截图后验证

- 校验文件签名、实际像素宽高和文件大小；
- 实际宽度应为 `canvasWidth × scale`；
- 实际高度应覆盖测得内容高度，允许渲染器产生极小的取整差；
- 对透明背景、色彩模式和压缩质量做渠道适配；
- 打开最终文件做一次视觉检查，代码层测量不能发现字体错位、糊图和不自然裁切。

## 7. 超长图与倍率

- 根据最终物理高度选择 scale，不固定短页 2x、长页 1x。
- 接近浏览器纹理或图像库上限时，优先降低倍率、分章导出或改用分页 PDF。
- 不让自动降倍率悄悄损失小字号可读性；降级后重新做视觉检查。

## 8. 错误处理

- 模板缺少必需变量时应明确失败；可选字段使用显式空态。
- 区分模板/数据错误、素材错误和浏览器导出错误，便于重试正确层级。
- 日志记录错误类型、资源标识和尺寸，不记录敏感数据或完整用户内容。
- 保留中间 HTML 仅限调试环境，并遵守项目的数据保留要求。
