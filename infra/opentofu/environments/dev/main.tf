# Dev: ambiente local usa Docker Compose (raiz do repo); este ambiente existe
# apenas para testar os módulos com a menor instância possível.
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

variable "ssh_key_ids" { type = list(string) }
variable "ssh_allowed_cidrs" { type = list(string) }

module "server" {
  source      = "../../modules/server"
  name        = "codigo-publico-dev"
  size        = "s-1vcpu-1gb"
  ssh_key_ids = var.ssh_key_ids
  environment = "dev"
}

module "firewall" {
  source            = "../../modules/firewall"
  name              = "codigo-publico-dev-fw"
  droplet_ids       = [module.server.droplet_id]
  ssh_allowed_cidrs = var.ssh_allowed_cidrs
}

output "server_ip" { value = module.server.ipv4 }
