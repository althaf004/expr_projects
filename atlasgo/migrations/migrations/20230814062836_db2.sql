-- Add new schema named "dcp_extensions"
CREATE SCHEMA "dcp_extensions";
-- Add new schema named "dcp_lib"
CREATE SCHEMA "dcp_lib";
-- Add new schema named "news"
CREATE SCHEMA "news";
-- Add new schema named "stateless_integrations"
CREATE SCHEMA "stateless_integrations";
-- Add new schema named "stateless_service_medigy_identity"
CREATE SCHEMA "stateless_service_medigy_identity";
-- Create "persons" table
CREATE TABLE "public"."persons" ("id" integer NOT NULL, "lastname" character varying(255) NOT NULL, "firstname" character varying(255) NULL, "age" integer NULL);
-- Create index "idx_pname" to table: "persons"
CREATE INDEX "idx_pname" ON "public"."persons" ("lastname", "firstname");
-- Create index "persons_id_key" to table: "persons"
CREATE UNIQUE INDEX "persons_id_key" ON "public"."persons" ("id");
-- Create "persons2" table
CREATE TABLE "public"."persons2" ("id" integer NOT NULL, "lastname" character varying(255) NOT NULL, "firstname" character varying(255) NULL, "age" integer NULL, PRIMARY KEY ("id", "lastname"));
-- Create "customers" table
CREATE TABLE "public"."customers" ("id" integer NOT NULL, "first_name" character varying(255) NOT NULL, "last_name" character varying(255) NOT NULL, PRIMARY KEY ("id"));
-- Create "customers_prefers3" table
CREATE TABLE "public"."customers_prefers3" ("id" integer NOT NULL, "pre_first_name" character varying(255) NOT NULL, "pre_last_name" character varying(255) NOT NULL, "pre_middle_name" character varying NULL, "age" integer NULL, PRIMARY KEY ("id"));
-- Create "person" table
CREATE TABLE "public"."person" ("id" integer NOT NULL, "name" character varying(50) NOT NULL, "address1" character varying(50) NULL, "address2" character varying(50) NULL, "city" character varying(30) NULL, PRIMARY KEY ("id"));
-- Create "company" table
CREATE TABLE "public"."company" ("id" integer NOT NULL, "name" character varying(50) NOT NULL, "address1" character varying(50) NULL, "address2" character varying(50) NULL, "city" character varying(30) NULL, PRIMARY KEY ("id"));
-- Create "blog_posts" table
CREATE TABLE "public"."blog_posts" ("id" integer NOT NULL, "title" character varying(100) NULL, "body" text NULL, "author_id" integer NULL);
-- Set comment to table: "blog_posts"
COMMENT ON TABLE "public"."blog_posts" IS 'blogpost';
-- Create "persons4_check" table
CREATE TABLE "public"."persons4_check" ("id" integer NOT NULL, "lastname" character varying(255) NOT NULL, "firstname" character varying(255) NULL, "age" integer NULL, CONSTRAINT "persons4_check_age_check" CHECK (age >= 18));
-- Create "persons3" table
CREATE TABLE "public"."persons3" ("id" integer NOT NULL, "lastname" character varying(255) NOT NULL, "firstname" character varying(255) NULL, "age" integer NULL, PRIMARY KEY ("id", "lastname"));
-- Create "persons1" table
CREATE TABLE "public"."persons1" ("id" integer NOT NULL, "lastname" character varying(200) NOT NULL, "firstnames" character varying(255) NULL, "age" integer NULL, CONSTRAINT "persons1_age_check" CHECK (age >= 18));
-- Create "users" table
CREATE TABLE "public"."users" ("id" integer NOT NULL, "name" character varying(100) NULL, PRIMARY KEY ("id"));
-- Create "orders" table
CREATE TABLE "public"."orders" ("id" integer NOT NULL, "customer_id" integer NOT NULL, "order_date" date NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION);
-- Create "vw_users_identity" view
CREATE VIEW "stateless_service_medigy_identity"."vw_users_identity" ("id", "name") AS SELECT users.id,
    users.name
   FROM users;
-- Create "vw_users" view
CREATE VIEW "public"."vw_users" ("id", "name") AS SELECT users.id,
    users.name
   FROM users;
