terraform {
  required_version = ">= 1.1.6"
  required_providers {
    postgresql = {
      source  = "hashicorp/postgresql"
    }
  }
}

provider "postgresql" {
  host     = "10.10.11.249"
  port     = 5432
  username = "postgres"
  password = "citrus123"
  database = "pgdcp_prime_althaf4"
  alias    = "pg"
}

resource "postgresql_schema" "example_schema" {
  name = "your_schema_name"
}
