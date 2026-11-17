import json
import os
import time

from urllib import parse as urlparse

from django.conf import settings
from django.contrib.staticfiles.storage import staticfiles_storage

from .exceptions import (
    FrontendBundleError,
    FrontendBundleLoaderBadStatsError,
    FrontendBundleLoaderTimeoutError,
    FrontendBundleLookupError,
)


class FrontendBundleLoader:
    _assets = {}

    def __init__(self, name, config):
        self.name = name
        self.config = config

    def load_assets(self):
        try:
            with open(self.config["STATS_FILE"], encoding="utf-8") as stats_file:
                return json.load(stats_file)
        except OSError as error:
            raise OSError(
                f"Error reading {self.config['STATS_FILE']}. "
                "Are you sure the frontend build has generated bundle stats "
                f"and the path is correct?"
            ) from error

    def get_assets(self):
        if self.config["CACHE"]:
            if self.name not in self._assets:
                self._assets[self.name] = self.load_assets()
            return self._assets[self.name]
        return self.load_assets()

    def filter_chunks(self, chunks):
        filtered_chunks = []
        for chunk in chunks:
            ignore = any(regex.match(chunk) for regex in self.config["ignores"])
            if not ignore:
                filtered_chunks.append(chunk)
        return filtered_chunks

    def map_chunk_files_to_url(self, chunks):
        assets = self.get_assets()
        files = assets["assets"]
        for chunk in chunks:
            yield {"name": chunk, "url": self.get_chunk_url(files[chunk])}

    def get_chunk_url(self, chunk_file):
        public_path = chunk_file.get("publicPath")
        if public_path:
            return public_path

        relpath = os.path.normpath(
            os.path.join(self.config["BUNDLE_DIR_NAME"], chunk_file["name"]),
        )
        return self._strip_signing_parameters(staticfiles_storage.url(relpath))

    def _strip_signing_parameters(self, url):
        split_url = urlparse.urlsplit(url)
        qs = urlparse.parse_qsl(split_url.query, keep_blank_values=True)
        blacklist = {
            "x-amz-algorithm",
            "x-amz-credential",
            "x-amz-date",
            "x-amz-expires",
            "x-amz-signedheaders",
            "x-amz-signature",
            "x-amz-security-token",
            "awsaccesskeyid",
            "expires",
            "signature",
        }
        filtered_qs = ((key, val) for key, val in qs if key.lower() not in blacklist)
        joined_qs = ("=".join(keyval) for keyval in filtered_qs)
        split_url = split_url._replace(query="&".join(joined_qs))
        return split_url.geturl()

    def get_bundle(self, bundle_name):
        assets = self.get_assets()

        if settings.DEBUG:
            timeout = self.config["TIMEOUT"] or 0
            timed_out = False
            start = time.time()
            while assets.get("status") == "compile" and not timed_out:
                time.sleep(self.config["POLL_INTERVAL"])
                if timeout and (time.time() - start > timeout):
                    timed_out = True
                assets = self.get_assets()

            if timed_out:
                raise FrontendBundleLoaderTimeoutError(
                    f"Timed out waiting for bundle `{bundle_name}` ({timeout}s).",
                )

        if assets.get("status") == "done":
            chunks = assets["chunks"].get(bundle_name)
            if chunks is None:
                raise FrontendBundleLookupError(f"Cannot resolve bundle {bundle_name}.")

            filtered_chunks = self.filter_chunks(chunks)

            for chunk in filtered_chunks:
                asset = assets["assets"].get(chunk)
                if asset is None:
                    raise FrontendBundleLookupError(f"Cannot resolve asset {chunk}.")

            return self.map_chunk_files_to_url(filtered_chunks)

        if assets.get("status") == "error":
            error = assets.get("error", "Unknown error")
            file_name = assets.get("file", "")
            message = assets.get("message", "")
            raise FrontendBundleError(f"{error} in {file_name}\n{message}")

        raise FrontendBundleLoaderBadStatsError(
            "The bundle stats file does not contain valid data. "
            "Run `npm run dev` or `npm run build:prod` to generate bundle-stats.json.",
        )
