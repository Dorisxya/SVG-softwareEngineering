# 架构方案（初始版本）

实现 Phase 1 CLI，六种内置图形；box 留待下一阶段。

domain 封装 Shape / Group / Document；application 以 Command 和 Memento 实现事务与历史；ports 定义文件和编解码边界；infrastructure 实现 Node 文件 IO 与 XML；cli 实现分词、分发、REPL。
依赖方向：cli → application → domain / ports；infrastructure → ports / domain。domain 不依赖任何外层模块。

实现完成后补充过程记录、PlantUML 和一致性自查。

## 第二阶段记录（2026-10-22）

本阶段提交 domain、application 和 ports；cli 与 infrastructure 实现留待下一阶段。

| 模块 | 当前内容 |
|---|---|
| domain | Shape 抽象及六种具体图形、Document、ShapeFactory、数值验证 |
| application | Command 接口和编辑命令、Editor、HistoryEntry、TreeRenderer |
| ports | FileStore 与 DocumentCodec 接口 |

依赖方向仍为 application → domain/ports，ports → domain。领域层不引用 Node 文件系统或 XML 库。

Command 负责单次编辑，Editor 在文档副本上执行，成功后才替换当前文档和写入历史。HistoryEntry 保存前后快照，支持撤销与重做。Group 递归处理子孙，实现 Composite。

验证方式：严格 TypeScript 编译及针对核心模块的临时行为检查，验证组合移动、缩放、失败回滚、撤销重做和历史分支。完整自动化测试套件尚未纳入本阶段交付。

下一阶段完成 CLI/IO 适配器、SVG 往返、自动化验收和最终文档。此处按实际模块边界提交，不将中期版本描述为可运行的完整应用。
