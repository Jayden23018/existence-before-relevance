# 训练数据规范 (Training Data Specification)

## 目标

为结构化检索（structural retrieval）提供高质量训练数据，支持：
- 依赖链深度（pipeline depth）匹配
- 命令序列模式（command pattern）匹配
- 前置条件（precondition）重叠匹配

---

## 1. 数据结构

### 1.1 顶层结构

```json
{
  "slug": "crafting/iron_axe",
  "name": "Craft an Iron Axe",
  "tab": "crafting",
  "level": "L1",
  "rationale": "...",
  "actual": "...",
  "plan": [...]
}
```

| 字段 | 说明 | 取值 |
|------|------|------|
| `slug` | 唯一标识 | `{tab}/{short_name}` |
| `tab` | 任务类型 | `collect`, `crafting`, `build`, `combat` |
| `level` | 难度级别 | `L1` (简单), `L2` (中等), `L3` (复杂) |
| `plan` | 执行步骤数组 | 见下文 |

---

## 2. Plan Step 结构（标准化后）

### 2.1 完整结构

```json
{
  "step": 1,
  "goal": "Smelt Iron Ore into Iron Ingots",
  "action_nl": "Use a Furnace to smelt the Iron Ore",
  "action_cmd": ["!smeltItem(\"iron_ore\", 3)"],
  "verify_cmd": ["!inventory(\"iron_ingot\")"],
  "preconditions": {
    "items": {
      "inventory": ["iron_ore:3"],
      "nearby": ["furnace"],
      "optional": []
    },
    "resources": {
      "fuel": 1
    },
    "access": ["crafting_table"]
  },
  "expected": "3 Iron Ingots appear in inventory.",
  "notes": "Each Iron Ore produces one Iron Ingot."
}
```

### 2.2 Preconditions 规范（关键改动）

**旧格式**（混乱）：
```json
"preconditions": [
  "Access to a Crafting Table",
  "2x Stick",
  "Furnace available",
  "Pickaxe recommended (but not required)"
]
```

**新格式**（结构化）：
```json
"preconditions": {
  "items": {
    "inventory": ["item:count"],    // 必须在背包中
    "equipped": ["item"],            // 必须装备
    "nearby": ["block"],             // 附近必须有
    "optional": ["item"]             // 可选（软性建议）
  },
  "resources": {
    "fuel": 1,                       // 需要燃料
    "durability": 0.5                // 工具耐久度要求
  },
  "access": ["underground", "trees"] // 环境访问权限
}
```

| 类别 | 字段 | 说明 | 示例 |
|------|------|------|------|
| `items.inventory` | 物品:数量 | 背包中必须有 | `["stick:2", "iron_ingot:3"]` |
| `items.equipped` | 物品 | 必须装备 | `["stone_pickaxe"]` |
| `items.nearby` | 方块 | 附近必须有 | `["crafting_table", "furnace"]` |
| `items.optional` | 物品 | 最好有（非必须） | `["torch"]` |
| `resources.fuel` | 数字 | 需要的燃料单位 | `1` |
| `access` | 环境描述 | 地点/生物群系 | `["underground", "trees", "water"]` |

---

## 3. 命令抽象规则

为了支持命令序列模式匹配，需要将具体命令抽象为模式：

### 3.1 抽象映射

| 具体命令 | 抽象模式 | 说明 |
|----------|----------|------|
| `!collectBlocks("oak_log", 3)` | `COLLECT_BLOCK:log` | 收集方块 |
| `!collectBlocks("iron_ore", 5)` | `COLLECT_BLOCK:ore` | 收集矿石 |
| `!craftRecipe("iron_sword", 1)` | `CRAFT:sword` | 制作武器 |
| `!craftRecipe("stick", 2)` | `CRAFT:component` | 制作组件 |
| `!smeltItem("iron_ore", 3)` | `SMELT:ore` | 熔炼 |
| `!searchForBlock("coal_ore", 32)` | `SEARCH:block` | 搜索方块 |
| `!searchForEntity("zombie", 32)` | `SEARCH:entity` | 搜索实体 |
| `!attack("zombie")` | `ATTACK:melee` | 攻击 |
| `!placeHere("crafting_table")` | `PLACE:block` | 放置方块 |

### 3.2 示例：抽象序列

**crafting/iron_axe** 的抽象序列：
```
[COLLECT_BLOCK:log, CRAFT:component, COLLECT_BLOCK:ore, SMELT:ore, CRAFT:tool]
```

**collect/coal** 的抽象序列：
```
[SEARCH:block, COLLECT_BLOCK:ore]
```

---

## 4. 难度级别定义

| 级别 | 深度 | 特征 | 示例 |
|------|------|------|------|
| **L1** | 1-3 步 | 单一资源，无依赖或简单依赖 | collect/coal, crafting/stone_sword |
| **L2** | 4-6 步 | 多资源，中等依赖链 | crafting/iron_axe, build/farm |
| **L3** | 7+ 步 | 多资源，复杂依赖，多阶段 | crafting/netherite_pickaxe, build/large_house |

