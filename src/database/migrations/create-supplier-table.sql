-- ----------------------------
-- Sequence structure for supplier_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."supplier_id_seq";
CREATE SEQUENCE "public"."supplier_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Table structure for supplier
-- ----------------------------
DROP TABLE IF EXISTS "public"."supplier";
CREATE TABLE "public"."supplier" (
  "id" int4 NOT NULL DEFAULT nextval('supplier_id_seq'::regclass),
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "contact_person" varchar(255) COLLATE "pg_catalog"."default",
  "phone" varchar(50) COLLATE "pg_catalog"."default",
  "email" varchar(255) COLLATE "pg_catalog"."default",
  "address" text COLLATE "pg_catalog"."default",
  "is_active" bool DEFAULT true,
  "create_date" timestamp(6),
  "create_by" varchar(255) COLLATE "pg_catalog"."default",
  "update_date" timestamp(6),
  "update_by" varchar(255) COLLATE "pg_catalog"."default"
);

-- ----------------------------
-- Indexes structure for table supplier
-- ----------------------------
CREATE UNIQUE INDEX "uq_supplier_code" ON "public"."supplier" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

CREATE INDEX "idx_supplier_active" ON "public"."supplier" USING btree (
  "is_active" "pg_catalog"."bool_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table supplier
-- ----------------------------
ALTER TABLE "public"."supplier" ADD CONSTRAINT "supplier_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."supplier_id_seq"
OWNED BY "public"."supplier"."id";
SELECT setval('"public"."supplier_id_seq"', 1, false);

-- ----------------------------
-- Foreign Keys structure for table materials
-- Add supplier_id foreign key constraint
-- ----------------------------
ALTER TABLE "public"."materials" 
ADD CONSTRAINT "fk_materials_supplier" 
FOREIGN KEY ("supplier_id") 
REFERENCES "public"."supplier" ("id") 
ON DELETE SET NULL 
ON UPDATE NO ACTION;
