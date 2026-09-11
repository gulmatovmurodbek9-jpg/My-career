-- Сутуни «охирин фаъолият» барои омори панели админ.
-- Дар production synchronize хомӯш аст, барои ҳамин дастӣ.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lastSeenAt" timestamptz;

-- Ҷустуҷӯи «кӣ ҳозир дар сайт аст» ҳамеша бо ҳамин сутун филтр мешавад.
CREATE INDEX IF NOT EXISTS "idx_user_last_seen" ON "user" ("lastSeenAt");
