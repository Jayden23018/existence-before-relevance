# Metric Definitions

No composite score is used.

## Objective success

A trial succeeds only when all three distinct work IDs have successful physical predicates. Collection requires the inventory increase, construction requires the specified block at the exact target coordinate, crafting requires the recipe output inventory increase, and exploration requires reaching and observing the specified marker.

## Coverage

Coverage is the number of distinct successfully completed work IDs divided by three. The denominator and work catalog are identical in the baseline and implicit-context conditions.

## Duplicate effort and overlap

Each work ID has a prespecified effort weight. Duplicate effort is the sum of weights for successful executions of an already completed work ID. Overlap is duplicate effort divided by the total effort of all successful physical executions in that trial. A trial with no repeated successful work has overlap zero.

## Physical action counts

Attempted physical actions count model-selected work IDs sent to the Minecraft executor. Completed physical actions count only attempts that pass their Minecraft predicates. The independent baseline requests two choices from each agent (four attempted actions per trial); the implicit condition requests two from the first agent and then exposes their completed statuses to the second agent, which selects from the remaining planned work (three attempted actions per trial). The resulting 80-to-60 attempted-action comparison per model is a direct protocol trace, not a wall-clock-time claim. Completed counts can be lower when a physical predicate fails.

## Family pass rule

Each domain contains five live Minecraft trials. A domain passes when at least three trials succeed, matching the prespecified in-game rule.

## Timing

Wall-clock duration is logged but is not an efficiency endpoint. Baseline model decisions are concurrent whereas implicit-context decisions are sequential so that the second decision can consume the first completion state.
