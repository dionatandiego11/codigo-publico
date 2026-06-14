# Módulo firewall: somente HTTP/HTTPS públicos; SSH restrito a IPs confiáveis.
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

variable "name" { type = string }
variable "droplet_ids" { type = list(string) }
variable "ssh_allowed_cidrs" {
  type        = list(string)
  description = "IPs com acesso SSH (nunca 0.0.0.0/0 em produção)."
}

resource "digitalocean_firewall" "app" {
  name        = var.name
  droplet_ids = [for id in var.droplet_ids : tonumber(id)]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = var.ssh_allowed_cidrs
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "all"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "all"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

output "firewall_id" { value = digitalocean_firewall.app.id }
