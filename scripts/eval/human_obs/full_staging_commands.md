# 全量 Live pass@3 Staging & Tracker(21 任务 × 2 模型 × 2 条件 × 3 seed = 252 次)

> **复制粘贴进 Notion 即可**(Markdown 表格 Notion 原生支持,列宽自适应)。
> Pilot 通过后再用本表跑全量。

## 用法(每个 trial 三步)

1. **清库存**(每个 trial 开头):`/clear Max`
2. **复制下表"staging 命令"列 → RCON 逐条执行**(给 bot 原矿 + 工具链耗材 + 成品锭)
3. **启动 bot + 对它说 prompt**:
   - saer_cold:`node main.js --profiles profiles/deepseek_live_saer.json`(DeepSeek)/ `profiles/qwen3-8b_live_saer.json`(Qwen3-8B)
   - no_retrieval:`node main.js --profiles profiles/deepseek_live_no_ret.json` / `profiles/qwen3-8b_live_no_ret.json`

## 🔑 staging 逻辑(必读)

- **`iron_ore` / `gold_ore` / `diamond_ore` / `redstone_ore`**:矿物方块,bot 用 `collectBlocks` 挖(执行挖矿步,produces=raw_xxx,不 skip)
- **`oak_log`**:工具链耗材(木镐 + 工作台 + 棍)
- **`cobblestone`**:石镐链 + 熔炉耗材
- **`stone`(L1/L2 那项)**:manifest 遗留,可忽略(cobblestone 才是真正造石镐/熔炉的);stone_bricks/stone_button 的 `stone 1` 是成品(让烧步 skip)
- **🔑 `iron_ingot` / `gold_ingot` / `diamond` / `redstone`(成品)**:**让"烧"步被 `pruneSteps` 自动 skip**——这是跳过 8 步烧执行 bug 的关键。bot 仍走挖矿→造熔炉→造工具链,只在烧那步因库存已有所需锭而 skip。
- **`stone 16` 给 L1**:L1 不需要石镐链,保留无害(防 LLM 偶尔走工具链)。

---

## 表 A:DeepSeek-V3

### staging + prompt

