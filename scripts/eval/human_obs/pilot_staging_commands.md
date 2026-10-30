# Pilot Staging & Tracker(DeepSeek-V3,18 次)

> **复制粘贴进 Notion 即可**(Markdown 表格 Notion 原生支持)。
> Pilot = DeepSeek-V3 × {wooden_sword, iron_helmet, diamond_boots} × {no_ret, saer} × 3 seed = 18 次。

## 怎么用(每个 trial 三步)

1. **RCON 重置 + 清库存**(每个 trial 开头执行):
```
/clear Max
```
2. **复制下表"staging 命令"整列 → 粘到 RCON 执行**(给 bot 原矿/耗材/成品锭)。
3. **启动 bot + 发 prompt**:
```bash
# saer_cold 条件
node main.js --profiles profiles/deepseek_live_saer.json
# no_retrieval 条件
node main.js --profiles profiles/deepseek_live_no_ret.json
```
   bot 进服后,游戏内对它说 prompt 列那句话(例:`craft an iron helmet`)。

## Pilot 三任务 staging

| 任务 | Level | bot prompt(对它说) | staging 命令(RCON `/give`,逐条执行) | 说明 |
|------|-------|--------------------|--------------------------------------|------|
| craft/wooden_sword | L1 | `craft a wooden sword` | `/give Max oak_log 6`<br>`/give Max cobblestone 16` | 纯木链,无烧步。L1 基线 sanity。 |
| craft/iron_helmet | L2 | `craft an iron helmet` | `/give Max iron_ore 10`<br>`/give Max oak_log 6`<br>`/give Max cobblestone 24`<br>`/give Max iron_ingot 5` | 🔑 给 5 铁锭让"烧"步被 pruneSteps skip;iron_ore/oak_log/cobblestone 让挖矿+造熔炉+工具链照常执行。 |
| craft/diamond_boots | L3 | `craft diamond boots` | `/give Max diamond_ore 4`<br>`/give Max iron_ore 6`<br>`/give Max oak_log 6`<br>`/give Max cobblestone 24`<br>`/give Max diamond 4`<br>`/give Max iron_ingot 6` | 🔑 钻石+铁锭双 skip(钻镐要铁镐链→给铁锭 skip 烧铁;钻石靴要钻→给钻 skip 烧钻)。L3 最长链。 |

## Pilot 结果记录表(填 1=通过 / 0=失败)

| 任务 | Level | no_ret s1 | no_ret s2 | no_ret s3 | saer s1 | saer s2 | saer s3 |
|------|-------|:---------:|:---------:|:---------:|:-------:|:-------:|:-------:|
| craft/wooden_sword | L1 | | | | | | |
| craft/iron_helmet | L2 | | | | | | |
| craft/diamond_boots | L3 | | | | | | |

**Pilot 通过判据**:
- wooden_sword(L1):no_ret 和 saer 都该过(基线,不过=环境坏)
- iron_helmet(L2):静态 SAER 显著区,期望 saer pass ≥ no_ret pass
- diamond_boots(L3):已有 06-30 saer 成功 trace,期望复现
- **上全量条件**:L2/L3 上 saer pass@1 > no_ret pass@1(方向对即可)
- **停条件**:两者无差异/反向 → live 仍被框架主导,只留 trace 作 mechanism 佐证

## 失败根因记录(每个 0 都填)

| 任务 | 条件 | seed | 失败步骤 | 根因(plan? staging? framework?) | log 文件名 |
|------|------|------|---------|-------------------------------|-----------|
| | | | | | |
