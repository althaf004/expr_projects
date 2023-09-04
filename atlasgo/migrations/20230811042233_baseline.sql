-- Add new schema named "stateless_integrations"
CREATE SCHEMA "stateless_integrations";
-- Add new schema named "stateless_service_medigy_identity"
CREATE SCHEMA "stateless_service_medigy_identity";
-- Create "blog_posts" table
CREATE TABLE "public"."blog_posts" ("id" integer NOT NULL, "title" character varying(100) NULL, "body" text NULL, "author_id" integer NULL);
-- Set comment to table: "blog_posts"
COMMENT ON TABLE "public"."blog_posts" IS 'blogpost';
-- Create "company" table
CREATE TABLE "public"."company" ("id" integer NOT NULL, "name" character varying(50) NOT NULL, "address1" character varying(50) NULL, "address2" character varying(50) NULL, "city" character varying(30) NULL, PRIMARY KEY ("id"));
-- Create "customers" table
CREATE TABLE "public"."customers" ("id" integer NOT NULL, "first_name" character varying(255) NOT NULL, "last_name" character varying(255) NOT NULL, PRIMARY KEY ("id"));
-- Create "users" table
CREATE TABLE "public"."users" ("id" integer NOT NULL, "name" character varying(100) NULL, PRIMARY KEY ("id"));
-- Create "vw_users" view
CREATE VIEW "public"."vw_users" ("id", "name") AS SELECT users.id,
    users.name
   FROM users;
-- Create "vw_users_identity" view
CREATE VIEW "stateless_service_medigy_identity"."vw_users_identity" ("id", "name") AS SELECT users.id,
    users.name
   FROM users;
