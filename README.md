# SVG-softwareEngineering

TypeScript 面向对象 SVG 编辑器课程项目。

## 当前进度：第三阶段 / 可运行 CLI（约 75%）

百分比表示约定的阶段范围，不代表精确代码量或测试覆盖率。本阶段接入终端交互和真实 SVG 文件读写，形成可以运行的应用。

已实现：

- rect、circle、ellipse、line、text、g 六种图形，唯一 ID 与嵌套容器。
- 创建、删除、移动、缩放、属性设置、分组、解散、移动归属和同级绘制顺序。
- Command 与文档快照，失败原子性、撤销/重做及 IO 历史屏障。
- CLI 分词、双引号参数、注释、REPL 和标准输入脚本回放。
- SVG XML 解析和序列化、自动补 ID、真实磁盘读写。

完整自动化测试套件、演示文件、最终架构自查与验收文档留到第四阶段。本次不创建或推送 final 标签。

## 安装与运行

需要 Node.js 22.6+，推荐 Node.js 24。

```sh
npm install
npm run cli
```

或者使用锁文件安装：

```sh
pnpm install --frozen-lockfile
pnpm cli
```

交互提示符为 `svg>`。输入 `help` 查看命令，按 Ctrl-D 退出。可复制以下命令：

```text
init 600 400
create g scene
create rect card 40 60 160 80 skyblue in scene
create text label 65 105 "开始" in scene
move scene 100 0
undo
tree
save demo.svg
read demo.svg
show card
```

SVG 文件可在浏览器中打开。相对文件路径以程序工作目录为基准；带空格路径需加双引号。

```sh
npm run build
node dist/cli/main.js
npm run check
```

本阶段 `check` 执行严格 TypeScript 编译和源码格式检查，不代表完整功能测试。命令脚本可通过 `npm run cli < commands.txt` 回放：脚本模式不显示提示符，遇错继续处理，最终返回非零退出码。

## 关键语义

- 单文档模式；init/read 替换当前文档，编辑先发生在内存，只有 save 写文件。目前没有未保存确认和 status 命令。
- save 无参数时使用上一次 read/save 的路径；init 清除路径。
- 成功 init/read/save 或修改 canvas 后清空历史并禁止撤销重做，下一次成功编辑解禁；显示类命令不改变历史。
- scale 同时缩放几何坐标与尺寸，CLI 缩放不修改字体大小和描边宽度。
- g 的颜色遵循 SVG 继承，显式子属性优先。ungroup 不将组属性复制到孩子。
- group 按原文档顺序组织成员；同父级占首个选中位置，跨父级追加到根。根级 g 按需求禁止 ungroup。

## 导入边界

支持六种内置形状、嵌套 g、数值或 px 的画布尺寸、viewBox 和常用展示属性。缺少 ID 时自动补号并警告，重复 ID 拒绝导入。支持 translate 与正数等比 scale 变换并归一化到坐标；字体和描边尺寸也会按导入缩放换算。

不支持 path、defs/use、tspan、嵌套 svg、CSS/style、旋转/矩阵/非等比变换、百分比几何单位或 DTD/实体声明。不支持的结构导致整个 read 失败，保留旧文档。源 XML 排版、注释和 transform 写法不保证原样保留。box 和动态插件加载属于后续功能阶段，本课程 Phase 1 不实现。

模块及分阶段记录见 [doc/README.md](doc/README.md)。
