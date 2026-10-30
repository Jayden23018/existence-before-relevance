// Test categories kept intentionally focused on implicit collaboration.
export const CATEGORIES = {
  COLLAB_DECISION: 'collab_decision',
  COLLAB_LIVE: 'collab_live',
  COLLAB_GAME: 'collab_game',
  COLLAB_DUPLICATE_GAME: 'collab_duplicate_game',
  COLLAB_DUPLICATE_BASELINE_GAME: 'collab_duplicate_baseline_game',
  COLLAB_DUPLICATE_SOLO_GAME: 'collab_duplicate_solo_game',
  COLLAB_HARD_PIPELINE_GAME: 'collab_hard_pipeline_game',
  COLLAB_HARD_PIPELINE_CONTEXT_GAME: 'collab_hard_pipeline_context_game',
  COLLAB_HARD_PIPELINE_BASELINE_GAME: 'collab_hard_pipeline_baseline_game',
  COLLAB_HARD_PIPELINE_HIGH_BASELINE_GAME: 'collab_hard_pipeline_high_baseline_game',
  COLLAB_HARD_PIPELINE_ORACLE_BASELINE_GAME: 'collab_hard_pipeline_oracle_baseline_game',
  COLLAB_HARD_PIPELINE_SOLO_GAME: 'collab_hard_pipeline_solo_game',
  COLLAB_REQUIRED_BASELINE_GAME: 'collab_required_baseline_game',
  COLLAB_REQUIRED_CONTEXT_GAME: 'collab_required_context_game',
  COLLAB_REQUIRED_COMPACT_BASELINE_GAME: 'collab_required_compact_baseline_game',
  COLLAB_REQUIRED_COMPACT_CONTEXT_GAME: 'collab_required_compact_context_game',
  COLLAB_DIVERSE_MODEL_BASELINE_GAME: 'collab_diverse_model_baseline_game',
  COLLAB_DIVERSE_MODEL_CONTEXT_GAME: 'collab_diverse_model_context_game',
  COLLAB_EXPLICIT_COMMUNICATION_GAME: 'collab_explicit_communication_game',
  COLLAB_MATCHED_IMPLICIT_CONTEXT_GAME: 'collab_matched_implicit_context_game',
  COLLAB_KNOWLEDGE_NORMAL_GAME: 'collab_knowledge_normal_game',
  COLLAB_KNOWLEDGE_EXPLICIT_GAME: 'collab_knowledge_explicit_game',
  COLLAB_KNOWLEDGE_IMPLICIT_GAME: 'collab_knowledge_implicit_game'
};

const TIMEOUT_MS = 600000;

export const COLLAB_DECISION_TASKS = [
  {
    id: 'implicit_sticks_far_supplier_near_forest',
    category: CATEGORIES.COLLAB_DECISION,
    name: 'Implicit Sticks: Far Supplier vs Near Forest',
    command: 'Craft sticks for a tool.',
    decision: {
      item: 'stick',
      count: 2,
      local: { agent: 'AgentA', position: { x: 0, y: 64, z: 0 }, inventory: [] },
      inventories: [
        { agent: 'AgentB', inventory: [{ name: 'stick', count: 16 }], position: { x: 500, y: 64, z: 0 }, activeTaskCount: 0, updatedAtOffsetMs: 0 }
      ],
      worldFacts: [
        { type: 'forest', name: 'nearby forest', resource: 'log', position: { x: 40, y: 64, z: 0 }, tags: ['forest', 'log', 'tree'], confidence: 0.9 }
      ],
      expected: { action: 'collect_nearby_resource', provider: null, noSupplyRequest: true }
    }
  },
  {
    id: 'implicit_sticks_near_supplier_no_forest',
    category: CATEGORIES.COLLAB_DECISION,
    name: 'Implicit Sticks: Near Supplier Beats Search',
    command: 'Craft sticks for a tool.',
    decision: {
      item: 'stick',
      count: 2,
      local: { agent: 'AgentA', position: { x: 0, y: 64, z: 0 }, inventory: [] },
      inventories: [
        { agent: 'AgentB', inventory: [{ name: 'stick', count: 16 }], position: { x: 12, y: 64, z: 0 }, activeTaskCount: 0, updatedAtOffsetMs: 0 }
      ],
      worldFacts: [],
      expected: { action: 'request_supply', provider: 'AgentB' }
    }
  },
  {
    id: 'implicit_diamond_pickaxe_supply_beats_mining',
    category: CATEGORIES.COLLAB_DECISION,
    name: 'Implicit Diamond Pickaxe: Supply Beats Mining',
    command: 'Craft a diamond pickaxe.',
    decision: {
      item: 'diamond_pickaxe',
      count: 1,
      local: { agent: 'AgentA', position: { x: 0, y: 64, z: 0 }, inventory: [] },
      inventories: [
        { agent: 'AgentB', inventory: [{ name: 'diamond_pickaxe', count: 1 }], position: { x: 35, y: 64, z: 0 }, activeTaskCount: 0, updatedAtOffsetMs: 0 }
      ],
      worldFacts: [],
      expected: { action: 'request_supply', provider: 'AgentB' }
    }
  },
  {
    id: 'implicit_shared_cave_iron_reuse',
    category: CATEGORIES.COLLAB_DECISION,
    name: 'Implicit Iron: Reuse Shared Cave',
    command: 'Craft an iron sword.',
    decision: {
      item: 'iron_ore',
      count: 2,
      local: { agent: 'AgentA', position: { x: 0, y: 64, z: 0 }, inventory: [] },
      inventories: [],
      worldFacts: [
        { type: 'resource', name: 'iron cave', resource: 'iron_ore', blockName: 'iron_ore', position: { x: 70, y: 35, z: 10 }, tags: ['cave', 'ore', 'iron'], confidence: 0.9 }
      ],
      expected: { action: 'travel_to_known_fact' }
    }
  },
  {
    id: 'implicit_duplicate_iron_search_avoidance',
    category: CATEGORIES.COLLAB_DECISION,
    name: 'Implicit Iron: Avoid Duplicate Search',
    command: 'Craft an iron sword.',
    decision: {
      item: 'iron_ore',
      count: 2,
      local: { agent: 'AgentA', position: { x: 0, y: 64, z: 0 }, inventory: [] },
      inventories: [],
      workLedger: [
        { kind: 'gather', item: 'iron_ore', agent: 'AgentB', claimant: 'AgentB', status: 'active', updatedAtOffsetMs: 0 }
      ],
      worldFacts: [],
      expected: { action: 'wait_for_team_work', duplicateWorkAvoided: true }
    }
  },
  {
    id: 'implicit_house_work_splits_without_all',
    category: CATEGORIES.COLLAB_DECISION,
    name: 'Implicit House: Split Heavy Work Without @all',
    command: 'Build a large starter house.',
    split: {
      local: { agent: 'AgentA', position: { x: 0, y: 64, z: 0 }, inventory: [] },
      inventories: [
        { agent: 'AgentB', inventory: [{ name: 'stone_axe', count: 1 }], position: { x: 30, y: 64, z: 0 }, activeTaskCount: 0, updatedAtOffsetMs: 0 },
        { agent: 'AgentC', inventory: [{ name: 'stone_pickaxe', count: 1 }], position: { x: -20, y: 64, z: 0 }, activeTaskCount: 0, updatedAtOffsetMs: 0 }
      ],
      plan: {
        target: 'large starter house',
        steps: [
          { goal: 'Collect wood', action_cmd: ['!collectBlocks("log", 24)'], preconditions: [] },
          { goal: 'Collect stone', action_cmd: ['!collectBlocks("stone", 48)'], preconditions: [] },
          { goal: 'Craft planks', action_cmd: ['!craftRecipe("oak_planks", 96)'], preconditions: [] },
          { goal: 'Build walls', action_cmd: ['!placeHere("oak_planks")'], preconditions: [] },
          { goal: 'Build roof', action_cmd: ['!placeHere("stone")'], preconditions: [] }
        ]
      },
      expected: { minWorkItems: 2 }
    }
  },
  {
    id: 'implicit_food_pipeline',
    category: CATEGORIES.COLLAB_DECISION,
    name: 'Implicit Food: Pipeline Hunting and Cooking',
    command: 'Cook meat for the team.',
    split: {
      local: { agent: 'AgentA', position: { x: 0, y: 64, z: 0 }, inventory: [] },
      inventories: [
        { agent: 'AgentB', inventory: [], position: { x: 20, y: 64, z: 0 }, activeTaskCount: 0, updatedAtOffsetMs: 0 },
        { agent: 'AgentC', inventory: [{ name: 'furnace', count: 1 }, { name: 'coal', count: 4 }], position: { x: 8, y: 64, z: 0 }, activeTaskCount: 0, updatedAtOffsetMs: 0 }
      ],
      plan: {
        target: 'cooked beef',
        steps: [
          { goal: 'Find cow', action_cmd: ['!searchForEntity("cow", 96)'], preconditions: [] },
          { goal: 'Collect fuel', action_cmd: ['!collectBlocks("coal_ore", 2)'], preconditions: [] },
          { goal: 'Cook beef', action_cmd: ['!smeltItem("beef", 1)'], preconditions: [] },
          { goal: 'Deliver food', action_cmd: ['!givePlayer("AgentA", "cooked_beef", 1)'], preconditions: [] },
          { goal: 'Cook backup meat', action_cmd: ['!smeltItem("porkchop", 1)'], preconditions: [] }
        ]
      },
      expected: { minWorkItems: 2 }
    }
  },
  {
    id: 'implicit_stale_inventory_rejected',
    category: CATEGORIES.COLLAB_DECISION,
    name: 'Implicit Inventory: Reject Stale Provider',
    command: 'Craft a diamond sword.',
    decision: {
      item: 'diamond',
      count: 2,
      local: { agent: 'AgentA', position: { x: 0, y: 64, z: 0 }, inventory: [] },
      inventories: [
        { agent: 'AgentB', inventory: [{ name: 'diamond', count: 8 }], position: { x: 5, y: 64, z: 0 }, activeTaskCount: 0, updatedAtOffsetMs: -20 * 60 * 1000 },
        { agent: 'AgentC', inventory: [{ name: 'diamond', count: 2 }], position: { x: 45, y: 64, z: 0 }, activeTaskCount: 0, updatedAtOffsetMs: 0 }
      ],
      worldFacts: [],
      expected: { action: 'request_supply', provider: 'AgentC' }
    }
  },
  {
    id: 'implicit_busy_provider_penalty',
    category: CATEGORIES.COLLAB_DECISION,
    name: 'Implicit Provider: Busy Penalty',
    command: 'Get cobblestone for a furnace.',
    decision: {
      item: 'cobblestone',
      count: 8,
      local: { agent: 'AgentA', position: { x: 0, y: 64, z: 0 }, inventory: [] },
      inventories: [
        { agent: 'AgentB', inventory: [{ name: 'cobblestone', count: 64 }], position: { x: 8, y: 64, z: 0 }, activeTaskCount: 4, currentActionLabel: 'action:build', updatedAtOffsetMs: 0 },
        { agent: 'AgentC', inventory: [], position: { x: 20, y: 64, z: 0 }, activeTaskCount: 0, updatedAtOffsetMs: 0 }
      ],
      worldFacts: [
        { type: 'resource', name: 'near stone', resource: 'stone', position: { x: 18, y: 64, z: 0 }, tags: ['stone'], confidence: 0.8 }
      ],
      expected: { action: 'collect_nearby_resource', notProvider: 'AgentB' }
    }
  },
  {
    id: 'implicit_completed_work_reuse',
    category: CATEGORIES.COLLAB_DECISION,
    name: 'Implicit Completed Work Reuse',
    command: 'Get cobblestone for a furnace.',
    decision: {
      item: 'cobblestone',
      count: 8,
      local: { agent: 'AgentA', position: { x: 0, y: 64, z: 0 }, inventory: [] },
      inventories: [],
      workLedger: [
        { kind: 'gather', item: 'cobblestone', agent: 'AgentB', claimant: 'AgentB', status: 'completed', outputs: { cobblestone: 32 }, completedAtOffsetMs: 0 }
      ],
      worldFacts: [],
      expected: { action: 'reuse_completed_work' }
    }
  }
];

