-- Add new schema named "news"
CREATE SCHEMA "news";
-- Create "customers_prefers3" table
CREATE TABLE "public"."customers_prefers3" ("id" integer NOT NULL, "pre_first_name" character varying(255) NOT NULL, "pre_last_name" character varying(255) NOT NULL, "pre_middle_name" character varying NULL, "age" integer NULL, PRIMARY KEY ("id"));
-- Create "person" table
CREATE TABLE "public"."person" ("id" integer NOT NULL, "name" character varying(50) NOT NULL, "address1" character varying(50) NULL, "address2" character varying(50) NULL, "city" character varying(30) NULL, PRIMARY KEY ("id"));
-- Create "persons" table
CREATE TABLE "public"."persons" ("id" integer NOT NULL, "lastname" character varying(255) NOT NULL, "firstname" character varying(255) NULL, "age" integer NULL);
-- Create index "idx_pname" to table: "persons"
CREATE INDEX "idx_pname" ON "public"."persons" ("lastname", "firstname");
-- Create index "persons_id_key" to table: "persons"
CREATE UNIQUE INDEX "persons_id_key" ON "public"."persons" ("id");
-- Create "persons1" table
CREATE TABLE "public"."persons1" ("id" integer NOT NULL, "lastname" character varying(200) NOT NULL, "firstnames" character varying(255) NULL, "age" integer NULL, CONSTRAINT "persons1_age_check" CHECK (age >= 18));
-- Create "persons2" table
CREATE TABLE "public"."persons2" ("id" integer NOT NULL, "lastname" character varying(255) NOT NULL, "firstname" character varying(255) NULL, "age" integer NULL, PRIMARY KEY ("id", "lastname"));
-- Create "persons3" table
CREATE TABLE "public"."persons3" ("id" integer NOT NULL, "lastname" character varying(255) NOT NULL, "firstname" character varying(255) NULL, "age" integer NULL, PRIMARY KEY ("id", "lastname"));
-- Create "persons4_check" table
CREATE TABLE "public"."persons4_check" ("id" integer NOT NULL, "lastname" character varying(255) NOT NULL, "firstname" character varying(255) NULL, "age" integer NULL, CONSTRAINT "persons4_check_age_check" CHECK (age >= 18));
-- Create "orders" table
CREATE TABLE "public"."orders" ("id" integer NOT NULL, "customer_id" integer NOT NULL, "order_date" date NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION);
CREATE OR REPLACE FUNCTION "public"."assign_user_role"(username text, rolename text)
 RETURNS text
 LANGUAGE plpython3u
AS $function$
    import json
    try: 
      keycloak_prov = plpy.execute("select * from keycloak_provenance");   
      response =  plpy.execute("select * from assign_realm_roles_to_user('"+username+"','"+rolename+"','"+keycloak_prov[0]["api_base_url"]+"','"+keycloak_prov[0]["admin_username"]+"','"+keycloak_prov[0]["admin_password"]+"','"+keycloak_prov[0]["user_realm_name"]+"','"+keycloak_prov[0]["master_realm"]+"')");
      res = response[0]["assign_realm_roles_to_user"];
      return res;   
    except Exception as error:
      return repr(error)
    $function$
;