---

## 5. 数据补充计划

### 5.1 当前数据覆盖度

| Tab | Level | 现有数量 | 目标数量 | 缺口 |
|-----|-------|----------|----------|------|
| **collect** | L1 | 4 | 5 | -1 |
| **collect** | L2 | 0 | 4 | -4 |
| **collect** | L3 | 0 | 2 | -2 |
| **crafting** | L1 | 3 | 6 | -3 |
| **crafting** | L2 | 2 | 6 | -4 |
| **crafting** | L3 | 0 | 4 | -4 |
| **build** | L1 | 2 | 4 | -2 |
| **build** | L2 | 0 | 3 | -3 |
| **build** | L3 | 0 | 2 | -2 |
| **combat** | L1 | 2 | 4 | -2 |
| **combat** | L2 | 0 | 3 | -3 |
| **combat** | L3 | 0 | 2 | -2 |
| **总计** | | 15 | 45 | -30 |

### 5.2 优先补充（高价值）

#### Crafting - L1 (缺口 -3)
```json
// 需要添加：
crafting/wooden_pickaxe    // 深度 3
crafting/stone_pickaxe     // 深度 4
crafting/stone_axe         // 深度 3
```

#### Crafting - L2 (缺口 -4)
```json
// 需要添加：
crafting/iron_sword        // 深度 4
crafting/iron_pickaxe      // 深度 5
crafting/iron_armor        // 深度 6
crafting/shield            // 深度 3
```

#### Collect - L2 (缺口 -4)
```json
// 需要添加：
collect/deepslate_iron     // 深度 3 (需要更好的镐)
collect/gold               // 深度 3
collect/copper             // 深度 3
collect/redstone           // 深度 3
```

#### Build - L2 (缺口 -3)
```json
// 需要添加：
build/farm                 // 深度 5
build/smelter              // 深度 4
build/storage_room         // 深度 4
```

---

## 6. 数据验证规则

### 6.1 必填检查
- [ ] `slug` 唯一
- [ ] `tab` ∈ {collect, crafting, build, combat}
- [ ] `level` ∈ {L1, L2, L3}
- [ ] `plan` 非空
- [ ] 每个 step 有 `action_cmd`

### 6.2 Preconditions 一致性
- [ ] 所有 `preconditions.items.inventory` 中的物品格式为 `item:count` 或 `item`
- [ ] count=1 时可省略，推荐写 `item:1` 保持一致
- [ ] 软性建议放入 `optional`，不在主列表

### 6.3 命令序列完整性
- [ ] 第一个 step 的 preconditions 应该是"环境类"（access/nearby）
- [ ] 最后一个 step 应该是验证或使用结果
- [ ] 中间步骤的 preconditions 应该引用前序步骤的 expected

---

## 7. 示例对比

### 7.1 旧格式 → 新格式

**crafting/iron_axe step3**：

```json
// 旧格式
{
  "step": 3,
  "goal": "Smelt Iron Ore into Iron Ingots",
  "action_cmd": ["!smeltItem(\"iron_ore\", 3)"],
  "preconditions": [
    "Furnace available",
    "At least 1 fuel source (coal, charcoal, or wood)"
  ]
}

// 新格式
{
  "step": 3,
  "goal": "Smelt Iron Ore into Iron Ingots",
  "action_cmd": ["!smeltItem(\"iron_ore\", 3)"],
  "verify_cmd": ["!inventory(\"iron_ingot\")"],
  "preconditions": {
    "items": {
      "inventory": ["iron_ore:3"],
      "nearby": ["furnace"],
      "optional": ["coal", "charcoal", "log"]
    },
    "resources": {
      "fuel": 1
    }
  }
}
```

### 7.2 深度对比示例

| 任务 | 深度 | 抽象序列 |
|------|------|----------|
| collect/coal | 2 | [SEARCH:block, COLLECT:block] |
| crafting/stone_sword | 3 | [COLLECT:block, CRAFT:component, CRAFT:tool] |
| crafting/iron_axe | 5 | [COLLECT:block, CRAFT:component, COLLECT:block, SMELT:ore, CRAFT:tool] |
| crafting/netherite_pickaxe | 8+ | [COLLECT, CRAFT, COLLECT, SMELT, CRAFT, CRAFT, SMELT, CRAFT] |

---

## 8. 实现优先级

1. **Phase 1**: 创建新规范文件 `v2/` 目录，保持旧数据不变
2. **Phase 2**: 迁移现有数据到新格式
3. **Phase 3**: 补充高价值任务（crafting L1/L2, collect L2）
4. **Phase 4**: 实现检索逻辑（深度+模式+precondition）