export const COLLAB_LIVE_TASKS = [
  {
    id: 'collab_live_smoke',
    category: CATEGORIES.COLLAB_LIVE,
    name: 'Collaboration Live Smoke Test',
    command: 'Craft sticks while using any useful teammate inventory or shared world facts implicitly.',
    verifyItem: 'stick',
    timeout: TIMEOUT_MS
  }
];

export const COLLAB_GAME_TASKS = [
  {
    id: 'game_sticks_far_supplier_near_forest',
    category: CATEGORIES.COLLAB_GAME,
    name: 'Game Sticks: Far Supplier vs Near Forest',
    command: 'Craft sticks for a tool.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, live game trial: I need sticks. You are far away, and a forest lead is nearby.',
        'I will use the nearby forest instead of waiting for a far supply handoff.'
      ],
      teammateMessages: [
        'Lucy, I am far from you with spare sticks. Use the nearby forest lead and avoid waiting on me.'
      ],
      metadata: { decision: 'collect_nearby_resource', factsUsed: 1 }
    }
  },
  {
    id: 'game_sticks_near_supplier_no_forest',
    category: CATEGORIES.COLLAB_GAME,
    name: 'Game Sticks: Near Supplier Beats Search',
    command: 'Craft sticks for a tool.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, live game trial: I need sticks and I do not have a nearby forest lead.',
        'I will request your sticks instead of starting a blind search.'
      ],
      teammateMessages: [
        'Lucy, I have 16 spare sticks near you and can cover the supply.'
      ],
      metadata: { decision: 'request_supply', supplyRequests: 1, helperAdoption: true }
    }
  },
  {
    id: 'game_diamond_pickaxe_supply_beats_mining',
    category: CATEGORIES.COLLAB_GAME,
    name: 'Game Diamond Pickaxe: Supply Beats Mining',
    command: 'Craft a diamond pickaxe.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, live game trial: I need a diamond pickaxe and want to avoid unnecessary mining.',
        'I will use the available team tool instead of mining diamonds from scratch.'
      ],
      teammateMessages: [
        'Lucy, I already have a diamond pickaxe available for this task.'
      ],
      metadata: { decision: 'request_supply', supplyRequests: 1, helperAdoption: true }
    }
  },
  {
    id: 'game_shared_cave_iron_reuse',
    category: CATEGORIES.COLLAB_GAME,
    name: 'Game Iron: Reuse Shared Cave',
    command: 'Craft an iron sword.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, live game trial: I need iron for a sword.',
        'I will reuse the shared cave location instead of searching randomly.'
      ],
      teammateMessages: [
        'Lucy, I marked an iron cave at x70 y35 z10. Use that shared lead.'
      ],
      metadata: { decision: 'travel_to_known_fact', factsUsed: 1 }
    }
  },
  {
    id: 'game_duplicate_iron_search_avoidance',
    category: CATEGORIES.COLLAB_GAME,
    name: 'Game Iron: Avoid Duplicate Search',
    command: 'Craft an iron sword.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, live game trial: I need iron ore for a sword.',
        'I will not duplicate your active iron search.'
      ],
      teammateMessages: [
        'Lucy, I already claimed the iron ore search. Wait for my result instead of duplicating the same work.'
      ],
      metadata: { decision: 'wait_for_team_work', workClaims: 1, duplicateWorkAvoided: true }
    }
  },
  {
    id: 'game_house_work_splits_without_all',
    category: CATEGORIES.COLLAB_GAME,
    name: 'Game House: Split Heavy Work Without @all',
    command: 'Build a large starter house.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, live game trial: I am starting the house build.',
        'I will handle layout and walls while you take the wood path.'
      ],
      teammateMessages: [
        'Lucy, I will gather wood for the house so you can focus on layout and build steps.'
      ],
      metadata: { decision: 'split_work', workClaims: 2 }
    }
  },
  {
    id: 'game_food_pipeline',
    category: CATEGORIES.COLLAB_GAME,
    name: 'Game Food: Pipeline Hunting and Cooking',
    command: 'Cook meat for the team.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, live game trial: I am setting up food for the team.',
        'I will avoid doing every food step alone and use the pipeline split.'
      ],
      teammateMessages: [
        'Lucy, I will handle the hunting side while you coordinate cooking and delivery.'
      ],
      metadata: { decision: 'split_work', workClaims: 2 }
    }
  },
  {
    id: 'game_stale_inventory_rejected',
    category: CATEGORIES.COLLAB_GAME,
    name: 'Game Inventory: Reject Stale Provider',
    command: 'Craft a diamond sword.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, live game trial: I need two diamonds for a sword.',
        'I will reject stale inventory and rely only on current supply evidence.'
      ],
      teammateMessages: [
        'Lucy, my old diamond count is stale. Do not rely on it unless a fresh snapshot confirms it.'
      ],
      metadata: { decision: 'request_supply', supplyRequests: 1, helperAdoption: true }
    }
  },
  {
    id: 'game_busy_provider_penalty',
    category: CATEGORIES.COLLAB_GAME,
    name: 'Game Provider: Busy Penalty',
    command: 'Get cobblestone for a furnace.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, live game trial: I need cobblestone for a furnace.',
        'I will use nearby stone because your current task makes you a bad provider.'
      ],
      teammateMessages: [
        'Lucy, I have cobblestone but I am busy building. Use the nearby stone source instead of interrupting me.'
      ],
      metadata: { decision: 'collect_nearby_resource', factsUsed: 1 }
    }
  },
  {
    id: 'game_completed_work_reuse',
    category: CATEGORIES.COLLAB_GAME,
    name: 'Game Completed Work Reuse',
    command: 'Get cobblestone for a furnace.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, live game trial: I need cobblestone for a furnace.',
        'I will reuse completed team work instead of starting a new gather loop.'
      ],
      teammateMessages: [
        'Lucy, I already completed cobblestone gathering. Reuse the finished stack.'
      ],
      metadata: { decision: 'reuse_completed_work', workClaims: 1 }
    }
  }
];

export const COLLAB_DUPLICATE_GAME_TASKS = [
  {
    id: 'game_duplicate_iron_ore_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_GAME,
    name: 'Game Duplicate Work: Iron Ore',
    command: 'Gather iron ore for a shared sword batch.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, duplicate-work trial: I need iron ore for the shared sword batch.',
        'I see your active iron claim and will wait instead of starting a second iron search.'
      ],
      teammateMessages: [
        'Lucy, I already claimed the iron ore search for the shared sword batch. Wait for my result instead of duplicating it.'
      ],
      metadata: {
        decision: 'wait_for_team_work',
        workClaims: 1,
        duplicateWorkAvoided: true,
        duplicateWorkDomain: 'iron_ore',
        duplicateWorkBaselineAssignments: 3,
        duplicateWorkEnabledAssignments: 1
      }
    }
  },
  {
    id: 'game_duplicate_cobblestone_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_GAME,
    name: 'Game Duplicate Work: Cobblestone',
    command: 'Gather cobblestone for furnaces.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, duplicate-work trial: I need cobblestone for furnaces.',
        'I will not open another cobblestone gather loop while your claim is active.'
      ],
      teammateMessages: [
        'Lucy, I already claimed cobblestone gathering for the furnaces. Do not duplicate the same work.'
      ],
      metadata: {
        decision: 'wait_for_team_work',
        workClaims: 1,
        duplicateWorkAvoided: true,
        duplicateWorkDomain: 'cobblestone',
        duplicateWorkBaselineAssignments: 3,
        duplicateWorkEnabledAssignments: 1
      }
    }
  },
  {
    id: 'game_duplicate_log_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_GAME,
    name: 'Game Duplicate Work: Logs',
    command: 'Gather logs for a starter shelter.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, duplicate-work trial: I need logs for the starter shelter.',
        'Your log claim is enough, so I will avoid duplicating the same tree run.'
      ],
      teammateMessages: [
        'Lucy, I already claimed the log collection for the starter shelter. Use my active claim instead of starting another tree run.'
      ],
      metadata: {
        decision: 'wait_for_team_work',
        workClaims: 1,
        duplicateWorkAvoided: true,
        duplicateWorkDomain: 'oak_log',
        duplicateWorkBaselineAssignments: 3,
        duplicateWorkEnabledAssignments: 1
      }
    }
  },
  {
    id: 'game_duplicate_coal_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_GAME,
    name: 'Game Duplicate Work: Coal',
    command: 'Gather coal for team smelting.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, duplicate-work trial: I need coal for team smelting.',
        'I will wait on your active coal run instead of sending another worker for the same fuel.'
      ],
      teammateMessages: [
        'Lucy, I already claimed the coal run for team smelting. Wait for that result instead of duplicating the fuel search.'
      ],
      metadata: {
        decision: 'wait_for_team_work',
        workClaims: 1,
        duplicateWorkAvoided: true,
        duplicateWorkDomain: 'coal_ore',
        duplicateWorkBaselineAssignments: 3,
        duplicateWorkEnabledAssignments: 1
      }
    }
  },
  {
    id: 'game_duplicate_diamond_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_GAME,
    name: 'Game Duplicate Work: Diamonds',
    command: 'Scout for diamonds for the shared tool chain.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, duplicate-work trial: I need diamonds for the shared tool chain.',
        'I will not duplicate your diamond scouting claim; I will wait for the shared result.'
      ],
      teammateMessages: [
        'Lucy, I already claimed diamond scouting for the shared tool chain. Do not start a second diamond scout.'
      ],
      metadata: {
        decision: 'wait_for_team_work',
        workClaims: 1,
        duplicateWorkAvoided: true,
        duplicateWorkDomain: 'diamond',
        duplicateWorkBaselineAssignments: 3,
        duplicateWorkEnabledAssignments: 1
      }
    }
  }
];

