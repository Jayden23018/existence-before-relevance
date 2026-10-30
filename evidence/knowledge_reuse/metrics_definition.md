# Metric and Success Definitions

- **Allocation trial success:** all three unique required physical work units complete successfully. Explicit allocation also requires two model-generated messages observed by the receiving bot.
- **Geothermal trial success:** Lucy discovers the target site, Max reaches it, Max physically collects soul sand, and Max's soul-sand inventory increases. Explicit communication must also be valid.
- **Workstation trial success:** Lucy discovers the target site, Max reaches the verified crafting table, Max physically crafts a wooden pickaxe, and Max's pickaxe inventory increases. Explicit communication must also be valid.
- **Family pass:** at least three successes in five trials for a fixed model, condition, and scenario.
- **Enhancer evidence rule:** the implicit family must pass without reducing pooled objective success and must improve at least one defined coordination endpoint. A model-call claim uses a 40% reduction threshold.
- **Implicit mechanism audit:** a structured fact must be recorded and consumed in every retained implicit knowledge-reuse trial.
- **Allocation coverage:** unique successfully completed required work IDs divided by three.
- **Allocation duplicate work:** repeated successfully executed effort after the first completion of a required work unit.
- **Allocation overlap:** duplicate completed effort divided by total completed effort.
- **Knowledge-reuse coverage:** one when the required consumer objective is verified, zero otherwise. It is not combined with other metrics.
- **Post-discovery duration:** wall-clock time from Lucy's target discovery through Max's objective verification. It includes condition-specific model and communication latency.
- **Excess site visits:** max(0, consumer-inspected sites minus one). Zero is direct reuse.
- **Model calls:** every recorded condition-specific model invocation. Explicit uses report generation plus follower interpretation; normal and implicit use one selection call.
- **Explicit chat:** only model-generated, observed Lucy-to-Max and Max-to-Lucy Minecraft messages. Setup commands are excluded.
- **Paired comparison:** same model, scenario, attempt, and counterbalanced target across all three conditions.
- **Exact sign test:** two-sided binomial test over non-tied paired post-discovery differences.
- **Bootstrap interval:** deterministic 20,000-resample percentile 95% interval for the mean paired difference.
- **Validity controls:** reset, survival, health, hunger, terrain isolation, prompt neutrality, and no-work-teleportation checks determine whether a trial is valid evidence; they are not efficiency scores.
