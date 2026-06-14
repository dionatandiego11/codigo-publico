# Produção: servidor + banco gerenciado + storage de backup + firewall + DNS.
terraform {
  required_version = ">= 1.6"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
  # Em produção, configure um backend remoto de state:
  # backend "s3" { ... }
}

provider "digitalocean" {}

variable "city_slug" {
  type        = string
  description = "Identificador da instância municipal (ex.: brumadinho)."
}
variable "region" {
  type    = string
  default = "nyc3"
}
variable "ssh_key_ids" { type = list(string) }
variable "ssh_allowed_cidrs" { type = list(string) }
variable "domain" { type = string }

module "server" {
  source      = "../../modules/server"
  name        = "codigo-publico-${var.city_slug}-prod"
  region      = var.region
  size        = "s-2vcpu-4gb"
  ssh_key_ids = var.ssh_key_ids
  environment = "production"
}

module "database" {
  source      = "../../modules/database"
  name        = "codigo-publico-${var.city_slug}-db"
  region      = var.region
  size        = "db-s-1vcpu-2gb"
  environment = "production"
}

module "storage" {
  source = "../../modules/storage"
  name   = "codigo-publico-${var.city_slug}-backups"
  region = var.region
}

module "firewall" {
  source            = "../../modules/firewall"
  name              = "codigo-publico-${var.city_slug}-fw"
  droplet_ids       = [module.server.droplet_id]
  ssh_allowed_cidrs = var.ssh_allowed_cidrs
}

module "dns" {
  source    = "../../modules/dns"
  domain    = var.domain
  subdomain = "@"
  ipv4      = module.server.ipv4
}

output "server_ip" { value = module.server.ipv4 }
output "database_uri" {
  value     = module.database.connection_uri
  sensitive = true
}
output "fqdn" { value = module.dns.fqdn }
