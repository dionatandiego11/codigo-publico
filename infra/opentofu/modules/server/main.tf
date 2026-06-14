# Módulo server: VPS Ubuntu com Docker, pronta para receber a stack via compose.
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
variable "size" {
  type    = string
  default = "s-1vcpu-2gb"
}
variable "ssh_key_ids" { type = list(string) }
variable "environment" { type = string }

resource "digitalocean_droplet" "app" {
  name     = var.name
  region   = var.region
  size     = var.size
  image    = "ubuntu-24-04-x64"
  ssh_keys = var.ssh_key_ids
  tags     = ["codigo-publico", var.environment]

  user_data = <<-CLOUDINIT
    #cloud-config
    package_update: true
    packages: [docker.io, docker-compose-v2, nginx]
    runcmd:
      - systemctl enable --now docker
  CLOUDINIT
}

output "droplet_id" { value = digitalocean_droplet.app.id }
output "ipv4" { value = digitalocean_droplet.app.ipv4_address }
