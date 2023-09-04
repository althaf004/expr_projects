terraform {
  required_providers {
    atlas = {
      version = "~> 0.4.0"
      source  = "ariga/atlas"
    }
  }
}

provider "atlas" {}

// Load (and normalize) the desired schema from an HCL file.
data "atlas_schema" "market" {
  dev_url = "docker://postgres/15/dev"
  src = file("${path.module}/schema.hcl")
}

// Sync the state of the target database with the hcl file.
resource "atlas_schema" "market" {
  hcl = data.atlas_schema.market.hcl
  url = "postgres://postgres:citrus123@10.10.11.249:5432/pgdcp_prime_althaf4"
  dev_url = "docker://postgres/15/dev"
}