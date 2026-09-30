"""Static data layers: point datasets pre-generated as vector tiles with tippecanoe.

A layer is a GeoJSON FeatureCollection turned into a single PMTiles archive, stored with the default storage
(S3 in production, MEDIA_ROOT locally) next to a small JSON sidecar describing it:

    static_data_layers/<account_id>/<layer_id>.pmtiles
    static_data_layers/<account_id>/<layer_id>.json

PMTiles is read by the browser with HTTP range requests, so the storage must honour `Range` (S3 does, the local
dev server goes through `serve_static_data_layer`) and must not gzip the archive on upload.
"""

import json
import logging
import os
import shutil
import subprocess
import tempfile
import uuid

from django.core.files import File
from django.core.files.storage import default_storage
from django.utils import timezone
from django.utils.text import slugify


logger = logging.getLogger(__name__)

STORAGE_PREFIX = "static_data_layers"
# Name of the layer inside the tiles, the `source-layer` for MapLibre
SOURCE_LAYER = "points"
MAX_ZOOM = 14
# Points closer than this many pixels are merged at low zooms (tippecanoe adds `point_count` to the result)
CLUSTER_DISTANCE_PX = 10


def account_prefix(account_id: int) -> str:
    return f"{STORAGE_PREFIX}/{account_id}"


def new_layer_id(title: str) -> str:
    return f"{slugify(title)[:40] or 'layer'}-{uuid.uuid4().hex[:8]}"


def build_static_data_layer(
    feature_collection: dict,
    title: str,
    account_id: int,
    description: str = "",
    created_by: str = None,
    task_id: int = None,
) -> dict:
    """Run tippecanoe on the point features and store the archive and its metadata. Returns the metadata."""
    tippecanoe = shutil.which("tippecanoe")
    if not tippecanoe:
        raise RuntimeError("tippecanoe is not installed on this worker")

    features = [f for f in feature_collection.get("features", []) if _is_point(f)]
    if not features:
        raise ValueError("No point features to put in the layer")

    layer_id = new_layer_id(title)
    prefix = account_prefix(account_id)
    with tempfile.TemporaryDirectory() as tmp_dir:
        geojson_path = os.path.join(tmp_dir, "input.geojson")
        pmtiles_path = os.path.join(tmp_dir, "layer.pmtiles")
        with open(geojson_path, "w") as f:
            json.dump({"type": "FeatureCollection", "features": features}, f)

        command = [
            tippecanoe,
            "--output",
            pmtiles_path,
            "--layer",
            SOURCE_LAYER,
            "--name",
            title,
            "--description",
            description,
            "--minimum-zoom=0",
            f"--maximum-zoom={MAX_ZOOM}",
            # Never drop points to save space: every case must be visible, clustering takes care of density
            "--drop-rate=1",
            f"--cluster-distance={CLUSTER_DISTANCE_PX}",
            f"--cluster-maxzoom={MAX_ZOOM - 1}",
            "--no-feature-limit",
            "--no-tile-size-limit",
            "--force",
            "--quiet",
            geojson_path,
        ]
        logger.info("Running %s", " ".join(command))
        completed = subprocess.run(command, capture_output=True, text=True, check=False)
        if completed.returncode != 0:
            raise RuntimeError(f"tippecanoe failed ({completed.returncode}): {completed.stderr.strip()}")

        pmtiles_name = f"{prefix}/{layer_id}.pmtiles"
        with open(pmtiles_path, "rb") as f:
            stored_name = default_storage.save(pmtiles_name, File(f))
        size = os.path.getsize(pmtiles_path)

    metadata = {
        "id": layer_id,
        "title": title,
        "description": description,
        "account_id": account_id,
        "created_at": timezone.now().isoformat(),
        "created_by": created_by,
        "task_id": task_id,
        "feature_count": len(features),
        "bounds": _bounds(features),
        "attributes": sorted({key for f in features for key in (f.get("properties") or {})}),
        "source_layer": SOURCE_LAYER,
        "max_zoom": MAX_ZOOM,
        "pmtiles_path": stored_name,
        "size": size,
    }
    default_storage.save(f"{prefix}/{layer_id}.json", _json_file(metadata))
    return metadata


def list_static_data_layers(account_id: int) -> list:
    """Metadata of the account's layers, newest first, with a `url` to fetch the archive from."""
    prefix = account_prefix(account_id)
    try:
        _dirs, files = default_storage.listdir(prefix)
    except FileNotFoundError:
        return []
    layers = []
    for name in files:
        if not name.endswith(".json"):
            continue
        try:
            with default_storage.open(f"{prefix}/{name}") as f:
                metadata = json.load(f)
        except (OSError, ValueError):
            logger.exception("Unreadable static data layer metadata %s/%s", prefix, name)
            continue
        metadata["url"] = default_storage.url(metadata["pmtiles_path"])
        layers.append(metadata)
    return sorted(layers, key=lambda layer: layer["created_at"], reverse=True)


def _is_point(feature: dict) -> bool:
    geometry = feature.get("geometry") or {}
    return geometry.get("type") == "Point" and len(geometry.get("coordinates") or []) >= 2


def _bounds(features: list) -> list:
    xs = [f["geometry"]["coordinates"][0] for f in features]
    ys = [f["geometry"]["coordinates"][1] for f in features]
    return [min(xs), min(ys), max(xs), max(ys)]


def _json_file(data: dict) -> File:
    tmp = tempfile.SpooledTemporaryFile()
    tmp.write(json.dumps(data, indent=2).encode())
    tmp.seek(0)
    return File(tmp)
