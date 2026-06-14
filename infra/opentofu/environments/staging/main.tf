# Staging: igual à produção, com recursos menores e banco no próprio servidor.
terraform {
  required_version = ">= 1.6"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {}

variable "city_slug" { type = string }
variable "region" {
  type    = string
  default = "nyc3"
}
variable "ssh_key_ids" { type = list(string) }
variable "ssh_allowed_cidrs" { type = list(string) }

module "server" {
  source      = "../../modules/server"
  name        = "codigo-publico-${var.city_slug}-staging"
  region      = var.region
  size        = "s-1vcpu-2gb"
  ssh_key_ids = var.ssh_key_ids
  environment = "staging"
}

module "firewall" {
  source            = "../../modules/firewall"
  name              = "codigo-publico-${var.city_slug}-staging-fw"
  droplet_ids       = [module.server.droplet_id]
  ssh_allowed_cidrs = var.ssh_allowed_cidrs
}

output "server_ip" { value = module.server.ipv4 }
