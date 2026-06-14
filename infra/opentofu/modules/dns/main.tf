# Módulo dns: aponta o domínio da instância municipal para o servidor.
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

variable "domain" { type = string }
variable "subdomain" {
  type    = string
  default = "@"
}
variable "ipv4" { type = string }

resource "digitalocean_record" "app" {
  domain = var.domain
  type   = "A"
  name   = var.subdomain
  value  = var.ipv4
  ttl    = 300
}

output "fqdn" { value = digitalocean_record.app.fqdn }
