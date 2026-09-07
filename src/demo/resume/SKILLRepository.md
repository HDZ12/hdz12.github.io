---
title: SkillRepository
index: true
article: true
category:
  - resume
---

## 搭 OverlayFS 一样组合五层 SkillRepository
搭建一个成熟的技能管理中台，不是简单的堆叠技能，而是要让不同来源的技能像overlayFS的层一样叠加，同名技能上层要屏蔽下层，一名技能合并且对外呈现一个统一的视图。
### OverlayFS 的启示
OverlayFS（叠加文件系统） 不陌生。它把多个目录"叠"成一个统一的视图——下层放基础文件，上层放增量修改，同名文件上层覆盖下层。
SkillRepository 的组合机制，本质上就是 Agent 世界的 OverlayFS：
- 每一个 SkillRepository 是一层"文件系统"
- 多个仓库通过 skillRepository() 链式注册，形成叠加
- 后注册的仓库是"上层"，同名技能覆盖先注册的"下层"
- 不同名技能取并集，对外呈现统一的技能视图
## 逐层深度拆解
### L0：Classpath 层——"操作系统内置命令"
这一层是最基础的"系统级"技能，随应用 JAR 包一起发布，有点类似操作系统的内置命令，你不需要安装，开机就有：
```
src/main/resources/
└── skills/
    ├── basic-chat/
    │   └── SKILL.md          ← 通用对话能力
    └── help/
        └── SKILL.md          ← 帮助指令
```
核心特征：只读、随包发布、版本锁定。适合那些"放之四海而皆准"的基础能力，比如对话、帮助、系统指令。
### L1：Git 层——"团队共享库"
团队级技能通过 Git 仓库管理，变更走 PR 评审——想改技能？提 PR，review 通过才能合并，多干净，妈妈再也不用担心我手滑改坏技能了：

```
// 注册两个 Git 仓库：通用库在前（下层），Java 组专属在后（上层）
HarnessAgent.builder()
        .skillRepository(new GitSkillRepository(
                "https://github.com/yihui-ai/common-skills.git"))   // 下层
        .skillRepository(new GitSkillRepository(
                "https://github.com/yihui-ai/java-team-skills.git")) // 上层
        .build();
```
核心特征：只读分发、版本可追溯、PR 评审。适合团队级规范、编码模板、脚手架用法。
### L2：Nacos 层——"动态配置中心"
运维同学最喜欢的来了——通过 Nacos 配置中心，在不发版的情况下向所有 Agent 下发新技能。改技能不用等发版，一条配置下去，全量生效，这才叫"热更新"：

NacosSkillRepository opsCenter = new NacosSkillRepository(
        aiService, "default-namespace");

HarnessAgent.builder()
        .skillRepository(opsCenter)   // 热更新能力
        .build();
核心特征：热更新、动态下发、需要 Closeable 管理。适合应急预案、上线检查清单等需要"秒级生效"的场景。
### L3：MySQL 层——"平台治理中心"
平台侧要对所有技能做统一治理、审计和合规检查？那得上 MySQL，技能存在数据库里，通过 Builder 精细控制读写权限：

// 平台治理库：只读分发，技能由管理员写入
MysqlSkillRepository platform = MysqlSkillRepository.builder(dataSource)
        .databaseName("agentscope")
        .skillsTableName("skills")
        .createIfNotExist(false)    // 表由 DBA 管理，咱别乱建
        .writeable(false)           // Agent 只读，防止污染
        .build();

HarnessAgent.builder()
        .skillRepository(platform)
        .build();
核心特征：中心化治理、读写可控、可审计。适合安全红线、合规检查等需要"强制执行"的技能。
### L4：Workspace 层——"用户私藏目录"
Workspace 层天然支持共享 + 用户隔离两级子层：

workspace/
├── skills/                         ← L4a：共享层（所有人可见）
│   └── project-helper/
│       └── SKILL.md
├── alice/                          ← L4b：用户层（仅 alice 可见，覆盖共享）
│   └── skills/
│       └── project-helper/
│           └── SKILL.md
└── bob/
    └── skills/
        └── code-reviewer/
            └── SKILL.md            ← bob 自己的评审规范
// L4 完全通过文件目录管理，无需代码注册
HarnessAgent.builder()
        .workspace(Paths.get(".agentscope/workspace"))
        .build();
// 框架自动扫描 workspace/skills/ 和 `<userId>/skills/`
核心特征：文件即配置、零代码接入、用户级隔离。适合项目私有技能、个人偏好设置、临时调试脚本——自己的私藏"神器"放这儿，谁也不影响。

### 叠加规则：OverlayFS 的"同名裁决"
裁决规则（划重点，这个是整个机制的核心）：

同名技能：上层覆盖下层（上层"遮蔽"下层）
不同名技能：全部保留，取并集（各层技能共存）