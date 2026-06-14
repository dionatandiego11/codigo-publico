# Módulo database: PostgreSQL gerenciado (backup e failover por conta do provedor).
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
  default = "db-s-1vcpu-1gb"
}
variable "environment" { type = string }

resource "digitalocean_database_cluster" "postgres" {
  name       = var.name
  engine     = "pg"
  version    = "16"
  region     = var.region
  size       = var.size
  node_count = 1
  tags       = ["codigo-publico", var.environment]
}

resource "digitalocean_database_db" "app" {
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "codigo_publico"
}

output "cluster_id" { value = digitalocean_database_cluster.postgres.id }
output "connection_uri" {
  value     = digitalocean_database_cluster.postgres.uri
  sensitive = true
}
