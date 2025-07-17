#!/usr/bin/env python
"""
Test script for Azure Storage configuration in Iaso.

This script helps verify that Azure Storage is properly configured and accessible.
Run this script after setting up your Azure Storage environment variables.

Usage:
    python scripts/test_azure_storage.py
"""

import os
import sys

import django

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hat.settings")
django.setup()


def test_azure_storage():
    """Test Azure Storage configuration."""
    print("🔍 Testing Azure Storage Configuration...")
    print("=" * 50)

    # Check if Azure Storage is enabled
    if not getattr(settings, "USE_AZURE_STORAGE", False):
        print("❌ Azure Storage is not enabled.")
        print("   Set USE_AZURE_STORAGE=true in your environment variables.")
        return False

    print("✅ Azure Storage is enabled")

    # Check required environment variables
    required_vars = [
        "AZURE_STORAGE_ACCOUNT_NAME",
        "AZURE_STORAGE_ACCOUNT_KEY",
    ]

    missing_vars = []
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)

    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        return False

    print("✅ Required environment variables are set")

    # Check storage backend
    if not hasattr(settings, "DEFAULT_FILE_STORAGE"):
        print("❌ DEFAULT_FILE_STORAGE is not configured")
        return False

    print(f"✅ Storage backend: {settings.DEFAULT_FILE_STORAGE}")

    # Test file operations
    try:
        # Test file upload
        test_content = "This is a test file for Azure Storage configuration."
        test_filename = f"test_azure_storage_{os.getpid()}.txt"

        print(f"📤 Testing file upload: {test_filename}")
        file_path = default_storage.save(test_filename, ContentFile(test_content))
        print(f"✅ File uploaded successfully: {file_path}")

        # Test file read
        print("📖 Testing file read...")
        with default_storage.open(file_path, "r") as f:
            content = f.read()
            if content == test_content:
                print("✅ File content matches")
            else:
                print("❌ File content does not match")
                return False

        # Test file URL
        print("🔗 Testing file URL...")
        file_url = default_storage.url(file_path)
        print(f"✅ File URL: {file_url}")

        # Test file deletion
        print("🗑️ Testing file deletion...")
        default_storage.delete(file_path)
        print("✅ File deleted successfully")

        # Test static storage if configured
        if hasattr(settings, "STATICFILES_STORAGE"):
            print(f"📁 Static storage backend: {settings.STATICFILES_STORAGE}")
            print("✅ Static storage is configured")

        print("\n🎉 All Azure Storage tests passed!")
        return True

    except Exception as e:
        print(f"❌ Error during storage test: {e}")
        return False


def check_environment():
    """Check environment variables."""
    print("🔧 Environment Variables Check:")
    print("-" * 30)

    env_vars = [
        "USE_AZURE_STORAGE",
        "AZURE_STORAGE_ACCOUNT_NAME",
        "AZURE_STORAGE_ACCOUNT_KEY",
        "AZURE_CONNECTION_STRING",
        "AZURE_CONTAINER_NAME",
        "AZURE_CUSTOM_DOMAIN",
        "STATIC_URL",
    ]

    for var in env_vars:
        value = os.environ.get(var)
        if value:
            # Mask sensitive values
            if "KEY" in var or "SECRET" in var or "CONNECTION" in var:
                masked_value = value[:8] + "***" if len(value) > 8 else "***"
                print(f"  {var}: {masked_value}")
            else:
                print(f"  {var}: {value}")
        else:
            print(f"  {var}: (not set)")


if __name__ == "__main__":
    print("🚀 Iaso Azure Storage Configuration Test")
    print("=" * 50)

    # Check environment variables
    check_environment()
    print()

    # Run storage tests
    success = test_azure_storage()

    if success:
        print("\n✅ Azure Storage is properly configured!")
        sys.exit(0)
    else:
        print("\n❌ Azure Storage configuration has issues.")
        print("   Please check the error messages above and fix the configuration.")
        sys.exit(1)
