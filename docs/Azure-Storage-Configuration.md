# Azure Storage Configuration for Iaso

This document explains how to configure Iaso to use Azure Blob Storage instead of AWS S3 or local storage.

## Overview

Iaso supports three storage providers:
- **Local**: Files stored on the local filesystem (default for development)
- **AWS S3**: Files stored in Amazon S3 (current production setup)
- **Azure Blob Storage**: Files stored in Azure Blob Storage (new option)

## Environment Variables

To enable Azure Storage, set the following environment variables:

### Required Variables

```bash
# Enable Azure Storage
USE_AZURE_STORAGE=true

# Azure Storage Account credentials (choose one method)
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key

# OR use connection string (alternative to account name/key)
AZURE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your_account;AccountKey=your_key;EndpointSuffix=core.windows.net
```

### Optional Variables

```bash
# Container name for general storage (default: "iaso")
AZURE_CONTAINER_NAME=iaso

# Custom domain for CDN (optional)
AZURE_CUSTOM_DOMAIN=static.yourdomain.com

# CDN URL for static files (overrides Azure URLs)
STATIC_URL=https://your-cdn.com/static/
```

## Storage Container Structure

The system uses a single container with folder organization:
- **Container**: `iaso` (or `AZURE_CONTAINER_NAME`)
- **`static/` folder**: For static files (JS, CSS, images)
- **`media/` folder**: For user-uploaded files

This approach is more efficient and follows Azure Storage best practices.

## URL Patterns

Depending on your configuration, files will be served from:

### With Custom Domain
```
Static files: https://yourdomain.com/static/
Media files: https://yourdomain.com/media/
```

### Without Custom Domain
```
Static files: https://your_storage_account.blob.core.windows.net/iaso/static/
Media files: https://your_storage_account.blob.core.windows.net/iaso/media/
```

### With CDN
```
Static files: https://your-cdn.com/static/
Media files: https://your_storage_account.blob.core.windows.net/media/
```

## Setup Steps

### 1. Create Azure Storage Account

1. Go to Azure Portal
2. Create a new Storage Account
3. Note down the account name and access key

### 2. Create Container

The container will be created automatically when first accessed, but you can create it manually:

```bash
# Using Azure CLI
az storage container create --name iaso --account-name your_account_name
```

The `static/` and `media/` folders will be created automatically when files are uploaded.

### 3. Configure Environment Variables

Set the required environment variables in your deployment environment:

```bash
export USE_AZURE_STORAGE=true
export AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
export AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key
```

### 4. Test Configuration

Run the following commands to test your configuration:

```bash
# Collect static files
python manage.py collectstatic --noinput

# Test file upload (if you have admin access)
# Upload a file through the Django admin interface
```

## Migration from S3

If you're migrating from AWS S3 to Azure Storage:

1. **Data Migration**: Use Azure Data Factory or AzCopy to migrate existing files
2. **Update Environment**: Change from S3 to Azure environment variables
3. **Test Thoroughly**: Verify all file uploads and downloads work correctly
4. **Update CDN**: If using a CDN, update it to point to Azure Storage

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify your account name and key are correct
2. **Container Not Found**: The container is created automatically, but ensure your account has proper permissions
3. **CORS Issues**: Configure CORS settings in Azure Storage if accessing from web browsers

### CORS Configuration

If you encounter CORS issues, configure Azure Storage CORS:

```bash
# Using Azure CLI
az storage cors add --account-name your_account_name \
  --services blob \
  --methods GET HEAD POST PUT DELETE OPTIONS \
  --origins "*" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 86400
```

## Security Considerations

1. **Access Keys**: Store access keys securely, never commit them to version control
2. **Network Security**: Consider using Azure Private Endpoints for enhanced security
3. **Encryption**: Azure Storage provides encryption at rest by default
4. **Access Control**: Use Azure RBAC to control access to storage accounts

## Cost Optimization

1. **Storage Tier**: Use appropriate storage tiers (Hot, Cool, Archive)
2. **Lifecycle Management**: Configure lifecycle policies to move data to cheaper tiers
3. **CDN**: Use Azure CDN to reduce bandwidth costs
4. **Monitoring**: Monitor usage and costs through Azure Portal

## Example Configuration Files

### Docker Compose (Development)

```yaml
version: '3.8'
services:
  web:
    environment:
      - USE_AZURE_STORAGE=true
      - AZURE_STORAGE_ACCOUNT_NAME=your_account_name
      - AZURE_STORAGE_ACCOUNT_KEY=your_account_key
      - AZURE_CONTAINER_NAME=iaso-dev
```

### Elastic Beanstalk (Production)

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    USE_AZURE_STORAGE: "true"
    AZURE_STORAGE_ACCOUNT_NAME: "your_account_name"
    AZURE_STORAGE_ACCOUNT_KEY: "your_account_key"
    AZURE_CONTAINER_NAME: "iaso-prod"
    AZURE_CUSTOM_DOMAIN: "static.yourdomain.com"
```

## Support

For issues related to Azure Storage configuration, please:
1. Check the Azure Storage documentation
2. Verify your environment variables are set correctly
3. Test with a simple file upload/download
4. Check Django logs for detailed error messages 