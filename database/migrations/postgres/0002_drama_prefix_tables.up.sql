-- drama ownership prefix migration.
--
-- Section 1 and section 6.1 require every physical table in the shared schema to
-- carry an ownership-specific prefix declared consistently by
-- database.manifest.json#tablePrefix, contract/schema.yaml#table_prefix, and
-- contract/prefix-registry.json. The first core migration created unprefixed
-- objects, so this reviewed forward migration renames them into the owned
-- `drama_` family instead of rewriting the tracked 0001 migration (section 7.3
-- keeps applied migration content checksum-immutable).
--
-- RENAME preserves rows, indexes, and dependent constraints; the
-- media_assets -> episodes foreign key follows the renamed parent automatically.
-- Indexes are renamed explicitly because a table rename leaves index names
-- unchanged.

ALTER TABLE IF EXISTS episodes RENAME TO drama_episodes;
ALTER TABLE IF EXISTS media_assets RENAME TO drama_media_assets;

ALTER INDEX IF EXISTS episodes_tenant_id_id_idx RENAME TO drama_episodes_tenant_id_id_idx;
ALTER INDEX IF EXISTS episodes_tenant_status_idx RENAME TO drama_episodes_tenant_status_idx;
ALTER INDEX IF EXISTS media_assets_tenant_episode_idx RENAME TO drama_media_assets_tenant_episode_idx;