| 任务 | Lv | bot prompt | staging 命令(RCON `/give`) |
|------|----|-----------|----------------------------|
| craft/wooden_sword | L1 | craft a wooden sword | `/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 16` |
| craft/chest | L1 | craft a chest | `/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 16` |
| craft/ladder | L1 | craft a ladder | `/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 16` |
| craft/oak_door | L1 | craft an oak door | `/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 16` |
| craft/wooden_shovel | L1 | craft a wooden shovel | `/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 16` |
| collect/gravel | L1 | collect some gravel | `/give Max gravel 10` |
| collect/pumpkin | L1 | collect a pumpkin | `/give Max pumpkin 4` |
| craft/iron_helmet | L2 | craft an iron helmet | `/give Max iron_ore 10`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max iron_ingot 5` |
| craft/iron_boots | L2 | craft iron boots | `/give Max iron_ore 8`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max iron_ingot 4` |
| craft/stone_bricks | L2 | craft stone bricks | `/give Max oak_log 6`<br>`/give Max cobblestone 24`<br>`/give Max stone 1` |
| craft/iron_bars | L2 | craft iron bars | `/give Max iron_ore 8`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max iron_ingot 6` |
| craft/stone_button | L2 | craft a stone button | `/give Max oak_log 6`<br>`/give Max cobblestone 24`<br>`/give Max stone 1` |
| craft/cauldron | L2 | craft a cauldron | `/give Max iron_ore 8`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max iron_ingot 7` |
| craft/iron_door | L2 | craft an iron door | `/give Max iron_ore 10`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max iron_ingot 6` |
| craft/diamond_axe | L3 | craft a diamond axe | `/give Max diamond_ore 3`<br>`/give Max iron_ore 6`<br>`/give Max oak_log 8`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max diamond 3` |
| craft/diamond_boots | L3 | craft diamond boots | `/give Max diamond_ore 4`<br>`/give Max iron_ore 6`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max diamond 4`<br>`/give Max iron_ingot 6` |
| craft/golden_pickaxe | L3 | craft a golden pickaxe | `/give Max gold_ore 4`<br>`/give Max iron_ore 6`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max gold_ingot 3` |
| craft/anvil | L3 | craft an anvil | `/give Max iron_ore 40`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max iron_ingot 31` |
| craft/compass | L3 | craft a compass | `/give Max iron_ore 10`<br>`/give Max redstone_ore 2`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max iron_ingot 4`<br>`/give Max redstone 1` |
| craft/clock | L3 | craft a clock | `/give Max gold_ore 4`<br>`/give Max redstone_ore 2`<br>`/give Max iron_ore 6`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max gold_ingot 4`<br>`/give Max redstone 1` |
| craft/iron_leggings | L3 | craft iron leggings | `/give Max iron_ore 14`<br>`/give Max oak_log 6`<br>`/give Max stone 16`<br>`/give Max cobblestone 24`<br>`/give Max iron_ingot 7` |

### 结果记录(填 1=通过 / 0=失败)

| 任务 | Lv | no_ret s1 | no_ret s2 | no_ret s3 | saer s1 | saer s2 | saer s3 |
|------|----|:---------:|:---------:|:---------:|:-------:|:-------:|:-------:|
| craft/wooden_sword | L1 | | | | | | |
| craft/chest | L1 | | | | | | |
| craft/ladder | L1 | | | | | | |
| craft/oak_door | L1 | | | | | | |
| craft/wooden_shovel | L1 | | | | | | |
| collect/gravel | L1 | | | | | | |
| collect/pumpkin | L1 | | | | | | |
| craft/iron_helmet | L2 | | | | | | |
| craft/iron_boots | L2 | | | | | | |
| craft/stone_bricks | L2 | | | | | | |
| craft/iron_bars | L2 | | | | | | |
| craft/stone_button | L2 | | | | | | |
| craft/cauldron | L2 | | | | | | |
| craft/iron_door | L2 | | | | | | |
| craft/diamond_axe | L3 | | | | | | |
| craft/diamond_boots | L3 | | | | | | |
| craft/golden_pickaxe | L3 | | | | | | |
| craft/anvil | L3 | | | | | | |
| craft/compass | L3 | | | | | | |
| craft/clock | L3 | | | | | | |
| craft/iron_leggings | L3 | | | | | | |

**DeepSeek 汇总**:no_ret pass@1 = __/63 | pass@3(任务级)= __/21 ｜ saer pass@1 = __/63 | pass@3 = __/21

---

## 表 B:Qwen3-8B

> staging 命令与表 A **完全相同**(任务一样),只是启动 profile 换成 Qwen3-8B。结果记录表复制下方,模型换 Qwen3-8B。

### 结果记录(填 1=通过 / 0=失败)

| 任务 | Lv | no_ret s1 | no_ret s2 | no_ret s3 | saer s1 | saer s2 | saer s3 |
|------|----|:---------:|:---------:|:---------:|:-------:|:-------:|:-------:|
| craft/wooden_sword | L1 | | | | | | |
| craft/chest | L1 | | | | | | |
| craft/ladder | L1 | | | | | | |
| craft/oak_door | L1 | | | | | | |
| craft/wooden_shovel | L1 | | | | | | |
| collect/gravel | L1 | | | | | | |
| collect/pumpkin | L1 | | | | | | |
| craft/iron_helmet | L2 | | | | | | |
| craft/iron_boots | L2 | | | | | | |
| craft/stone_bricks | L2 | | | | | | |
| craft/iron_bars | L2 | | | | | | |
| craft/stone_button | L2 | | | | | | |
| craft/cauldron | L2 | | | | | | |
| craft/iron_door | L2 | | | | | | |
| craft/diamond_axe | L3 | | | | | | |
| craft/diamond_boots | L3 | | | | | | |
| craft/golden_pickaxe | L3 | | | | | | |
| craft/anvil | L3 | | | | | | |
| craft/compass | L3 | | | | | | |
| craft/clock | L3 | | | | | | |
| craft/iron_leggings | L3 | | | | | | |

**Qwen3-8B 汇总**:no_ret pass@1 = __/63 | pass@3 = __/21 ｜ saer pass@1 = __/63 | pass@3 = __/21

---

## 失败根因记录(每个 0 都填,事后取证用)

| 模型 | 任务 | 条件 | seed | 失败步骤 | 根因(plan 缺陷? staging 不足? framework race?) | log 文件名 |
|------|------|------|------|---------|-----------------------------------------------|-----------|
| | | | | | | |
