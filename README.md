# SVG-softwareEngineering

SVG 编辑器课程项目，TypeScript 面向对象实现。

## 当前进度：第二阶段 / 核心模型与编辑流程

本次交付是中期版本，范围约为计划的一半；百分比表示阶段范围，不代表精确代码量或测试覆盖率。

已实现：

- 六种形状：rect、circle、ellipse、line、text、g。
- 图形唯一 ID、父子关系和容器递归操作。
- 创建、删除、移动、缩放、属性设置、分组、解散、移动归属及绘制顺序的编辑命令。
- Command 模式与编辑前后快照；原子执行、撤销/重做、历史屏障。
- 文件读写和 SVG 编解码的接口定义，尚无真实适配器。

尚未交付：终端命令解析和 REPL、真实磁盘 IO、SVG XML 解析与输出、完整测试套件、示例和最终验收文档。

本阶段可以编译核心模块，暂不能运行交互式 CLI。package.json 的 cli/test 脚本为初始规划，入口与测试文件将在后续阶段加入。

```sh
npm install
npm run build
```

项目结构与阶段记录见 [doc/README.md](doc/README.md)。本次不创建或推送 final 标签。
