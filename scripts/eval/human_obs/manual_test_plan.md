# 手动 Live 验证清单（SAER，Fix B 之后）

**目的**：存在性证明 —— 确认 SAER 的 plan 能在真实服务器完成任务。
**判定**：pass@1，一遍成功即可（不需要 pass@k）。随机性来自 mineflayer sync race（执行层），不是 knowledge。
**范围**：这 12 个任务在 run5（修复前）自动 harness 上 SAER 失败；其中 **8 个是 Fix B 修的 bundled-step bug**。

## 不用测的 9 个（run5 自动 harness 已通过 → 已证明可执行）
`craft/wooden_sword`、`craft/chest`、`craft/ladder`、`craft/oak_door`、`craft/wooden_shovel`、`collect/gravel`、`collect/pumpkin`、`craft/iron_bars`、`craft/cauldron`

---

## 通用准备规则（每个任务开始前）

1. **bot 名 = `Max`**，让它待在 spawn（约 0 64 0）附近。
2. **物资摆成"方块"**放在 Max 旁边（≤10 格内），bot 用 `collectBlocks` 自己挖。数量见下表「物资」列。
   - creative 里抓一摞对应方块，在地上堆一小片即可。矿物直接放矿石方块（如 `iron_ore`），bot 会自己造镐去挖。
3. **每个任务都给燃料**：`/give Max minecraft:coal 16`（全部 12 个都要熔炼）。
4. **不要给任何工具，不要预先放熔炉**——bot 自己用 cobblestone 造镐、造熔炉（这是被测的 SAER 能力，给了就破坏 live↔static 一致性）。
5. 准备好后，在**聊天框对 Max 说**「指令」列那句话。
6. 看 Max 是否拿到目标物（聊天会报 `✅ Task ... completed` 或 `❌ failed`，或查 Max 背包有没有目标物品）。

## 结果记录规则
右边三列 = 三次测试。**成功写 `1`，失败写 `2`**。三次都成功 = `1 1 1`。

---

## 清单（12 个任务）

| # | 任务 | 等级 | run5 失败原因 | 指令（对 Max 说） | 物资（摆成方块）+ `coal 16` | 测试1 | 测试2 | 测试3 |
|---|------|----|------|------|------|:--:|:--:|:--:|
| 1 | craft/stone_bricks   | L2 | **bundled-bug（木镐）** | `craft stone bricks`    | oak_log×6, stone×20, cobblestone×24 |  |  |  |
| 2 | craft/iron_door      | L2 | **bundled-bug（木镐）** | `craft an iron door`    | iron_ore×10, oak_log×6, stone×16, cobblestone×24 |  |  |  |
| 3 | craft/diamond_axe    | L3 | **bundled-bug（木镐）** | `craft a diamond axe`   | diamond_ore×3, iron_ore×6, oak_log×8, stone×16, cobblestone×24 |  |  |  |
| 4 | craft/golden_pickaxe | L3 | **bundled-bug（木镐）** | `craft a golden pickaxe`| gold_ore×4, iron_ore×6, oak_log×6, stone×16, cobblestone×24 |  |  |  |
| 5 | craft/anvil          | L3 | **bundled-bug（木镐）** | `craft an anvil`        | iron_ore×40, oak_log×6, stone×16, cobblestone×24 |  |  |  |
| 6 | craft/compass        | L3 | **bundled-bug（木镐）** | `craft a compass`       | iron_ore×10, redstone_ore×2, oak_log×6, stone×16, cobblestone×24 |  |  |  |
| 7 | craft/clock          | L3 | **bundled-bug（木镐）** | `craft a clock`         | gold_ore×4, redstone_ore×2, iron_ore×6, oak_log×6, stone×16, cobblestone×24 |  |  |  |
| 8 | craft/iron_leggings  | L3 | **bundled-bug（木镐）** | `craft iron leggings`   | iron_ore×14, oak_log×6, stone×16, cobblestone×24 |  |  |  |
| 9 | craft/iron_helmet    | L2 | bundled + sync-race | `craft an iron helmet`  | iron_ore×10, oak_log×6, stone×16, cobblestone×24 |  |  |  |
| 10| craft/stone_button   | L2 | sync-race | `craft a stone button`  | oak_log×6, stone×16, cobblestone×24 |  |  |  |
| 11| craft/iron_boots     | L2 | ⚠️ collect 问题 | `craft iron boots`      | iron_ore×8, oak_log×6, stone×16, cobblestone×24 |  |  |  |
| 12| craft/diamond_boots  | L3 | ⚠️ 可能真 plan 缺陷 | `craft diamond boots`   | diamond_ore×4, iron_ore×6, oak_log×6, stone×16, cobblestone×24 |  |  |  |

---

## 注意（诚实记录）

- **#1–8（bundled-bug）**：这是 Fix B 的直接目标，修复前木镐被静默掩盖 → 下游误判。修复后应能完成。这 8 个是论文「harness 失败 → 手动成功」的 §5.4 最佳证据。
- **#11 iron_boots / #12 diamond_boots（⚠️）**：run5 失败原因不是典型 sync-race，可能是**真的 plan 缺陷**。如果手动也失败，请如实记 `2`，并把 log 留下来——这是 SAER 待改进点，不能漏报。
- **手动失败的也要写 `2`**，不要只记成功的（否则是选择偏差，论文不能用）。
- 建议把每个任务的聊天/控制台输出存到本目录（`scripts/eval/human_obs/`），文件名如 `iron_door_run1.txt`。

## 论文写法提醒
你用的是自己的服务器（10.6 GB，更稳），harness 当时用评估服务器。"harness 失败 → 手动成功"同时混了**两个**因素：harness 的 sync-race 误判 **+** 更稳的手动环境。措辞写「SAER plans are executable in a live server；自动 harness 失败主要由 mineflayer sync race 主导」，**不要**写成干净的成功率对比。
