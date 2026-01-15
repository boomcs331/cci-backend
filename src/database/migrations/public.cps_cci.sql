/*
 Navicat Premium Data Transfer

 Source Server         : PostgresLocal
 Source Server Type    : PostgreSQL
 Source Server Version : 170004 (170004)
 Source Host           : localhost:5432
 Source Catalog        : cps_cci
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170004 (170004)
 File Encoding         : 65001

 Date: 15/01/2026 20:24:18
*/


-- ----------------------------
-- Sequence structure for items_name_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."items_name_id_seq";
CREATE SEQUENCE "public"."items_name_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for materials_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."materials_id_seq";
CREATE SEQUENCE "public"."materials_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for materials_location_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."materials_location_id_seq";
CREATE SEQUENCE "public"."materials_location_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for materials_type_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."materials_type_id_seq";
CREATE SEQUENCE "public"."materials_type_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 2147483647
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for permissions_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."permissions_id_seq";
CREATE SEQUENCE "public"."permissions_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for roles_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."roles_id_seq";
CREATE SEQUENCE "public"."roles_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Sequence structure for users_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."users_id_seq";
CREATE SEQUENCE "public"."users_id_seq" 
INCREMENT 1
MINVALUE  1
MAXVALUE 9223372036854775807
START 1
CACHE 1;

-- ----------------------------
-- Table structure for api_logs
-- ----------------------------
DROP TABLE IF EXISTS "public"."api_logs";
CREATE TABLE "public"."api_logs" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "timestamp" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "request_id" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "method" varchar(10) COLLATE "pg_catalog"."default" NOT NULL,
  "url" varchar(500) COLLATE "pg_catalog"."default" NOT NULL,
  "status_code" int4 NOT NULL,
  "duration" int4 NOT NULL,
  "client_ip" varchar(45) COLLATE "pg_catalog"."default" NOT NULL,
  "user_agent" varchar(500) COLLATE "pg_catalog"."default",
  "request_size" int4 DEFAULT 0,
  "response_size" int4 DEFAULT 0,
  "query" jsonb,
  "params" jsonb,
  "body" jsonb,
  "headers" jsonb,
  "response" jsonb,
  "error" text COLLATE "pg_catalog"."default",
  "is_error" bool DEFAULT false,
  "is_slow" bool DEFAULT false
)
;

-- ----------------------------
-- Table structure for auth_logs
-- ----------------------------
DROP TABLE IF EXISTS "public"."auth_logs";
CREATE TABLE "public"."auth_logs" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "timestamp" timestamptz(6) DEFAULT CURRENT_TIMESTAMP,
  "action" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "username" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(255) COLLATE "pg_catalog"."default",
  "user_id" varchar(50) COLLATE "pg_catalog"."default",
  "client_ip" varchar(45) COLLATE "pg_catalog"."default" NOT NULL,
  "user_agent" varchar(500) COLLATE "pg_catalog"."default",
  "duration" int4 DEFAULT 0,
  "error_message" text COLLATE "pg_catalog"."default",
  "roles" jsonb,
  "permission_count" int4,
  "is_success" bool DEFAULT false,
  "metadata" jsonb
)
;

