-- Tìm kiếm tiếng Việt không dấu: gõ "tong tai" vẫn ra "Tổng tài".
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent() không IMMUTABLE nên không dùng trực tiếp trong index được → bọc lại.
CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

CREATE INDEX IF NOT EXISTS "Video_title_search_idx"
  ON "Video" USING gin (f_unaccent(lower("title")) gin_trgm_ops);