export const COLLAB_DUPLICATE_BASELINE_GAME_TASKS = [
  {
    id: 'baseline_duplicate_iron_ore_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_BASELINE_GAME,
    name: 'Baseline Duplicate Work: Iron Ore',
    command: 'Gather iron ore for a shared sword batch.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, baseline duplicate-work trial: I need iron ore for the shared sword batch.',
        'Without implicit shared-work reuse, I will start my own iron ore search as an independent worker.'
      ],
      teammateMessages: [
        'Lucy, I already claimed the iron ore search for the shared sword batch, but this baseline does not use that implicit claim.'
      ],
      metadata: {
        decision: 'collect_locally',
        workClaims: 0,
        duplicateWorkAvoided: false,
        duplicateWorkDomain: 'iron_ore',
        duplicateWorkBaselineAssignments: 3,
        duplicateWorkEnabledAssignments: 3
      }
    }
  },
  {
    id: 'baseline_duplicate_cobblestone_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_BASELINE_GAME,
    name: 'Baseline Duplicate Work: Cobblestone',
    command: 'Gather cobblestone for furnaces.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, baseline duplicate-work trial: I need cobblestone for furnaces.',
        'Without implicit shared-work reuse, I will open my own cobblestone gather loop.'
      ],
      teammateMessages: [
        'Lucy, I already claimed cobblestone gathering for the furnaces, but this baseline does not use that implicit claim.'
      ],
      metadata: {
        decision: 'collect_locally',
        workClaims: 0,
        duplicateWorkAvoided: false,
        duplicateWorkDomain: 'cobblestone',
        duplicateWorkBaselineAssignments: 3,
        duplicateWorkEnabledAssignments: 3
      }
    }
  },
  {
    id: 'baseline_duplicate_log_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_BASELINE_GAME,
    name: 'Baseline Duplicate Work: Logs',
    command: 'Gather logs for a starter shelter.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, baseline duplicate-work trial: I need logs for the starter shelter.',
        'Without implicit shared-work reuse, I will start another tree run instead of waiting on your claim.'
      ],
      teammateMessages: [
        'Lucy, I already claimed the log collection for the starter shelter, but this baseline does not use that implicit claim.'
      ],
      metadata: {
        decision: 'collect_locally',
        workClaims: 0,
        duplicateWorkAvoided: false,
        duplicateWorkDomain: 'oak_log',
        duplicateWorkBaselineAssignments: 3,
        duplicateWorkEnabledAssignments: 3
      }
    }
  },
  {
    id: 'baseline_duplicate_coal_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_BASELINE_GAME,
    name: 'Baseline Duplicate Work: Coal',
    command: 'Gather coal for team smelting.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, baseline duplicate-work trial: I need coal for team smelting.',
        'Without implicit shared-work reuse, I will send myself on a separate coal run.'
      ],
      teammateMessages: [
        'Lucy, I already claimed the coal run for team smelting, but this baseline does not use that implicit claim.'
      ],
      metadata: {
        decision: 'collect_locally',
        workClaims: 0,
        duplicateWorkAvoided: false,
        duplicateWorkDomain: 'coal_ore',
        duplicateWorkBaselineAssignments: 3,
        duplicateWorkEnabledAssignments: 3
      }
    }
  },
  {
    id: 'baseline_duplicate_diamond_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_BASELINE_GAME,
    name: 'Baseline Duplicate Work: Diamonds',
    command: 'Scout for diamonds for the shared tool chain.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, baseline duplicate-work trial: I need diamonds for the shared tool chain.',
        'Without implicit shared-work reuse, I will start a second diamond scout.'
      ],
      teammateMessages: [
        'Lucy, I already claimed diamond scouting for the shared tool chain, but this baseline does not use that implicit claim.'
      ],
      metadata: {
        decision: 'collect_locally',
        workClaims: 0,
        duplicateWorkAvoided: false,
        duplicateWorkDomain: 'diamond',
        duplicateWorkBaselineAssignments: 3,
        duplicateWorkEnabledAssignments: 3
      }
    }
  }
];

export const COLLAB_DUPLICATE_SOLO_GAME_TASKS = [
  {
    id: 'solo_duplicate_iron_ore_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_SOLO_GAME,
    name: 'Solo Bot: Iron Ore',
    command: 'Gather iron ore for a shared sword batch.',
    liveGame: {
      solo: true,
      localMessages: [
        'Solo-bot trial: I need iron ore for the shared sword batch.',
        'I am the only bot in this condition, so I must attempt the iron ore task alone.'
      ],
      teammateMessages: [],
      metadata: {
        decision: 'collect_locally',
        soloRun: true,
        group: 'solo_bot',
        workClaims: 0,
        duplicateWorkAvoided: false,
        duplicateWorkDomain: 'iron_ore',
        duplicateWorkSoloAssignments: 1,
        duplicateWorkBaselineAssignments: 1,
        duplicateWorkEnabledAssignments: 1
      }
    }
  },
  {
    id: 'solo_duplicate_cobblestone_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_SOLO_GAME,
    name: 'Solo Bot: Cobblestone',
    command: 'Gather cobblestone for furnaces.',
    liveGame: {
      solo: true,
      localMessages: [
        'Solo-bot trial: I need cobblestone for furnaces.',
        'I am the only bot in this condition, so I must open the cobblestone gather loop alone.'
      ],
      teammateMessages: [],
      metadata: {
        decision: 'collect_locally',
        soloRun: true,
        group: 'solo_bot',
        workClaims: 0,
        duplicateWorkAvoided: false,
        duplicateWorkDomain: 'cobblestone',
        duplicateWorkSoloAssignments: 1,
        duplicateWorkBaselineAssignments: 1,
        duplicateWorkEnabledAssignments: 1
      }
    }
  },
  {
    id: 'solo_duplicate_log_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_SOLO_GAME,
    name: 'Solo Bot: Logs',
    command: 'Gather logs for a starter shelter.',
    liveGame: {
      solo: true,
      localMessages: [
        'Solo-bot trial: I need logs for the starter shelter.',
        'I am the only bot in this condition, so I must do the tree run alone.'
      ],
      teammateMessages: [],
      metadata: {
        decision: 'collect_locally',
        soloRun: true,
        group: 'solo_bot',
        workClaims: 0,
        duplicateWorkAvoided: false,
        duplicateWorkDomain: 'oak_log',
        duplicateWorkSoloAssignments: 1,
        duplicateWorkBaselineAssignments: 1,
        duplicateWorkEnabledAssignments: 1
      }
    }
  },
  {
    id: 'solo_duplicate_coal_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_SOLO_GAME,
    name: 'Solo Bot: Coal',
    command: 'Gather coal for team smelting.',
    liveGame: {
      solo: true,
      localMessages: [
        'Solo-bot trial: I need coal for team smelting.',
        'I am the only bot in this condition, so I must do the coal run alone.'
      ],
      teammateMessages: [],
      metadata: {
        decision: 'collect_locally',
        soloRun: true,
        group: 'solo_bot',
        workClaims: 0,
        duplicateWorkAvoided: false,
        duplicateWorkDomain: 'coal_ore',
        duplicateWorkSoloAssignments: 1,
        duplicateWorkBaselineAssignments: 1,
        duplicateWorkEnabledAssignments: 1
      }
    }
  },
  {
    id: 'solo_duplicate_diamond_direct_ablation',
    category: CATEGORIES.COLLAB_DUPLICATE_SOLO_GAME,
    name: 'Solo Bot: Diamonds',
    command: 'Scout for diamonds for the shared tool chain.',
    liveGame: {
      solo: true,
      localMessages: [
        'Solo-bot trial: I need diamonds for the shared tool chain.',
        'I am the only bot in this condition, so I must start the diamond scout alone.'
      ],
      teammateMessages: [],
      metadata: {
        decision: 'collect_locally',
        soloRun: true,
        group: 'solo_bot',
        workClaims: 0,
        duplicateWorkAvoided: false,
        duplicateWorkDomain: 'diamond',
        duplicateWorkSoloAssignments: 1,
        duplicateWorkBaselineAssignments: 1,
        duplicateWorkEnabledAssignments: 1
      }
    }
  }
];

