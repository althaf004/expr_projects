-- Add new schema named "dcp_extensions"
CREATE SCHEMA "dcp_extensions";
-- Add new schema named "dcp_lib"
CREATE SCHEMA "dcp_lib";
-- Add new schema named "public"
CREATE SCHEMA IF NOT EXISTS "public";
-- Set comment to schema: "public"
COMMENT ON SCHEMA "public" IS 'standard public schema';
-- Create "_sqlx_migrations" table
CREATE TABLE "public"."_sqlx_migrations" ("version" bigint NOT NULL, "description" text NOT NULL, "installed_on" timestamptz NOT NULL DEFAULT now(), "success" boolean NOT NULL, "checksum" bytea NOT NULL, "execution_time" bigint NOT NULL, PRIMARY KEY ("version"));
-- Create "user_info" table
CREATE TABLE "public"."user_info" ("username" text NOT NULL, "password_hash" text NOT NULL, PRIMARY KEY ("username"));
-- Create "users" table
CREATE TABLE "public"."users" ("name" character varying NULL, "age" integer NULL, "email" character varying NULL);
-- Create "login_session" table
CREATE TABLE "public"."login_session" ("id" text NOT NULL, "username" text NOT NULL, "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY ("id"), CONSTRAINT "login_session_username_fkey" FOREIGN KEY ("username") REFERENCES "public"."user_info" ("username") ON UPDATE NO ACTION ON DELETE NO ACTION);
