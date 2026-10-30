# Live pass@k Tracker — 人为执行(手工 staging + 手工下任务)

**协议**:4 模型条件 × 21 任务 × 3 seed = 252 trials。先跑 **Pilot(下表标 ★ 的 3 任务 × DeepSeek 两条件 × 3 seed = 18 次)**,信号清晰再上全量。

**填法**:每跑完一次,把对应格子填 `1`(通过:goal_item 进 inventory 且 count 够)或 `0`(失败)。3 个 seed 都填完后,pass@1 = 三次里成功的次数(0~3),pass@3 = 三次里有任一次成功即 1。

**条件**:
- `no_ret` = no_retrieval(zero-shot,空 few-shot)
- `saer` = saer_cold(SAER 4 维检索)

---

## T1+T2: DeepSeek-V3(deepseek-chat)

| 任务 | Level | no_ret s1 | no_ret s2 | no_ret s3 | saer s1 | saer s2 | saer s3 |
|------|-------|:---------:|:---------:|:---------:|:-------:|:-------:|:-------:|
| ★ craft/wooden_sword | L1 | _ | _ | _ | _ | _ | _ |
| craft/chest | L1 | _ | _ | _ | _ | _ | _ |
| craft/ladder | L1 | _ | _ | _ | _ | _ | _ |
| craft/oak_door | L1 | _ | _ | _ | _ | _ | _ |
| craft/wooden_shovel | L1 | _ | _ | _ | _ | _ | _ |
| collect/gravel | L1 | _ | _ | _ | _ | _ | _ |
| collect/pumpkin | L1 | _ | _ | _ | _ | _ | _ |
| ★ craft/iron_helmet | L2 | _ | _ | _ | _ | _ | _ |
| craft/iron_boots | L2 | _ | _ | _ | _ | _ | _ |
| craft/stone_bricks | L2 | _ | _ | _ | _ | _ | _ |
| craft/iron_bars | L2 | _ | _ | _ | _ | _ | _ |
| craft/stone_button | L2 | _ | _ | _ | _ | _ | _ |
| craft/cauldron | L2 | _ | _ | _ | _ | _ | _ |
| craft/iron_door | L2 | _ | _ | _ | _ | _ | _ |
| ★ craft/diamond_boots | L3 | _ | _ | _ | _ | _ | _ |
| craft/diamond_axe | L3 | _ | _ | _ | _ | _ | _ |
| craft/golden_pickaxe | L3 | _ | _ | _ | _ | _ | _ |
| craft/anvil | L3 | _ | _ | _ | _ | _ | _ |
| craft/compass | L3 | _ | _ | _ | _ | _ | _ |
| craft/clock | L3 | _ | _ | _ | _ | _ | _ |
| craft/iron_leggings | L3 | _ | _ | _ | _ | _ | _ |

**DeepSeek 汇总**(填完算):
- no_ret pass@1 = __ / 21×3=63 ; pass@3(任务级)= __ / 21
- saer  pass@1 = __ / 63 ; pass@3 = __ / 21

---

## T3+T4: Qwen3-8B(走全量前再开)

*(pilot 通过后复制上表结构,模型换 Qwen3-8B)*

---

## Pilot 通过判据(只看 ★ 三任务 × DeepSeek)

- [ ] wooden_sword(L1):no_ret 和 saer 都该过(基线 sanity,不过=环境坏)
- [ ] iron_helmet(L2):静态 SAER 显著区,期望 saer pass ≥ no_ret pass
- [ ] diamond_boots(L3):已有 06-30 saer 成功 trace,期望复现

**上全量条件**:L2/L3 上 saer pass@1 > no_ret pass@1(方向对即可,差 1~2 个也认)。
**停条件**:两者无差异或反向 → live 仍被框架主导,回讨论只留 trace 作 mechanism 佐证。

---

## 失败记录区(任何 0 都在这里写根因,事后取证用)

| slug | model | cond | seed | 失败步骤 | 根因(staging? plan? framework?) | log 文件 |
|------|-------|------|------|---------|-------------------------------|---------|
| | | | | | | |