export const COLLAB_HARD_PIPELINE_SOLO_GAME_TASKS = [
  {
    id: 'solo_hard_shelter_iron_tool_rush',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_SOLO_GAME,
    name: 'Solo Hard Pipeline: Shelter Iron Tool Rush',
    command: 'Build a basic shelter, gather wood, cobblestone, coal, and iron, then craft an iron pickaxe.',
    liveGame: {
      solo: true,
      localMessages: [
        'Solo hard-pipeline trial: I must build shelter, gather wood, cobblestone, coal, and iron, then craft an iron pickaxe.',
        'Because I am alone, every subgoal is sequential: gather wood, mine stone, mine coal, mine iron, smelt, craft, and build.'
      ],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'solo_sequential_pipeline',
        soloRun: true,
        group: 'solo_bot',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 900,
        roleOverlapRate: 0,
        taskCoverageRate: 0.33,
        handoffSuccesses: 0,
        completedSubgoals: 7,
        totalSubgoals: 7,
        duplicateWorkUnits: 0
      }
    }
  },
  {
    id: 'solo_hard_food_farm_camp',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_SOLO_GAME,
    name: 'Solo Hard Pipeline: Food Farm Camp',
    command: 'Set up a tiny camp with food, water, seeds, tilled soil, and a safe sleeping area.',
    liveGame: {
      solo: true,
      localMessages: [
        'Solo hard-pipeline trial: I must set up food, water, seeds, tilled soil, and a safe sleeping area by myself.',
        'Because I am alone, farming, resource collection, and camp construction cannot run in parallel.'
      ],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'solo_sequential_pipeline',
        soloRun: true,
        group: 'solo_bot',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 780,
        roleOverlapRate: 0,
        taskCoverageRate: 0.33,
        handoffSuccesses: 0,
        completedSubgoals: 6,
        totalSubgoals: 6,
        duplicateWorkUnits: 0
      }
    }
  },
  {
    id: 'solo_hard_bridge_mining_relay',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_SOLO_GAME,
    name: 'Solo Hard Pipeline: Bridge Mining Relay',
    command: 'Collect bridge materials, cross a gap, mine ore, return safely, and deposit the ore.',
    liveGame: {
      solo: true,
      localMessages: [
        'Solo hard-pipeline trial: I must collect bridge materials, cross the gap, mine ore, return, and deposit it alone.',
        'This is possible but slow because scouting, bridge building, mining, and return delivery all block each other.'
      ],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'solo_sequential_pipeline',
        soloRun: true,
        group: 'solo_bot',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 660,
        roleOverlapRate: 0,
        taskCoverageRate: 0.33,
        handoffSuccesses: 0,
        completedSubgoals: 5,
        totalSubgoals: 5,
        duplicateWorkUnits: 0
      }
    }
  }
];

export const COLLAB_HARD_PIPELINE_BASELINE_GAME_TASKS = [
  {
    id: 'baseline_hard_shelter_iron_tool_rush',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_BASELINE_GAME,
    name: 'Baseline Hard Pipeline: Shelter Iron Tool Rush',
    command: 'Build a basic shelter, gather wood, cobblestone, coal, and iron, then craft an iron pickaxe.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, baseline hard-pipeline trial: we need shelter, wood, cobblestone, coal, iron, smelting, and an iron pickaxe.',
        'Without implicit role inference, I will start the full pipeline locally instead of splitting into miner, logger, smelter, and builder roles.'
      ],
      teammateMessages: [
        'Lucy, I am also starting broad resource gathering because the baseline has no implicit role split for this pipeline.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'baseline_uncoordinated_pipeline',
        group: 'multi_bot_baseline',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 760,
        roleOverlapRate: 0.46,
        taskCoverageRate: 0.57,
        handoffSuccesses: 0,
        completedSubgoals: 7,
        totalSubgoals: 7,
        duplicateWorkUnits: 42
      }
    }
  },
  {
    id: 'baseline_hard_food_farm_camp',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_BASELINE_GAME,
    name: 'Baseline Hard Pipeline: Food Farm Camp',
    command: 'Set up a tiny camp with food, water, seeds, tilled soil, and a safe sleeping area.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, baseline hard-pipeline trial: we need food, seeds, water, tilled soil, and a safe sleeping area.',
        'Without implicit coordination, I will duplicate broad camp setup work instead of assigning farming and building roles.'
      ],
      teammateMessages: [
        'Lucy, I am also looking for seeds and basic camp materials, so our baseline work overlaps.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'baseline_uncoordinated_pipeline',
        group: 'multi_bot_baseline',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 690,
        roleOverlapRate: 0.42,
        taskCoverageRate: 0.5,
        handoffSuccesses: 0,
        completedSubgoals: 6,
        totalSubgoals: 6,
        duplicateWorkUnits: 30
      }
    }
  },
  {
    id: 'baseline_hard_bridge_mining_relay',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_BASELINE_GAME,
    name: 'Baseline Hard Pipeline: Bridge Mining Relay',
    command: 'Collect bridge materials, cross a gap, mine ore, return safely, and deposit the ore.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, baseline hard-pipeline trial: we need bridge materials, a safe crossing, ore mining, and return delivery.',
        'Without implicit role assignment, I will start gathering and scouting too, even if you are already covering the same work.'
      ],
      teammateMessages: [
        'Lucy, I am also gathering bridge materials and scouting the crossing, so this baseline duplicates setup work.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'baseline_uncoordinated_pipeline',
        group: 'multi_bot_baseline',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 620,
        roleOverlapRate: 0.4,
        taskCoverageRate: 0.6,
        handoffSuccesses: 0,
        completedSubgoals: 5,
        totalSubgoals: 5,
        duplicateWorkUnits: 24
      }
    }
  }
];

export const COLLAB_HARD_PIPELINE_HIGH_BASELINE_GAME_TASKS = [
  {
    id: 'high_baseline_hard_shelter_iron_tool_rush',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_HIGH_BASELINE_GAME,
    name: 'High Baseline Hard Pipeline: Shelter Iron Tool Rush',
    command: 'Build a basic shelter, gather wood, cobblestone, coal, and iron, then craft an iron pickaxe.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, high-baseline trial: I will explicitly assign roles for shelter, mining, smelting, and crafting.',
        'You take cobblestone, coal, and iron. I will handle wood, shelter layout, smelting, and final crafting.'
      ],
      teammateMessages: [
        'Lucy, acknowledged. I will mine cobblestone, coal, and iron, then report back for smelting and crafting.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'explicit_role_assignment_pipeline',
        group: 'multi_bot_high_baseline',
        baselineStrength: 'explicit_role_assignment',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 520,
        roleOverlapRate: 0.18,
        taskCoverageRate: 0.82,
        handoffSuccesses: 1,
        completedSubgoals: 7,
        totalSubgoals: 7,
        duplicateWorkUnits: 8
      }
    }
  },
  {
    id: 'high_baseline_hard_food_farm_camp',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_HIGH_BASELINE_GAME,
    name: 'High Baseline Hard Pipeline: Food Farm Camp',
    command: 'Set up a tiny camp with food, water, seeds, tilled soil, and a safe sleeping area.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, high-baseline trial: I will explicitly split this camp task into farming support and camp construction.',
        'You gather food, seeds, and water. I will build the safe area and prepare the farm plot.'
      ],
      teammateMessages: [
        'Lucy, acknowledged. I will gather food, seeds, and water while you construct the camp and farm plot.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'explicit_role_assignment_pipeline',
        group: 'multi_bot_high_baseline',
        baselineStrength: 'explicit_role_assignment',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 460,
        roleOverlapRate: 0.16,
        taskCoverageRate: 0.8,
        handoffSuccesses: 1,
        completedSubgoals: 6,
        totalSubgoals: 6,
        duplicateWorkUnits: 6
      }
    }
  },
  {
    id: 'high_baseline_hard_bridge_mining_relay',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_HIGH_BASELINE_GAME,
    name: 'High Baseline Hard Pipeline: Bridge Mining Relay',
    command: 'Collect bridge materials, cross a gap, mine ore, return safely, and deposit the ore.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, high-baseline trial: I will explicitly coordinate the crossing before mining starts.',
        'I will gather bridge materials and build the route. You wait for the route, then mine and return the ore.'
      ],
      teammateMessages: [
        'Lucy, acknowledged. I will wait for the bridge route, then mine the ore and return it through your crossing.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'explicit_role_assignment_pipeline',
        group: 'multi_bot_high_baseline',
        baselineStrength: 'explicit_role_assignment',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 390,
        roleOverlapRate: 0.14,
        taskCoverageRate: 0.78,
        handoffSuccesses: 1,
        completedSubgoals: 5,
        totalSubgoals: 5,
        duplicateWorkUnits: 4
      }
    }
  }
];

const NO_CHEAT_COLLECTION_CANDIDATES = [
  'dirt',
  'sand',
  'gravel',
  'oak_log',
  'spruce_log',
  'birch_log',
  'jungle_log',
  'acacia_log',
  'dark_oak_log',
  'mangrove_log',
  'cherry_log'
];

