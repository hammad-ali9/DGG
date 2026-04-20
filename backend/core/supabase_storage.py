"""
Custom Django storage backend for Supabase Storage.

Uploads files to Supabase Storage via REST API instead of local disk.
This is required because Vercel's filesystem is ephemeral — files written
to disk are lost between serverless function invocations.

Usage in settings.py:
    DEFAULT_FILE_STORAGE = 'core.supabase_storage.SupabaseStorage'
    SUPABASE_URL = 'https://xxxx.supabase.co'
    SUPABASE_SERVICE_KEY = 'sb_secret_...'
    SUPABASE_BUCKET = 'user-documents'
"""

import os
import mimetypes
import requests
from django.core.files.storage import Storage
from django.conf import settings
from django.utils.deconstruct import deconstructible


@deconstructible
class SupabaseStorage(Storage):
    """
    Django storage backend that stores files in Supabase Storage.
    Files are publicly accessible via the Supabase CDN URL.
    """

    def __init__(self):
        self.supabase_url = getattr(settings, 'SUPABASE_URL', os.getenv('SUPABASE_URL', ''))
        self.service_key = getattr(settings, 'SUPABASE_SERVICE_KEY', os.getenv('SUPABASE_SERVICE_KEY', ''))
        self.bucket = getattr(settings, 'SUPABASE_BUCKET', 'user-documents')

        # Strip trailing slash from URL
        self.supabase_url = self.supabase_url.rstrip('/')

        self._headers = {
            'Authorization': f'Bearer {self.service_key}',
            'apikey': self.service_key,
        }

    def _storage_url(self, path=''):
        return f"{self.supabase_url}/storage/v1/object/{self.bucket}/{path}"

    def _public_url(self, name):
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket}/{name}"

    def _ensure_bucket_exists(self):
        """Create the bucket if it doesn't exist."""
        url = f"{self.supabase_url}/storage/v1/bucket"
        resp = requests.get(url, headers=self._headers, timeout=10)
        if resp.status_code == 200:
            buckets = [b.get('name') for b in resp.json()]
            if self.bucket not in buckets:
                requests.post(
                    url,
                    json={'id': self.bucket, 'name': self.bucket, 'public': True},
                    headers=self._headers,
                    timeout=10
                )

    def _save(self, name, content):
        """Upload file to Supabase Storage and return the stored name."""
        self._ensure_bucket_exists()

        # Read file content
        content.seek(0)
        file_data = content.read()

        # Determine content type
        content_type, _ = mimetypes.guess_type(name)
        if not content_type:
            content_type = 'application/octet-stream'

        upload_headers = {
            **self._headers,
            'Content-Type': content_type,
            'x-upsert': 'true',  # overwrite if exists
        }

        url = self._storage_url(name)
        resp = requests.post(url, data=file_data, headers=upload_headers, timeout=30)

        if resp.status_code not in (200, 201):
            raise Exception(f"Supabase upload failed: {resp.status_code} {resp.text}")

        return name

    def url(self, name):
        """Return the public URL for a stored file."""
        if not name:
            return ''
        return self._public_url(name)

    def exists(self, name):
        """Check if a file exists in Supabase Storage."""
        url = self._storage_url(name)
        resp = requests.head(url, headers=self._headers, timeout=10)
        return resp.status_code == 200

    def delete(self, name):
        """Delete a file from Supabase Storage."""
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}"
        requests.delete(
            url,
            json={'prefixes': [name]},
            headers=self._headers,
            timeout=10
        )

    def size(self, name):
        """Return file size (not easily available without downloading)."""
        return 0

    def listdir(self, path):
        """List directory contents."""
        return [], []
