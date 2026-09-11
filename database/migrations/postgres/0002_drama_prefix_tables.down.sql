-- Reverse of 0002_drama_prefix_tables.up.sql.
--
-- The rename is fully reversible and lossless: it restores the names created by
-- 0001_drama_core.up.sql. This file documents the reversal and is not executed
-- automatically; section 7.4 forbids automated reverse-order .down.sql rollout.

ALTER INDEX IF EXISTS drama_episodes_tenant_id_id_idx RENAME TO episodes_tenant_id_id_idx;
ALTER INDEX IF EXISTS drama_episodes_tenant_status_idx RENAME TO episodes_tenant_status_idx;
ALTER INDEX IF EXISTS drama_media_assets_tenant_episode_idx RENAME TO media_assets_tenant_episode_idx;

ALTER TABLE IF EXISTS drama_media_assets RENAME TO media_assets;
ALTER TABLE IF EXISTS drama_episodes RENAME TO episodes;