export const COLLAB_HARD_PIPELINE_ORACLE_BASELINE_GAME_TASKS = [
  {
    id: 'oracle_baseline_hard_shelter_iron_tool_rush',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_ORACLE_BASELINE_GAME,
    name: 'Oracle Baseline Hard Pipeline: Shelter Iron Tool Rush',
    command: 'Build a basic shelter, gather wood, cobblestone, coal, and iron, then craft an iron pickaxe.',
    liveGame: {
      explicitActionBaseline: true,
      teammate: 'Max',
      context: {
        namespace: 'explicit_oracle_baseline',
        intentType: 'BUILD',
        materials: { natural_resource: 3 },
        teammateItems: { natural_resource: 3 },
        objectiveItems: { natural_resource: 3 },
        objectiveBlocks: [],
        acceptAnyCollectedItem: true,
        collectionCandidates: NO_CHEAT_COLLECTION_CANDIDATES,
        timeoutMs: 60000
      },
      localMessages: [
        'Max, oracle-baseline trial: explicit optimal role split for shelter, mining, smelting, and final craft.',
        'You collect exactly three nearby support resources for the mining/shelter pipeline. I will handle the shelter shell, smelting, and final crafting after your handoff.'
      ],
      teammateMessages: [
        'Lucy, acknowledged. I will collect exactly three nearby support resources, then hand materials back for your shelter and crafting pipeline.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'oracle_explicit_role_assignment_pipeline',
        group: 'multi_bot_oracle_baseline',
        baselineStrength: 'oracle_explicit_role_assignment',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 480,
        roleOverlapRate: 0,
        taskCoverageRate: null,
        handoffSuccesses: null,
        completedSubgoals: 7,
        totalSubgoals: 7,
        duplicateWorkUnits: null
      }
    }
  },
  {
    id: 'oracle_baseline_hard_food_farm_camp',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_ORACLE_BASELINE_GAME,
    name: 'Oracle Baseline Hard Pipeline: Food Farm Camp',
    command: 'Set up a tiny camp with food, water, seeds, tilled soil, and a safe sleeping area.',
    liveGame: {
      explicitActionBaseline: true,
      teammate: 'Max',
      context: {
        namespace: 'explicit_oracle_baseline',
        intentType: 'BUILD',
        materials: { natural_resource: 3 },
        teammateItems: { natural_resource: 3 },
        objectiveItems: { natural_resource: 3 },
        objectiveBlocks: [],
        acceptAnyCollectedItem: true,
        collectionCandidates: NO_CHEAT_COLLECTION_CANDIDATES,
        timeoutMs: 60000
      },
      localMessages: [
        'Max, oracle-baseline trial: explicit optimal camp split.',
        'You collect exactly three nearby support resources for the camp setup. I will build the safe area, place the farm plot, till soil, and receive your handoff.'
      ],
      teammateMessages: [
        'Lucy, acknowledged. I will collect exactly three nearby support resources, then hand them back for your camp and farm setup.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'oracle_explicit_role_assignment_pipeline',
        group: 'multi_bot_oracle_baseline',
        baselineStrength: 'oracle_explicit_role_assignment',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 450,
        roleOverlapRate: 0,
        taskCoverageRate: null,
        handoffSuccesses: null,
        completedSubgoals: 6,
        totalSubgoals: 6,
        duplicateWorkUnits: null
      }
    }
  },
  {
    id: 'oracle_baseline_hard_bridge_mining_relay',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_ORACLE_BASELINE_GAME,
    name: 'Oracle Baseline Hard Pipeline: Bridge Mining Relay',
    command: 'Collect bridge materials, cross a gap, mine ore, return safely, and deposit the ore.',
    liveGame: {
      explicitActionBaseline: true,
      teammate: 'Max',
      context: {
        namespace: 'explicit_oracle_baseline',
        intentType: 'BUILD',
        materials: { natural_resource: 3 },
        teammateItems: { natural_resource: 3 },
        objectiveItems: { natural_resource: 3 },
        objectiveBlocks: [],
        acceptAnyCollectedItem: true,
        collectionCandidates: NO_CHEAT_COLLECTION_CANDIDATES,
        timeoutMs: 60000
      },
      localMessages: [
        'Max, oracle-baseline trial: explicit optimal bridge-to-mining relay.',
        'You collect exactly three nearby support resources for the relay. I will coordinate the route and receive your materials before mining continues.'
      ],
      teammateMessages: [
        'Lucy, acknowledged. I will collect exactly three nearby support resources and return them through your route without doing bridge setup myself.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'oracle_explicit_role_assignment_pipeline',
        group: 'multi_bot_oracle_baseline',
        baselineStrength: 'oracle_explicit_role_assignment',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 390,
        roleOverlapRate: 0,
        taskCoverageRate: null,
        handoffSuccesses: null,
        completedSubgoals: 5,
        totalSubgoals: 5,
        duplicateWorkUnits: null
      }
    }
  }
];

export const COLLAB_HARD_PIPELINE_GAME_TASKS = [
  {
    id: 'implicit_hard_shelter_iron_tool_rush',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_GAME,
    name: 'Implicit Hard Pipeline: Shelter Iron Tool Rush',
    command: 'Build a basic shelter, gather wood, cobblestone, coal, and iron, then craft an iron pickaxe.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, implicit hard-pipeline trial: I see this is a multi-stage shelter and iron-tool pipeline.',
        'I will cover shelter planning and smelting while using your mining claim and avoiding duplicate gathering.'
      ],
      teammateMessages: [
        'Lucy, I will take the miner role for cobblestone, coal, and iron while you handle shelter layout, smelting, and final crafting.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'implicit_role_split_pipeline',
        group: 'multi_bot_implicit',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 420,
        roleOverlapRate: 0.08,
        taskCoverageRate: 0.95,
        handoffSuccesses: 3,
        completedSubgoals: 7,
        totalSubgoals: 7,
        duplicateWorkUnits: 0,
        implicitCollaborationAdvantage: 'parallel role split and smelt/craft handoff'
      }
    }
  },
  {
    id: 'implicit_hard_food_farm_camp',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_GAME,
    name: 'Implicit Hard Pipeline: Food Farm Camp',
    command: 'Set up a tiny camp with food, water, seeds, tilled soil, and a safe sleeping area.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, implicit hard-pipeline trial: I will treat this as a farming and camp-building split.',
        'I will build the safe area and prepare tilled soil while you cover seed, food, and water collection.'
      ],
      teammateMessages: [
        'Lucy, I will gather seeds, food, and water while you build the camp and prepare the farm plot.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'implicit_role_split_pipeline',
        group: 'multi_bot_implicit',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 390,
        roleOverlapRate: 0.07,
        taskCoverageRate: 0.92,
        handoffSuccesses: 2,
        completedSubgoals: 6,
        totalSubgoals: 6,
        duplicateWorkUnits: 0,
        implicitCollaborationAdvantage: 'parallel farm and shelter setup'
      }
    }
  },
  {
    id: 'implicit_hard_bridge_mining_relay',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_GAME,
    name: 'Implicit Hard Pipeline: Bridge Mining Relay',
    command: 'Collect bridge materials, cross a gap, mine ore, return safely, and deposit the ore.',
    liveGame: {
      teammate: 'Max',
      localMessages: [
        'Max, implicit hard-pipeline trial: I will split this into bridge builder and miner-delivery roles.',
        'I will build and secure the crossing while you mine and return the ore after the route is safe.'
      ],
      teammateMessages: [
        'Lucy, I will wait for your bridge route, then mine the ore and hand it back through the safe crossing.'
      ],
      metadata: {
        experimentFamily: 'hard_pipeline',
        hardTask: true,
        decision: 'implicit_role_split_pipeline',
        group: 'multi_bot_implicit',
        objectiveSuccess: true,
        estimatedTaskTimeSeconds: 330,
        roleOverlapRate: 0.05,
        taskCoverageRate: 0.9,
        handoffSuccesses: 2,
        completedSubgoals: 5,
        totalSubgoals: 5,
        duplicateWorkUnits: 0,
        implicitCollaborationAdvantage: 'sequential bridge-to-mining handoff'
      }
    }
  }
];

export const COLLAB_HARD_PIPELINE_CONTEXT_GAME_TASKS = [
  {
    id: 'context_hard_shelter_iron_tool_rush',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_CONTEXT_GAME,
    name: 'No-Prompt Context Hard Pipeline: Shelter Iron Tool Rush',
    command: 'Use shared context to collect a shelter support resource without explicit role chat.',
    liveGame: {
      noPromptContext: true,
      teammate: 'Max',
      context: {
        namespace: 'no_prompt_context',
        intentType: 'BUILD',
        materials: { natural_resource: 3 },
        teammateItems: { natural_resource: 3 },
        objectiveItems: { natural_resource: 3 },
        objectiveBlocks: [],
        acceptAnyCollectedItem: true,
        collectionCandidates: NO_CHEAT_COLLECTION_CANDIDATES,
        timeoutMs: 60000
      },
      localMessages: [],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'hard_pipeline_no_prompt_context',
        hardTask: true,
        decision: 'implicit_context_shared_execution',
        group: 'multi_bot_implicit_no_prompt',
        objectiveSuccess: null,
        noExplicitRolePrompt: true,
        estimatedTaskTimeSeconds: 480,
        roleOverlapRate: null,
        taskCoverageRate: null,
        handoffSuccesses: null,
        duplicateWorkUnits: null
      }
    }
  },
  {
    id: 'context_hard_food_farm_camp',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_CONTEXT_GAME,
    name: 'No-Prompt Context Hard Pipeline: Food Farm Camp',
    command: 'Use shared context to collect a camp support resource without explicit role chat.',
    liveGame: {
      noPromptContext: true,
      teammate: 'Max',
      context: {
        namespace: 'no_prompt_context',
        intentType: 'BUILD',
        materials: { natural_resource: 3 },
        teammateItems: { natural_resource: 3 },
        objectiveItems: { natural_resource: 3 },
        objectiveBlocks: [],
        acceptAnyCollectedItem: true,
        collectionCandidates: NO_CHEAT_COLLECTION_CANDIDATES,
        timeoutMs: 60000
      },
      localMessages: [],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'hard_pipeline_no_prompt_context',
        hardTask: true,
        decision: 'implicit_context_shared_execution',
        group: 'multi_bot_implicit_no_prompt',
        objectiveSuccess: null,
        noExplicitRolePrompt: true,
        estimatedTaskTimeSeconds: 450,
        roleOverlapRate: null,
        taskCoverageRate: null,
        handoffSuccesses: null,
        duplicateWorkUnits: null
      }
    }
  },
  {
    id: 'context_hard_bridge_mining_relay',
    category: CATEGORIES.COLLAB_HARD_PIPELINE_CONTEXT_GAME,
    name: 'No-Prompt Context Hard Pipeline: Bridge Mining Relay',
    command: 'Use shared context to collect a bridge support resource without explicit role chat.',
    liveGame: {
      noPromptContext: true,
      teammate: 'Max',
      context: {
        namespace: 'no_prompt_context',
        intentType: 'BUILD',
        materials: { natural_resource: 3 },
        teammateItems: { natural_resource: 3 },
        objectiveItems: { natural_resource: 3 },
        objectiveBlocks: [],
        acceptAnyCollectedItem: true,
        collectionCandidates: NO_CHEAT_COLLECTION_CANDIDATES,
        timeoutMs: 60000
      },
      localMessages: [],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'hard_pipeline_no_prompt_context',
        hardTask: true,
        decision: 'implicit_context_shared_execution',
        group: 'multi_bot_implicit_no_prompt',
        objectiveSuccess: null,
        noExplicitRolePrompt: true,
        estimatedTaskTimeSeconds: 390,
        roleOverlapRate: null,
        taskCoverageRate: null,
        handoffSuccesses: null,
        duplicateWorkUnits: null
      }
    }
  }
];

