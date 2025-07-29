import logging
import os
import tempfile

import clamav_client

from clamav_client.clamd import CommunicationError
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.utils import timezone

from iaso.utils.virus_scan.model import VirusScanStatus


logger = logging.getLogger(__name__)


def scan_uploaded_file_for_virus(uploaded_file: InMemoryUploadedFile):
    """
    Scan an uploaded file for viruses using ClamAV.

    This function takes an InMemoryUploadedFile (typically from a Django form),
    creates a temporary file on disk, and scans it using ClamAV. The temporary
    file is automatically cleaned up after scanning.

    Args:
        uploaded_file (InMemoryUploadedFile): The file to scan, typically from
            a Django form upload or DRF serializer.

    Returns:
        tuple: A tuple containing (VirusScanStatus, datetime or None)
            - VirusScanStatus: The result of the scan (CLEAN, INFECTED, ERROR, PENDING)
            - datetime or None: Timestamp of when the scan was performed, or None if error

    Example:
        status, timestamp = scan_uploaded_file_for_virus(uploaded_file)
        if status == VirusScanStatus.CLEAN:
            # File is safe to use
            pass
        elif status == VirusScanStatus.INFECTED:
            # Handle infected file
            pass
    """
    # We need a temporary file because the library requires sending disk files (not memory files)
    logger.info(f"Scanning InMemoryUploadedFile {uploaded_file.name} for virus")
    with tempfile.NamedTemporaryFile(mode="wb") as temp_file:
        for chunk in uploaded_file.chunks():
            temp_file.write(chunk)

        temp_file.flush()  # If you don't flush, you send an empty file
        temp_file_path = temp_file.name
        result = _scan_with_clamav(temp_file_path)

    return result


def scan_disk_file_for_virus(file_path: str):
    """
    Scan a file on disk for viruses using ClamAV.

    This function scans an existing file on the filesystem using ClamAV.
    Useful for scanning files that are already saved to disk.

    Args:
        file_path (str): The absolute path to the file to scan.

    Returns:
        tuple: A tuple containing (VirusScanStatus, datetime or None)
            - VirusScanStatus: The result of the scan (CLEAN, INFECTED, ERROR, PENDING)
            - datetime or None: Timestamp of when the scan was performed, or None if error

    Example:
        status, timestamp = scan_disk_file_for_virus("/path/to/document.pdf")
        if status == VirusScanStatus.CLEAN:
            # File is safe to use
            pass
        elif status == VirusScanStatus.INFECTED:
            # Handle infected file
            pass
    """
    logger.info(f"Scanning disk file {file_path} for virus")
    return _scan_with_clamav(file_path)


def _scan_with_clamav(file_path: str):
    """
    Internal function to perform virus scanning using ClamAV.

    This function handles the actual communication with ClamAV and processes
    the scan results. It's called by the public scanning functions.

    Args:
        file_path (str): The absolute path to the file to scan.

    Returns:
        tuple: A tuple containing (VirusScanStatus, datetime or None)
            - VirusScanStatus: The result of the scan
            - datetime or None: Timestamp of when the scan was performed

    Note:
        This function is internal and should not be called directly.
        Use scan_uploaded_file_for_virus() or scan_disk_file_for_virus() instead.
    """
    is_clamav_active = settings.CLAMAV_ACTIVE
    if not is_clamav_active:
        logger.info("ClamAV is not active, skipping scan")
        return VirusScanStatus.PENDING, None

    try:
        scanner = clamav_client.get_scanner(config=settings.CLAMAV_CONFIGURATION)
        before = timezone.now()
        scan = scanner.scan(file_path)
        after = timezone.now()
        file_size = os.path.getsize(file_path)
        logger.info(f"Scan result: {scan} - done in {after - before} - size {file_size} B")

        if scan.passed:
            return VirusScanStatus.CLEAN, after
        if scan.state == "FOUND":
            return VirusScanStatus.INFECTED, after
        if scan.state == "ERROR":
            return VirusScanStatus.ERROR, None

        return VirusScanStatus.PENDING, None

    except CommunicationError as e:
        logger.error(f"Connection error to ClamAV - {e}")
        return VirusScanStatus.ERROR, None
    except Exception as e:
        logger.error(f"Unknown error while scanning file - {e}")
        return VirusScanStatus.ERROR, None
