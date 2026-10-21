# 架构方案（初始版本）

实现 Phase 1 CLI，六种内置图形；box 留待下一阶段。

domain 封装 Shape / Group / Document；application 以 Command 和 Memento 实现事务与历史；ports 定义文件和编解码边界；infrastructure 实现 Node 文件 IO 与 XML；cli 实现分词、分发、REPL。
依赖方向：cli → application → domain / ports；infrastructure → ports / domain。domain 不依赖任何外层模块。

实现完成后补充过程记录、PlantUML 和一致性自查。
