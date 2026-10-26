# SVG Editor · Phase 1

TypeScript 面向对象 CLI SVG 编辑器。实现需求文档第一阶段；不是 VS Code 扩展，也不包含后续阶段的 box 插件或动态插件加载器。

## 运行

首次下载项目后，请先安装以下依赖。安装后 macOS 可双击 `run.command` 启动；脚本优先使用系统 Node，也支持本机已有的 Codex Node 运行时。

需要 Node.js 22.6+、npm；推荐 Node.js 24。进入本目录：

```sh
npm install
npm run cli
```

交互提示符为 `svg>`，输入 `help` 查看命令，Ctrl-D 退出。脚本模式不打印提示符；发生错误继续处理后续命令，进程最终返回 1。

```sh
npm run cli < examples/flowchart.commands
npm test
npm run check
npm run build
node dist/cli/main.js
```

也可使用 pnpm，仓库附带 `pnpm-lock.yaml`。`pnpm install --frozen-lockfile` 安装后，`pnpm check` 验证。

## 快速示例

```text
init 800 600
create g scene
create rect r1 10 20 100 50 #4a90d9 in scene
create text t1 25 50 "你好 SVG" in scene
move scene 40 20
undo
redo
tree
save demo.svg
```

将生成的 SVG 用浏览器打开即可预览。提供 `examples/flowchart.commands` 及对应 SVG。

## 已实现

- 文档：init、read、save、canvas。
- 编辑：create、delete、move、scale、set、group、ungroup、addto、front、back。
- 显示：tree、show、help；历史：undo、redo。
- 六种形状：rect、circle、ellipse、line、text、g；浮点坐标，双引号参数，中文和 XML 转义。
- 唯一 ID、外部文件自动补 ID、层级校验、失败原子性、容器递归操作、同级绘制顺序。
- 保存采用同目录临时文件后 rename；失败不清空历史。

## 明确约定

1. `scale` 缩放坐标和尺寸；CLI 缩放不改变字体、描边宽度。g 的 fill/stroke 通过 SVG 原生继承生效，子元素显式样式优先。
2. `group` 依据原文档先序保留选中元素顺序。同父级时放在首个选中元素位置；跨父级时追加到画布根。不允许同时选祖先及其子孙。
3. `ungroup` 按需求拒绝根级容器；嵌套容器解散后子元素占据它原来的位置。
4. 成功的 init/read/save/canvas 修改清空历史并禁止 undo/redo，下一条成功编辑解禁。canvas 查询和显示命令不影响历史。
5. 撤销反馈为 `undone: 原命令摘要`，重做为 `redone: 原命令摘要`，状态完整恢复。tree 不做列宽对齐，保留所需几何信息。
6. `save path` 成功后也会记住该路径；之后可直接 `save`。init 清除路径。

## SVG 导入边界

支持六种内置形状、嵌套 g、width/height（数值或 px）、viewBox，以及 font-size、text-anchor 等常用展示属性。缺省几何值取 0。缺失 ID 先预留文件全部显式 ID，再补 `标签名+序号`，避免与后出现的 ID 冲突。

支持 translate 和正数等比 scale 的 transform，读入时烘焙到几何坐标；同时换算导入变换所影响的字体/描边尺寸。保存后保留视觉等价的受支持信息，XML 排版及 transform 写法不会原样保留。注释会被忽略；未知 data-kind 的普通 g 保留标记并按 g 操作。

不支持 path、defs/use、嵌套 svg、tspan、CSS/style、旋转/矩阵/非等比变换、百分比几何单位及 DTD/实体声明。遇到不支持的元素/属性或格式错误时，拒绝整个 read，保留当前文档和历史。不是完整 SVG 标准实现。

## 架构与交付

架构图、设计模式、过程记录、依赖规则和验收矩阵见 [doc/README.md](doc/README.md)。源码一类一文件，使用严格 TypeScript；测试涵盖命令行为、撤销重做、SVG 往返及真实 CLI/文件 IO。

仓库保留初始化、核心模型、可运行 CLI 与最终验收的分步提交，最终版本以 `final` 标签标记。仓库地址：[Dorisxya/SVG-softwareEngineering](https://github.com/Dorisxya/SVG-softwareEngineering)。最终检查包含严格编译、49 项自动化测试和格式检查。需求文档未给出截止时间，因此无法核实截止时间要求。
