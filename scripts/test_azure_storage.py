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
from django.core.files.storage import default_storage, staticfiles_storage


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
        # Test media file upload (using default storage)
        test_content = "This is a test media file for Azure Storage configuration."
        test_filename = f"test_azure_media_{os.getpid()}.txt"

        print(f"📤 Testing media file upload: {test_filename}")
        file_path = default_storage.save(test_filename, ContentFile(test_content))
        print(f"✅ Media file uploaded successfully: {file_path}")

        # Test media file read
        print("📖 Testing media file read...")
        with default_storage.open(file_path, "r") as f:
            content = f.read()
            if content == test_content:
                print("✅ Media file content matches")
            else:
                print("❌ Media file content does not match")
                return False

        # Test media file URL
        print("🔗 Testing media file URL...")
        file_url = default_storage.url(file_path)
        print(f"✅ Media file URL: {file_url}")

        # Test static file upload (using staticfiles storage)
        if hasattr(settings, "STATICFILES_STORAGE"):
            print(f"📁 Static storage backend: {settings.STATICFILES_STORAGE}")

            static_test_content = "This is a test static file for Azure Storage configuration."
            static_test_filename = f"test_azure_static_{os.getpid()}.txt"

            print(f"📤 Testing static file upload: {static_test_filename}")
            static_file_path = staticfiles_storage.save(static_test_filename, ContentFile(static_test_content))
            print(f"✅ Static file uploaded successfully: {static_file_path}")

            # Test static file URL
            print("🔗 Testing static file URL...")
            static_file_url = staticfiles_storage.url(static_file_path)
            print(f"✅ Static file URL: {static_file_url}")

            # Test static file read
            print("📖 Testing static file read...")
            with staticfiles_storage.open(static_file_path, "r") as f:
                static_content = f.read()
                if static_content == static_test_content:
                    print("✅ Static file content matches")
                else:
                    print("❌ Static file content does not match")
                    return False

            # Clean up static file
            print("🗑️ Testing static file deletion...")
            staticfiles_storage.delete(static_file_path)
            print("✅ Static file deleted successfully")

        # Test media file deletion
        print("🗑️ Testing media file deletion...")
        default_storage.delete(file_path)
        print("✅ Media file deleted successfully")

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


def check_container_structure():
    """Check and explain the container structure."""
    print("\n📁 Container Structure:")
    print("-" * 30)
    container_name = os.environ.get("AZURE_CONTAINER_NAME", "iaso")
    account_name = os.environ.get("AZURE_STORAGE_ACCOUNT_NAME", "your_account")

    print(f"  Container: {container_name}")
    print("  ├── static/     (static files: JS, CSS, images)")
    print("  └── media/      (user-uploaded files)")
    print()
    print("  URLs:")
    print(f"  ├── Static: https://{account_name}.blob.core.windows.net/{container_name}/static/")
    print(f"  └── Media:  https://{account_name}.blob.core.windows.net/{container_name}/media/")


if __name__ == "__main__":
    print("🚀 Iaso Azure Storage Configuration Test")
    print("=" * 50)

    # Check environment variables
    check_environment()

    # Show container structure
    check_container_structure()
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
