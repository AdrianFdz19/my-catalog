terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "5.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = var.rg_name
  location = "eastus"

  tags = {
    environment = "dev"
    project     = "mi-catalogo"
    managed_by  = "terraform"
  }
}

# 2. Azure Container Registry (ACR) - To store your Docker images
resource "azurerm_container_registry" "acr" {
  name                = "farfacrmicatalogodev" # Must be globally unique (alphanumeric only)
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

# 3. Azure Container Apps Environment - The managed serverless boundary
resource "azurerm_container_app_environment" "cae" {
  name                = "cae-mi-catalogo-dev"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

# 4. Azure Container App - The actual running instance of your Next.js app
resource "azurerm_container_app" "api" {
  name                         = "ca-mi-catalogo-app"
  container_app_environment_id = azurerm_container_app_environment.cae.id
  resource_group_name          = azurerm_resource_group.rg.name
  revision_mode                = "Single"

  # Authentication config to pull from your private ACR
  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  # --- SECRETS (Must use lowercase and hyphens) ---
  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  secret {
    name  = "openai-api-key"
    value = var.openai_api_key
  }

  secret {
    name  = "google-service-account-json"
    value = file("${path.module}/service-account.json")
  }

  template {
    min_replicas = 1
    max_replicas = 3

    container {
      name   = "mi-catalogo-ui"
      image  = "${azurerm_container_registry.acr.login_server}/mi-catalogo:v3.0.1"
      cpu    = "0.5"
      memory = "1.0Gi"

      # Standard environment variables
      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "NEXT_PUBLIC_WHATSAPP_NUMBER"
        value = var.next_public_whatsapp_number
      }

      env {
        name  = "GOOGLE_SHEET_CSV_URL"
        value = var.google_sheet_csv_url
      }

      env {
        name  = "NEXT_PUBLIC_SUPABASE_URL"
        value = var.next_public_supabase_url
      }

      env {
        name  = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        value = var.next_public_supabase_anon_key
      }

      env {
        name  = "GOOGLE_SHEET_ID"
        value = var.google_sheet_id
      }

      env {
        name  = "GOOGLE_SERVICE_ACCOUNT"
        value = var.google_service_account
      }

      # Secret-backed environment variables (use secret_name instead of value)
      env {
        name        = "OPENAI_API_KEY"
        secret_name = "openai-api-key"
      }
      env {
        name        = "GOOGLE_SERVICE_ACCOUNT_JSON"
        secret_name = "google-service-account-json"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# Output the public URL of your application automatically
output "container_app_url" {
  value = "https://${azurerm_container_app.api.ingress[0].fqdn}"
}