-- ----------------------------
-- Table structure for items_name
-- ----------------------------
DROP TABLE IF EXISTS "public"."items_name";
CREATE TABLE "public"."items_name" (
  "id" int4 NOT NULL DEFAULT nextval('items_name_id_seq'::regclass),
  "material_id" int4 NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "active" bool DEFAULT true,
  "create_date" timestamp(6),
  "update_date" timestamp(6),
  "create_by" varchar(255) COLLATE "pg_catalog"."default",
  "update_by" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for materials
-- ----------------------------
DROP TABLE IF EXISTS "public"."materials";
CREATE TABLE "public"."materials" (
  "id" int4 NOT NULL DEFAULT nextval('materials_id_seq'::regclass),
  "mat_code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "mat_type_id" int4 NOT NULL,
  "default_location_id" int4 NOT NULL,
  "lr" varchar(2) COLLATE "pg_catalog"."default",
  "lot_size" int4,
  "unit" varchar(50) COLLATE "pg_catalog"."default",
  "is_active" bool DEFAULT true,
  "create_date" timestamp(6),
  "create_by" varchar(255) COLLATE "pg_catalog"."default",
  "update_date" timestamp(6),
  "update_by" varchar(255) COLLATE "pg_catalog"."default",
  "min_stock" int2,
  "supplier_id" int4
)
;

-- ----------------------------
-- Table structure for materials_location
-- ----------------------------
DROP TABLE IF EXISTS "public"."materials_location";
CREATE TABLE "public"."materials_location" (
  "id" int4 NOT NULL DEFAULT nextval('materials_location_id_seq'::regclass),
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default",
  "description" text COLLATE "pg_catalog"."default",
  "create_date" timestamp(6),
  "create_by" varchar(255) COLLATE "pg_catalog"."default",
  "update_date" timestamp(6),
  "update_by" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for materials_stock
-- ----------------------------
DROP TABLE IF EXISTS "public"."materials_stock";
CREATE TABLE "public"."materials_stock" (
  "material_id" int4 NOT NULL,
  "total_qty" int4 DEFAULT 0,
  "available_qty" int4 DEFAULT 0,
  "reserved_qty" int4 DEFAULT 0,
  "update_date" timestamp(6)
)
;

-- ----------------------------
-- Table structure for materials_type
-- ----------------------------
DROP TABLE IF EXISTS "public"."materials_type";
CREATE TABLE "public"."materials_type" (
  "id" int4 NOT NULL DEFAULT nextval('materials_type_id_seq'::regclass),
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "create_date" timestamp(6),
  "create_by" varchar(255) COLLATE "pg_catalog"."default",
  "update_date" timestamp(6),
  "update_by" varchar(255) COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for permissions
-- ----------------------------
DROP TABLE IF EXISTS "public"."permissions";
CREATE TABLE "public"."permissions" (
  "id" int8 NOT NULL DEFAULT nextval('permissions_id_seq'::regclass),
  "code" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(150) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "module" varchar(100) COLLATE "pg_catalog"."default",
  "created_at" timestamp(6) NOT NULL DEFAULT now(),
  "updated_at" timestamp(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for role_permissions
-- ----------------------------
DROP TABLE IF EXISTS "public"."role_permissions";
CREATE TABLE "public"."role_permissions" (
  "role_id" int8 NOT NULL,
  "permission_id" int8 NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for roles
-- ----------------------------
DROP TABLE IF EXISTS "public"."roles";
CREATE TABLE "public"."roles" (
  "id" int8 NOT NULL DEFAULT nextval('roles_id_seq'::regclass),
  "code" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "name" varchar(100) COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "is_system" bool NOT NULL DEFAULT false,
  "created_at" timestamp(6) NOT NULL DEFAULT now(),
  "updated_at" timestamp(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for user_roles
-- ----------------------------
DROP TABLE IF EXISTS "public"."user_roles";
CREATE TABLE "public"."user_roles" (
  "user_id" int8 NOT NULL,
  "role_id" int8 NOT NULL,
  "created_at" timestamp(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "id" int8 NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  "username" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "password_hash" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "first_name" varchar(100) COLLATE "pg_catalog"."default",
  "last_name" varchar(100) COLLATE "pg_catalog"."default",
  "is_active" bool NOT NULL DEFAULT true,
  "last_login_at" timestamp(6),
  "created_at" timestamp(6) NOT NULL DEFAULT now(),
  "updated_at" timestamp(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Function structure for cleanup_old_logs
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."cleanup_old_logs"("days_to_keep" int4);
CREATE OR REPLACE FUNCTION "public"."cleanup_old_logs"("days_to_keep" int4=90)
  RETURNS "pg_catalog"."int4" AS $BODY$
DECLARE
    cutoff_date TIMESTAMP;
    api_deleted_count INTEGER;
    auth_deleted_count INTEGER;
    total_deleted_count INTEGER;
BEGIN
    cutoff_date := CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    -- Delete old API logs
    DELETE FROM api_logs WHERE timestamp < cutoff_date;
    GET DIAGNOSTICS api_deleted_count = ROW_COUNT;
    
    -- Delete old auth logs
    DELETE FROM auth_logs WHERE timestamp < cutoff_date;
    GET DIAGNOSTICS auth_deleted_count = ROW_COUNT;
    
    total_deleted_count := api_deleted_count + auth_deleted_count;
    
    RETURN total_deleted_count;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function structure for get_log_statistics
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."get_log_statistics"("time_window_minutes" int4);
CREATE OR REPLACE FUNCTION "public"."get_log_statistics"("time_window_minutes" int4=60)
  RETURNS TABLE("total_requests" int8, "successful_requests" int8, "client_errors" int8, "server_errors" int8, "avg_response_time" numeric, "total_login_attempts" int8, "successful_logins" int8, "failed_logins" int8) AS $BODY$
DECLARE
    cutoff_time TIMESTAMP;
BEGIN
    cutoff_time := CURRENT_TIMESTAMP - INTERVAL '1 minute' * time_window_minutes;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM api_logs WHERE timestamp > cutoff_time),
        (SELECT COUNT(*) FROM api_logs WHERE timestamp > cutoff_time AND status_code BETWEEN 200 AND 399),
        (SELECT COUNT(*) FROM api_logs WHERE timestamp > cutoff_time AND status_code BETWEEN 400 AND 499),
        (SELECT COUNT(*) FROM api_logs WHERE timestamp > cutoff_time AND status_code BETWEEN 500 AND 599),
        (SELECT AVG(duration) FROM api_logs WHERE timestamp > cutoff_time),
        (SELECT COUNT(*) FROM auth_logs WHERE timestamp > cutoff_time AND action = 'LOGIN_ATTEMPT'),
        (SELECT COUNT(*) FROM auth_logs WHERE timestamp > cutoff_time AND action = 'LOGIN_SUCCESS'),
        (SELECT COUNT(*) FROM auth_logs WHERE timestamp > cutoff_time AND action = 'LOGIN_FAILED');
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
  ROWS 1000;

-- ----------------------------
-- Function structure for uuid_generate_v1
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_generate_v1"();
CREATE OR REPLACE FUNCTION "public"."uuid_generate_v1"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v1'
  LANGUAGE c VOLATILE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_generate_v1mc
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_generate_v1mc"();
CREATE OR REPLACE FUNCTION "public"."uuid_generate_v1mc"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v1mc'
  LANGUAGE c VOLATILE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_generate_v3
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_generate_v3"("namespace" uuid, "name" text);
CREATE OR REPLACE FUNCTION "public"."uuid_generate_v3"("namespace" uuid, "name" text)
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v3'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_generate_v4
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_generate_v4"();
CREATE OR REPLACE FUNCTION "public"."uuid_generate_v4"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v4'
  LANGUAGE c VOLATILE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_generate_v5
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_generate_v5"("namespace" uuid, "name" text);
CREATE OR REPLACE FUNCTION "public"."uuid_generate_v5"("namespace" uuid, "name" text)
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_generate_v5'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_nil
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_nil"();
CREATE OR REPLACE FUNCTION "public"."uuid_nil"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_nil'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_ns_dns
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_ns_dns"();
CREATE OR REPLACE FUNCTION "public"."uuid_ns_dns"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_dns'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_ns_oid
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_ns_oid"();
CREATE OR REPLACE FUNCTION "public"."uuid_ns_oid"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_oid'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_ns_url
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_ns_url"();
CREATE OR REPLACE FUNCTION "public"."uuid_ns_url"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_url'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- Function structure for uuid_ns_x500
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."uuid_ns_x500"();
CREATE OR REPLACE FUNCTION "public"."uuid_ns_x500"()
  RETURNS "pg_catalog"."uuid" AS '$libdir/uuid-ossp', 'uuid_ns_x500'
  LANGUAGE c IMMUTABLE STRICT
  COST 1;

-- ----------------------------
-- View structure for recent_errors
-- ----------------------------
DROP VIEW IF EXISTS "public"."recent_errors";
CREATE VIEW "public"."recent_errors" AS  SELECT "timestamp",
    method,
    url,
    status_code,
    duration,
    client_ip,
    error
   FROM api_logs
  WHERE is_error = true
  ORDER BY "timestamp" DESC
 LIMIT 100;

-- ----------------------------
-- View structure for slow_requests
-- ----------------------------
DROP VIEW IF EXISTS "public"."slow_requests";
CREATE VIEW "public"."slow_requests" AS  SELECT "timestamp",
    method,
    url,
    duration,
    client_ip,
    request_id
   FROM api_logs
  WHERE is_slow = true
  ORDER BY duration DESC
 LIMIT 100;

-- ----------------------------
-- View structure for failed_logins
-- ----------------------------
DROP VIEW IF EXISTS "public"."failed_logins";
CREATE VIEW "public"."failed_logins" AS  SELECT "timestamp",
    username,
    client_ip,
    user_agent,
    error_message,
    duration
   FROM auth_logs
  WHERE action::text = 'LOGIN_FAILED'::text
  ORDER BY "timestamp" DESC
 LIMIT 100;

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."items_name_id_seq"
OWNED BY "public"."items_name"."id";
SELECT setval('"public"."items_name_id_seq"', 21, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."materials_id_seq"
OWNED BY "public"."materials"."id";
SELECT setval('"public"."materials_id_seq"', 21, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."materials_location_id_seq"
OWNED BY "public"."materials_location"."id";
SELECT setval('"public"."materials_location_id_seq"', 10, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."materials_type_id_seq"
OWNED BY "public"."materials_type"."id";
SELECT setval('"public"."materials_type_id_seq"', 10, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."permissions_id_seq"
OWNED BY "public"."permissions"."id";
SELECT setval('"public"."permissions_id_seq"', 17, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."roles_id_seq"
OWNED BY "public"."roles"."id";
SELECT setval('"public"."roles_id_seq"', 9, true);

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE "public"."users_id_seq"
OWNED BY "public"."users"."id";
SELECT setval('"public"."users_id_seq"', 16, true);

-- ----------------------------
-- Indexes structure for table api_logs
-- ----------------------------
CREATE INDEX "idx_api_logs_client_ip" ON "public"."api_logs" USING btree (
  "client_ip" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_logs_is_error" ON "public"."api_logs" USING btree (
  "is_error" "pg_catalog"."bool_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_logs_is_slow" ON "public"."api_logs" USING btree (
  "is_slow" "pg_catalog"."bool_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_logs_method_url" ON "public"."api_logs" USING btree (
  "method" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "url" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_logs_request_id" ON "public"."api_logs" USING btree (
  "request_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_logs_status_code" ON "public"."api_logs" USING btree (
  "status_code" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_api_logs_timestamp" ON "public"."api_logs" USING btree (
  "timestamp" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table api_logs
-- ----------------------------
ALTER TABLE "public"."api_logs" ADD CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table auth_logs
-- ----------------------------
CREATE INDEX "idx_auth_logs_action" ON "public"."auth_logs" USING btree (
  "action" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_auth_logs_client_ip" ON "public"."auth_logs" USING btree (
  "client_ip" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_auth_logs_is_success" ON "public"."auth_logs" USING btree (
  "is_success" "pg_catalog"."bool_ops" ASC NULLS LAST
);
CREATE INDEX "idx_auth_logs_timestamp" ON "public"."auth_logs" USING btree (
  "timestamp" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE INDEX "idx_auth_logs_username" ON "public"."auth_logs" USING btree (
  "username" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Checks structure for table auth_logs
-- ----------------------------
ALTER TABLE "public"."auth_logs" ADD CONSTRAINT "auth_logs_action_check" CHECK (action::text = ANY (ARRAY['LOGIN_ATTEMPT'::character varying, 'LOGIN_SUCCESS'::character varying, 'LOGIN_FAILED'::character varying, 'REGISTRATION_ATTEMPT'::character varying, 'REGISTRATION_SUCCESS'::character varying, 'REGISTRATION_FAILED'::character varying, 'LOGOUT'::character varying, 'PASSWORD_CHANGE'::character varying, 'PASSWORD_RESET'::character varying]::text[]));

-- ----------------------------
-- Primary Key structure for table auth_logs
-- ----------------------------
ALTER TABLE "public"."auth_logs" ADD CONSTRAINT "auth_logs_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table items_name
-- ----------------------------
CREATE INDEX "idx_items_material" ON "public"."items_name" USING btree (
  "material_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_items_name_material" ON "public"."items_name" USING btree (
  "material_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_items_name_name" ON "public"."items_name" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table items_name
-- ----------------------------
ALTER TABLE "public"."items_name" ADD CONSTRAINT "items_name_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table materials
-- ----------------------------
CREATE INDEX "idx_materials_active" ON "public"."materials" USING btree (
  "is_active" "pg_catalog"."bool_ops" ASC NULLS LAST
);
CREATE INDEX "idx_materials_default_location" ON "public"."materials" USING btree (
  "default_location_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_materials_location" ON "public"."materials" USING btree (
  "default_location_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_materials_mat_type" ON "public"."materials" USING btree (
  "mat_type_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_materials_type" ON "public"."materials" USING btree (
  "mat_type_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE INDEX "idx_materials_type_location" ON "public"."materials" USING btree (
  "mat_type_id" "pg_catalog"."int4_ops" ASC NULLS LAST,
  "default_location_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "uq_materials_mat_code" ON "public"."materials" USING btree (
  "mat_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table materials
-- ----------------------------
ALTER TABLE "public"."materials" ADD CONSTRAINT "materials_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table materials_location
-- ----------------------------
CREATE UNIQUE INDEX "uq_materials_location_code" ON "public"."materials_location" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table materials_location
-- ----------------------------
ALTER TABLE "public"."materials_location" ADD CONSTRAINT "materials_location_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table materials_stock
-- ----------------------------
ALTER TABLE "public"."materials_stock" ADD CONSTRAINT "materials_stock_pkey" PRIMARY KEY ("material_id");

-- ----------------------------
-- Indexes structure for table materials_type
-- ----------------------------
CREATE UNIQUE INDEX "uq_materials_type_code" ON "public"."materials_type" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table materials_type
-- ----------------------------
ALTER TABLE "public"."materials_type" ADD CONSTRAINT "materials_type_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Uniques structure for table permissions
-- ----------------------------
ALTER TABLE "public"."permissions" ADD CONSTRAINT "permissions_code_key" UNIQUE ("code");

-- ----------------------------
-- Primary Key structure for table permissions
-- ----------------------------
ALTER TABLE "public"."permissions" ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table role_permissions
-- ----------------------------
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id");

-- ----------------------------
-- Uniques structure for table roles
-- ----------------------------
ALTER TABLE "public"."roles" ADD CONSTRAINT "roles_code_key" UNIQUE ("code");

-- ----------------------------
-- Primary Key structure for table roles
-- ----------------------------
ALTER TABLE "public"."roles" ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table user_roles
-- ----------------------------
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");

-- ----------------------------
-- Uniques structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
ALTER TABLE "public"."users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table items_name
-- ----------------------------
ALTER TABLE "public"."items_name" ADD CONSTRAINT "fk_items_material" FOREIGN KEY ("material_id") REFERENCES "public"."materials" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table materials
-- ----------------------------
ALTER TABLE "public"."materials" ADD CONSTRAINT "fk_materials_location" FOREIGN KEY ("default_location_id") REFERENCES "public"."materials_location" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "public"."materials" ADD CONSTRAINT "fk_materials_type" FOREIGN KEY ("mat_type_id") REFERENCES "public"."materials_type" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table materials_stock
-- ----------------------------
ALTER TABLE "public"."materials_stock" ADD CONSTRAINT "fk_materials_stock_material" FOREIGN KEY ("material_id") REFERENCES "public"."materials" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table role_permissions
-- ----------------------------
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "fk_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "fk_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "public"."roles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table user_roles
-- ----------------------------
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "fk_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "public"."roles" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "fk_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;
