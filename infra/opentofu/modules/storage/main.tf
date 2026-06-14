# Módulo storage: bucket para backups do banco e exportações de dados abertos.
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

variable "name" { type = string }
variable "region" {
  type    = string
  default = "nyc3"
}

resource "digitalocean_spaces_bucket" "backups" {
  name   = var.name
  region = var.region
  acl    = "private"
}

output "bucket_name" { value = digitalocean_spaces_bucket.backups.name }
output "bucket_domain" { value = digitalocean_spaces_bucket.backups.bucket_domain_name }