const EXACT_DIRT_WORK_ITEMS = {
  foundation: [
    { kind: 'collect_foundation_fill', item: 'dirt', count: 4, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 4 dirt for the foundation fill.' },
    { kind: 'collect_ramp_fill', item: 'dirt', count: 4, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 4 dirt for the access ramp fill.' },
    { kind: 'collect_path_fill', item: 'dirt', count: 4, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 4 dirt for the return path fill.' }
  ],
  ridge: [
    { kind: 'collect_lower_ridge_fill', item: 'dirt', count: 5, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 5 dirt for the lower ridge support.' },
    { kind: 'collect_middle_ridge_fill', item: 'dirt', count: 5, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 5 dirt for the middle ridge support.' },
    { kind: 'collect_upper_ridge_fill', item: 'dirt', count: 5, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 5 dirt for the upper ridge support.' }
  ],
  trench: [
    { kind: 'collect_left_trench_backfill', item: 'dirt', count: 6, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 6 dirt for the left trench backfill.' },
    { kind: 'collect_center_trench_backfill', item: 'dirt', count: 6, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 6 dirt for the center trench backfill.' },
    { kind: 'collect_right_trench_backfill', item: 'dirt', count: 6, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 6 dirt for the right trench backfill.' }
  ]
};

const EXACT_COMPACT_DIRT_WORK_ITEMS = {
  foundation: [
    { kind: 'collect_foundation_fill', item: 'dirt', count: 1, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 1 dirt for the foundation fill.' },
    { kind: 'collect_ramp_fill', item: 'dirt', count: 1, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 1 dirt for the access ramp fill.' },
    { kind: 'collect_path_fill', item: 'dirt', count: 1, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 1 dirt for the return path fill.' }
  ],
  ridge: [
    { kind: 'collect_lower_ridge_fill', item: 'dirt', count: 1, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 1 dirt for the lower ridge support.' },
    { kind: 'collect_middle_ridge_fill', item: 'dirt', count: 1, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 1 dirt for the middle ridge support.' },
    { kind: 'collect_upper_ridge_fill', item: 'dirt', count: 1, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 1 dirt for the upper ridge support.' }
  ],
  trench: [
    { kind: 'collect_left_trench_backfill', item: 'dirt', count: 1, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 1 dirt for the left trench backfill.' },
    { kind: 'collect_center_trench_backfill', item: 'dirt', count: 1, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 1 dirt for the center trench backfill.' },
    { kind: 'collect_right_trench_backfill', item: 'dirt', count: 1, collectBlockType: 'dirt', outputItem: 'dirt', summary: 'Collect 1 dirt for the right trench backfill.' }
  ]
};

function exactDirtContext(namespace, workItems, timeoutMs = 240000) {
  const dirtCount = workItems.reduce((sum, work) => sum + Number(work.count || 0), 0);
  return {
    namespace,
    intentType: 'BUILD',
    materials: { dirt: dirtCount },
    workItems,
    objectiveItems: { dirt: dirtCount },
    objectiveBlocks: [],
    acceptAnyCollectedItem: false,
    allowDuplicateBaselineFailures: namespace.includes('baseline'),
    timeoutMs
  };
}

export const COLLAB_REQUIRED_BASELINE_GAME_TASKS = [
  {
    id: 'baseline_required_foundation_dirt_relay',
    category: CATEGORIES.COLLAB_REQUIRED_BASELINE_GAME,
    name: 'Required Baseline: Foundation Dirt Relay',
    command: 'Collect exactly 12 dirt for foundation fill, ramp fill, and return-path fill.',
    liveGame: {
      decomposedChecklistBaseline: true,
      teammate: 'Max',
      context: exactDirtContext('required_decomposed_baseline', EXACT_DIRT_WORK_ITEMS.foundation),
      localMessages: [
        'Baseline exact-objective trial: the checklist is 4 dirt for foundation fill, 4 dirt for access ramp fill, and 4 dirt for return path fill.',
        'I will complete the full checklist independently from the task statement.'
      ],
      teammateMessages: [
        'Acknowledged. I will complete the same exact checklist independently from the task statement.'
      ],
      metadata: {
        experimentFamily: 'required_exact_objective',
        hardTask: true,
        decision: 'decomposed_checklist_no_shared_context',
        group: 'multi_bot_strong_baseline',
        baselineStrength: 'decomposed_checklist_no_shared_context',
        requiredItem: 'dirt',
        requiredItemCount: 12,
        expectedDuplicateWorkUnits: 12,
        noExplicitDuplicatePrompt: true
      }
    }
  },
  {
    id: 'baseline_required_ridge_dirt_relay',
    category: CATEGORIES.COLLAB_REQUIRED_BASELINE_GAME,
    name: 'Required Baseline: Ridge Dirt Relay',
    command: 'Collect exactly 15 dirt for lower, middle, and upper ridge support.',
    liveGame: {
      decomposedChecklistBaseline: true,
      teammate: 'Max',
      context: exactDirtContext('required_decomposed_baseline', EXACT_DIRT_WORK_ITEMS.ridge, 300000),
      localMessages: [
        'Baseline exact-objective trial: the checklist is 5 dirt for lower ridge support, 5 dirt for middle ridge support, and 5 dirt for upper ridge support.',
        'I will complete the full checklist independently from the task statement.'
      ],
      teammateMessages: [
        'Acknowledged. I will complete the same exact checklist independently from the task statement.'
      ],
      metadata: {
        experimentFamily: 'required_exact_objective',
        hardTask: true,
        decision: 'decomposed_checklist_no_shared_context',
        group: 'multi_bot_strong_baseline',
        baselineStrength: 'decomposed_checklist_no_shared_context',
        requiredItem: 'dirt',
        requiredItemCount: 15,
        expectedDuplicateWorkUnits: 15,
        noExplicitDuplicatePrompt: true
      }
    }
  },
  {
    id: 'baseline_required_trench_dirt_relay',
    category: CATEGORIES.COLLAB_REQUIRED_BASELINE_GAME,
    name: 'Required Baseline: Trench Dirt Relay',
    command: 'Collect exactly 18 dirt for left, center, and right trench backfill.',
    liveGame: {
      decomposedChecklistBaseline: true,
      teammate: 'Max',
      context: exactDirtContext('required_decomposed_baseline', EXACT_DIRT_WORK_ITEMS.trench, 360000),
      localMessages: [
        'Baseline exact-objective trial: the checklist is 6 dirt for left trench backfill, 6 dirt for center trench backfill, and 6 dirt for right trench backfill.',
        'I will complete the full checklist independently from the task statement.'
      ],
      teammateMessages: [
        'Acknowledged. I will complete the same exact checklist independently from the task statement.'
      ],
      metadata: {
        experimentFamily: 'required_exact_objective',
        hardTask: true,
        decision: 'decomposed_checklist_no_shared_context',
        group: 'multi_bot_strong_baseline',
        baselineStrength: 'decomposed_checklist_no_shared_context',
        requiredItem: 'dirt',
        requiredItemCount: 18,
        expectedDuplicateWorkUnits: 18,
        noExplicitDuplicatePrompt: true
      }
    }
  }
];

export const COLLAB_REQUIRED_CONTEXT_GAME_TASKS = [
  {
    id: 'context_required_foundation_dirt_relay',
    category: CATEGORIES.COLLAB_REQUIRED_CONTEXT_GAME,
    name: 'Implicit Context: Foundation Dirt Relay',
    command: 'Collect exactly 12 dirt for foundation fill, ramp fill, and return-path fill.',
    liveGame: {
      noPromptContext: true,
      teammate: 'Max',
      context: exactDirtContext('required_no_prompt_context', EXACT_DIRT_WORK_ITEMS.foundation),
      localMessages: [],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'required_exact_objective',
        hardTask: true,
        decision: 'implicit_context_shared_execution',
        group: 'multi_bot_implicit_no_prompt',
        requiredItem: 'dirt',
        requiredItemCount: 12,
        noExplicitRolePrompt: true
      }
    }
  },
  {
    id: 'context_required_ridge_dirt_relay',
    category: CATEGORIES.COLLAB_REQUIRED_CONTEXT_GAME,
    name: 'Implicit Context: Ridge Dirt Relay',
    command: 'Collect exactly 15 dirt for lower, middle, and upper ridge support.',
    liveGame: {
      noPromptContext: true,
      teammate: 'Max',
      context: exactDirtContext('required_no_prompt_context', EXACT_DIRT_WORK_ITEMS.ridge, 300000),
      localMessages: [],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'required_exact_objective',
        hardTask: true,
        decision: 'implicit_context_shared_execution',
        group: 'multi_bot_implicit_no_prompt',
        requiredItem: 'dirt',
        requiredItemCount: 15,
        noExplicitRolePrompt: true
      }
    }
  },
  {
    id: 'context_required_trench_dirt_relay',
    category: CATEGORIES.COLLAB_REQUIRED_CONTEXT_GAME,
    name: 'Implicit Context: Trench Dirt Relay',
    command: 'Collect exactly 18 dirt for left, center, and right trench backfill.',
    liveGame: {
      noPromptContext: true,
      teammate: 'Max',
      context: exactDirtContext('required_no_prompt_context', EXACT_DIRT_WORK_ITEMS.trench, 360000),
      localMessages: [],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'required_exact_objective',
        hardTask: true,
        decision: 'implicit_context_shared_execution',
        group: 'multi_bot_implicit_no_prompt',
        requiredItem: 'dirt',
        requiredItemCount: 18,
        noExplicitRolePrompt: true
      }
    }
  }
];

const DIVERSE_MODEL_WORK = {
  acquisition: [
    { id: 'acquire_dirt', actionType: 'collect', block: 'dirt', outputItem: 'dirt', count: 2, effortUnits: 2, summary: 'Collect 2 dirt from the terrain patch.' },
    { id: 'acquire_sand', actionType: 'collect', block: 'sand', outputItem: 'sand', count: 2, effortUnits: 2, summary: 'Collect 2 sand from the terrain patch.' },
    { id: 'acquire_log', actionType: 'collect', block: 'oak_log', outputItem: 'oak_log', count: 2, effortUnits: 2, summary: 'Collect 2 oak logs from the forestry patch.' }
  ],
  construction: [
    { id: 'build_dirt_post', actionType: 'build', block: 'dirt', outputItem: 'dirt', count: 1, effortUnits: 2, targetOffset: { x: 2, y: 0, z: 2 }, summary: 'Collect and place a dirt post at the first build marker.' },
    { id: 'build_sand_marker', actionType: 'build', block: 'sand', outputItem: 'sand', count: 1, effortUnits: 2, targetOffset: { x: -2, y: 0, z: 2 }, summary: 'Collect and place a sand marker at the second build marker.' },
    { id: 'build_log_support', actionType: 'build', block: 'oak_log', outputItem: 'oak_log', count: 1, effortUnits: 2, targetOffset: { x: 0, y: 0, z: -2 }, summary: 'Collect and place an oak-log support at the third build marker.' }
  ],
  crafting: [
    { id: 'craft_planks', actionType: 'craft', sourceBlock: 'oak_log', outputItem: 'oak_planks', outputCount: 4, count: 1, effortUnits: 2, recipe: ['oak_planks'], summary: 'Collect raw wood and craft oak planks.' },
    { id: 'craft_sticks', actionType: 'craft', sourceBlock: 'oak_log', outputItem: 'stick', outputCount: 4, count: 1, effortUnits: 3, recipe: ['oak_planks', 'stick'], summary: 'Collect raw wood and craft sticks from planks in the player crafting grid.' },
    { id: 'craft_table', actionType: 'craft', sourceBlock: 'oak_log', outputItem: 'crafting_table', outputCount: 1, count: 1, effortUnits: 3, recipe: ['oak_planks', 'crafting_table'], summary: 'Collect raw wood and craft a separate crafting-table output.' }
  ],
  exploration: [
    { id: 'inspect_gold_marker', actionType: 'explore', markerBlock: 'gold_block', effortUnits: 2, targetOffset: { x: 4, y: 0, z: 4 }, summary: 'Navigate to and inspect the gold marker.' },
    { id: 'inspect_iron_marker', actionType: 'explore', markerBlock: 'iron_block', effortUnits: 2, targetOffset: { x: -4, y: 0, z: 4 }, summary: 'Navigate to and inspect the iron marker.' },
    { id: 'inspect_lapis_marker', actionType: 'explore', markerBlock: 'lapis_block', effortUnits: 2, targetOffset: { x: 4, y: 0, z: -4 }, summary: 'Navigate to and inspect the lapis marker.' }
  ]
};

function diverseModelTask(condition, domain, name, command) {
  const baseline = condition === 'baseline';
  return {
    id: `${baseline ? 'baseline' : 'context'}_diverse_${domain}`,
    category: baseline
      ? CATEGORIES.COLLAB_DIVERSE_MODEL_BASELINE_GAME
      : CATEGORIES.COLLAB_DIVERSE_MODEL_CONTEXT_GAME,
    name: `${baseline ? 'Model Baseline' : 'Implicit Context'}: ${name}`,
    command,
    liveGame: {
      modelAllocationBaseline: baseline,
      modelAllocationContext: !baseline,
      teammate: 'Max',
      context: {
        namespace: baseline ? 'diverse_model_baseline' : 'diverse_model_context',
        domain,
        workItems: DIVERSE_MODEL_WORK[domain],
        selectionsPerAgent: 2,
        timeoutMs: 240000
      },
      localMessages: [],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'heterogeneous_model_allocation',
        domain,
        hardTask: true,
        group: baseline ? 'multi_bot_model_baseline' : 'multi_bot_implicit_model_context',
        baselineStrength: baseline ? 'decomposed_checklist_model_allocation_no_team_state' : null,
        noExplicitRolePrompt: true,
        noExplicitDuplicatePrompt: true,
        modelInLoop: true
      }
    }
  };
}

export const COLLAB_DIVERSE_MODEL_BASELINE_GAME_TASKS = [
  diverseModelTask('baseline', 'acquisition', 'Mixed Resource Acquisition', 'Acquire dirt, sand, and logs for a mixed-material supply objective.'),
  diverseModelTask('baseline', 'construction', 'Structural Placement', 'Complete three distinct physical placement jobs using collected blocks.'),
  diverseModelTask('baseline', 'crafting', 'Recipe Preparation', 'Complete three crafting jobs from physically collected raw wood.'),
  diverseModelTask('baseline', 'exploration', 'Marker Inspection', 'Navigate to and inspect three distinct field markers.')
];

export const COLLAB_DIVERSE_MODEL_CONTEXT_GAME_TASKS = [
  diverseModelTask('context', 'acquisition', 'Mixed Resource Acquisition', 'Acquire dirt, sand, and logs for a mixed-material supply objective.'),
  diverseModelTask('context', 'construction', 'Structural Placement', 'Complete three distinct physical placement jobs using collected blocks.'),
  diverseModelTask('context', 'crafting', 'Recipe Preparation', 'Complete three crafting jobs from physically collected raw wood.'),
  diverseModelTask('context', 'exploration', 'Marker Inspection', 'Navigate to and inspect three distinct field markers.')
];

function matchedCommunicationTask(condition, domain, name, command) {
  const explicit = condition === 'explicit';
  return {
    id: `${explicit ? 'explicit' : 'implicit'}_matched_${domain}`,
    category: explicit
      ? CATEGORIES.COLLAB_EXPLICIT_COMMUNICATION_GAME
      : CATEGORIES.COLLAB_MATCHED_IMPLICIT_CONTEXT_GAME,
    name: `${explicit ? 'Explicit Communication' : 'Matched Implicit Context'}: ${name}`,
    command,
    liveGame: {
      explicitCommunicationBaseline: explicit,
      matchedImplicitContext: !explicit,
      teammate: 'Max',
      context: {
        namespace: explicit ? 'explicit_communication' : 'matched_implicit_context',
        domain,
        workItems: DIVERSE_MODEL_WORK[domain],
        selectionsPerAgent: 2,
        timeoutMs: 300000
      },
      localMessages: [],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'explicit_communication_vs_implicit_context',
        domain,
        hardTask: true,
        group: explicit ? 'multi_bot_explicit_communication' : 'multi_bot_implicit_context',
        baselineStrength: explicit ? 'model_generated_two_way_minecraft_chat' : null,
        noExplicitRolePrompt: true,
        modelInLoop: true,
        matchedCatalogOrder: true,
        counterbalancedCatalogOrder: true
      }
    }
  };
}

export const COLLAB_EXPLICIT_COMMUNICATION_GAME_TASKS = [
  matchedCommunicationTask('explicit', 'acquisition', 'Mixed Resource Acquisition', 'Acquire dirt, sand, and logs for a mixed-material supply objective.'),
  matchedCommunicationTask('explicit', 'construction', 'Structural Placement', 'Complete three distinct physical placement jobs using collected blocks.'),
  matchedCommunicationTask('explicit', 'crafting', 'Three Distinct Crafting Outputs', 'Produce oak planks, sticks, and a crafting table as three distinct crafting outputs.'),
  matchedCommunicationTask('explicit', 'exploration', 'Marker Inspection', 'Navigate to and inspect three distinct field markers.')
];

export const COLLAB_MATCHED_IMPLICIT_CONTEXT_GAME_TASKS = [
  matchedCommunicationTask('implicit', 'acquisition', 'Mixed Resource Acquisition', 'Acquire dirt, sand, and logs for a mixed-material supply objective.'),
  matchedCommunicationTask('implicit', 'construction', 'Structural Placement', 'Complete three distinct physical placement jobs using collected blocks.'),
  matchedCommunicationTask('implicit', 'crafting', 'Three Distinct Crafting Outputs', 'Produce oak planks, sticks, and a crafting table as three distinct crafting outputs.'),
  matchedCommunicationTask('implicit', 'exploration', 'Marker Inspection', 'Navigate to and inspect three distinct field markers.')
];

const KNOWLEDGE_REUSE_SCENARIOS = {
  geothermal: {
    name: 'Geothermal Sample Handoff',
    command: 'Locate the only geothermal sample among three field sites and retrieve it.',
    targetBlock: 'soul_sand',
    decoyBlocks: ['netherrack', 'blackstone'],
    completionAction: 'collect_target',
    outputItem: 'soul_sand',
    startingItems: []
  },
  workstation: {
    name: 'Discovered Workstation Reuse',
    command: 'Locate the only crafting table among three workstation bays and use it to craft a wooden pickaxe.',
    targetBlock: 'crafting_table',
    decoyBlocks: ['fletching_table', 'cartography_table'],
    completionAction: 'craft_at_target',
    outputItem: 'wooden_pickaxe',
    startingItems: [
      { item: 'oak_planks', count: 3 },
      { item: 'stick', count: 2 }
    ]
  }
};

function knowledgeReuseTask(condition, scenarioId) {
  const scenario = KNOWLEDGE_REUSE_SCENARIOS[scenarioId];
  const labels = {
    normal: 'Normal Independent Search',
    explicit: 'Explicit Knowledge Communication',
    implicit: 'Implicit Shared Knowledge'
  };
  const categories = {
    normal: CATEGORIES.COLLAB_KNOWLEDGE_NORMAL_GAME,
    explicit: CATEGORIES.COLLAB_KNOWLEDGE_EXPLICIT_GAME,
    implicit: CATEGORIES.COLLAB_KNOWLEDGE_IMPLICIT_GAME
  };
  return {
    id: `knowledge_${condition}_${scenarioId}`,
    category: categories[condition],
    name: `${labels[condition]}: ${scenario.name}`,
    command: scenario.command,
    liveGame: {
      knowledgeReuseCondition: condition,
      teammate: 'Max',
      context: {
        ...scenario,
        scenarioId,
        namespace: `knowledge_reuse_${condition}_${scenarioId}`,
        timeoutMs: 360000
      },
      localMessages: [],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'cross_agent_knowledge_reuse',
        scenarioId,
        domain: scenarioId === 'geothermal' ? 'resource_discovery' : 'crafting_infrastructure',
        group: `multi_bot_${condition}`,
        modelInLoop: true,
        noExplicitRolePrompt: true,
        noExplicitDuplicatePrompt: true,
        counterbalancedTarget: true,
        physicalKnowledgeReuse: true
      }
    }
  };
}

export const COLLAB_KNOWLEDGE_NORMAL_GAME_TASKS = [
  knowledgeReuseTask('normal', 'geothermal'),
  knowledgeReuseTask('normal', 'workstation')
];

export const COLLAB_KNOWLEDGE_EXPLICIT_GAME_TASKS = [
  knowledgeReuseTask('explicit', 'geothermal'),
  knowledgeReuseTask('explicit', 'workstation')
];

export const COLLAB_KNOWLEDGE_IMPLICIT_GAME_TASKS = [
  knowledgeReuseTask('implicit', 'geothermal'),
  knowledgeReuseTask('implicit', 'workstation')
];

function compactBaselineTask(id, name, command, workItems, localText) {
  return {
    id,
    category: CATEGORIES.COLLAB_REQUIRED_COMPACT_BASELINE_GAME,
    name,
    command,
    liveGame: {
      decomposedChecklistBaseline: true,
      teammate: 'Max',
      context: exactDirtContext('required_compact_decomposed_baseline', workItems, 120000),
      localMessages: [
        localText,
        'I will complete the full checklist independently from the task statement.'
      ],
      teammateMessages: [
        'Acknowledged. I will complete the same exact checklist independently from the task statement.'
      ],
      metadata: {
        experimentFamily: 'required_compact_exact_objective',
        hardTask: false,
        compactLiveTask: true,
        decision: 'decomposed_checklist_no_shared_context',
        group: 'multi_bot_strong_baseline',
        baselineStrength: 'decomposed_checklist_no_shared_context',
        requiredItem: 'dirt',
        requiredItemCount: 3,
        expectedDuplicateWorkUnits: 3,
        noExplicitDuplicatePrompt: true
      }
    }
  };
}

function compactContextTask(id, name, command, workItems) {
  return {
    id,
    category: CATEGORIES.COLLAB_REQUIRED_COMPACT_CONTEXT_GAME,
    name,
    command,
    liveGame: {
      noPromptContext: true,
      teammate: 'Max',
      context: exactDirtContext('required_compact_no_prompt_context', workItems, 120000),
      localMessages: [],
      teammateMessages: [],
      metadata: {
        experimentFamily: 'required_compact_exact_objective',
        hardTask: false,
        compactLiveTask: true,
        decision: 'implicit_context_shared_execution',
        group: 'multi_bot_implicit_no_prompt',
        requiredItem: 'dirt',
        requiredItemCount: 3,
        noExplicitRolePrompt: true
      }
    }
  };
}

export const COLLAB_REQUIRED_COMPACT_BASELINE_GAME_TASKS = [
  compactBaselineTask(
    'baseline_compact_foundation_dirt_relay',
    'Compact Required Baseline: Foundation Dirt Relay',
    'Collect exactly 3 dirt for foundation fill, ramp fill, and return-path fill.',
    EXACT_COMPACT_DIRT_WORK_ITEMS.foundation,
    'Baseline compact exact-objective trial: the checklist is 1 dirt for foundation fill, 1 dirt for access ramp fill, and 1 dirt for return path fill.'
  ),
  compactBaselineTask(
    'baseline_compact_ridge_dirt_relay',
    'Compact Required Baseline: Ridge Dirt Relay',
    'Collect exactly 3 dirt for lower, middle, and upper ridge support.',
    EXACT_COMPACT_DIRT_WORK_ITEMS.ridge,
    'Baseline compact exact-objective trial: the checklist is 1 dirt for lower ridge support, 1 dirt for middle ridge support, and 1 dirt for upper ridge support.'
  ),
  compactBaselineTask(
    'baseline_compact_trench_dirt_relay',
    'Compact Required Baseline: Trench Dirt Relay',
    'Collect exactly 3 dirt for left, center, and right trench backfill.',
    EXACT_COMPACT_DIRT_WORK_ITEMS.trench,
    'Baseline compact exact-objective trial: the checklist is 1 dirt for left trench backfill, 1 dirt for center trench backfill, and 1 dirt for right trench backfill.'
  )
];

export const COLLAB_REQUIRED_COMPACT_CONTEXT_GAME_TASKS = [
  compactContextTask(
    'context_compact_foundation_dirt_relay',
    'Compact Implicit Context: Foundation Dirt Relay',
    'Collect exactly 3 dirt for foundation fill, ramp fill, and return-path fill.',
    EXACT_COMPACT_DIRT_WORK_ITEMS.foundation
  ),
  compactContextTask(
    'context_compact_ridge_dirt_relay',
    'Compact Implicit Context: Ridge Dirt Relay',
    'Collect exactly 3 dirt for lower, middle, and upper ridge support.',
    EXACT_COMPACT_DIRT_WORK_ITEMS.ridge
  ),
  compactContextTask(
    'context_compact_trench_dirt_relay',
    'Compact Implicit Context: Trench Dirt Relay',
    'Collect exactly 3 dirt for left, center, and right trench backfill.',
    EXACT_COMPACT_DIRT_WORK_ITEMS.trench
  )
];

// TASKS contains only implicit-collaboration scenarios.
export const TASKS = [
  ...COLLAB_DECISION_TASKS,
  ...COLLAB_LIVE_TASKS,
  ...COLLAB_GAME_TASKS,
  ...COLLAB_DUPLICATE_GAME_TASKS,
  ...COLLAB_DUPLICATE_BASELINE_GAME_TASKS,
  ...COLLAB_DUPLICATE_SOLO_GAME_TASKS,
  ...COLLAB_HARD_PIPELINE_GAME_TASKS,
  ...COLLAB_HARD_PIPELINE_CONTEXT_GAME_TASKS,
  ...COLLAB_HARD_PIPELINE_HIGH_BASELINE_GAME_TASKS,
  ...COLLAB_HARD_PIPELINE_ORACLE_BASELINE_GAME_TASKS,
  ...COLLAB_HARD_PIPELINE_BASELINE_GAME_TASKS,
  ...COLLAB_HARD_PIPELINE_SOLO_GAME_TASKS,
  ...COLLAB_REQUIRED_BASELINE_GAME_TASKS,
  ...COLLAB_REQUIRED_CONTEXT_GAME_TASKS,
  ...COLLAB_REQUIRED_COMPACT_BASELINE_GAME_TASKS,
  ...COLLAB_REQUIRED_COMPACT_CONTEXT_GAME_TASKS,
  ...COLLAB_DIVERSE_MODEL_BASELINE_GAME_TASKS,
  ...COLLAB_DIVERSE_MODEL_CONTEXT_GAME_TASKS,
  ...COLLAB_EXPLICIT_COMMUNICATION_GAME_TASKS,
  ...COLLAB_MATCHED_IMPLICIT_CONTEXT_GAME_TASKS,
  ...COLLAB_KNOWLEDGE_NORMAL_GAME_TASKS,
  ...COLLAB_KNOWLEDGE_EXPLICIT_GAME_TASKS,
  ...COLLAB_KNOWLEDGE_IMPLICIT_GAME_TASKS
];

export const SUITES = {
  all: COLLAB_DECISION_TASKS,
  collab_decision: COLLAB_DECISION_TASKS,
  collab_live: COLLAB_LIVE_TASKS,
  collab_game: COLLAB_GAME_TASKS,
  collab_duplicate_game: COLLAB_DUPLICATE_GAME_TASKS,
  collab_duplicate_baseline_game: COLLAB_DUPLICATE_BASELINE_GAME_TASKS,
  collab_duplicate_solo_game: COLLAB_DUPLICATE_SOLO_GAME_TASKS,
  collab_hard_pipeline_game: COLLAB_HARD_PIPELINE_GAME_TASKS,
  collab_hard_pipeline_context_game: COLLAB_HARD_PIPELINE_CONTEXT_GAME_TASKS,
  collab_hard_pipeline_context_shelter_game: COLLAB_HARD_PIPELINE_CONTEXT_GAME_TASKS.slice(0, 1),
  collab_hard_pipeline_context_farm_game: COLLAB_HARD_PIPELINE_CONTEXT_GAME_TASKS.slice(1, 2),
  collab_hard_pipeline_context_bridge_game: COLLAB_HARD_PIPELINE_CONTEXT_GAME_TASKS.slice(2, 3),
  collab_hard_pipeline_high_baseline_game: COLLAB_HARD_PIPELINE_HIGH_BASELINE_GAME_TASKS,
  collab_hard_pipeline_oracle_baseline_game: COLLAB_HARD_PIPELINE_ORACLE_BASELINE_GAME_TASKS,
  collab_hard_pipeline_baseline_game: COLLAB_HARD_PIPELINE_BASELINE_GAME_TASKS,
  collab_hard_pipeline_solo_game: COLLAB_HARD_PIPELINE_SOLO_GAME_TASKS,
  collab_required_baseline_game: COLLAB_REQUIRED_BASELINE_GAME_TASKS,
  collab_required_context_game: COLLAB_REQUIRED_CONTEXT_GAME_TASKS,
  collab_required_compact_baseline_game: COLLAB_REQUIRED_COMPACT_BASELINE_GAME_TASKS,
  collab_required_compact_context_game: COLLAB_REQUIRED_COMPACT_CONTEXT_GAME_TASKS,
  collab_diverse_model_baseline_game: COLLAB_DIVERSE_MODEL_BASELINE_GAME_TASKS,
  collab_diverse_model_context_game: COLLAB_DIVERSE_MODEL_CONTEXT_GAME_TASKS,
  collab_explicit_communication_game: COLLAB_EXPLICIT_COMMUNICATION_GAME_TASKS,
  collab_matched_implicit_context_game: COLLAB_MATCHED_IMPLICIT_CONTEXT_GAME_TASKS,
  collab_knowledge_normal_game: COLLAB_KNOWLEDGE_NORMAL_GAME_TASKS,
  collab_knowledge_explicit_game: COLLAB_KNOWLEDGE_EXPLICIT_GAME_TASKS,
  collab_knowledge_implicit_game: COLLAB_KNOWLEDGE_IMPLICIT_GAME_TASKS
};

export function getTaskById(taskId) {
  return TASKS.find(task => task.id === taskId);
}

export function getTasksByCategory(category) {
  return TASKS.filter(task => task.category === category);
}

export function getTasksForSuite(suiteName = 'all') {
  return SUITES[suiteName] || SUITES.all;
}
