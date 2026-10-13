#!/usr/bin/env python3
"""Merge plugin cron.yaml files into the root cron.yaml Elastic Beanstalk reads.

sqsd loads /var/app/current/cron.yaml. Plugin schedules live in
plugins/<name>/cron.yaml and are appended for each name in PLUGINS.
"""

import argparse
import os
from pathlib import Path


def _unquote(value):
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def parse_cron_jobs(text):
    jobs = []
    current = None
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped in {"version: 1", "cron:", "cron: []"}:
            continue
        if stripped.startswith("- name:"):
            if current:
                jobs.append(current)
            current = {"name": _unquote(stripped.split(":", 1)[1])}
            continue
        if current is None:
            continue
        for key in ("url", "schedule"):
            prefix = f"{key}:"
            if stripped.startswith(prefix):
                current[key] = _unquote(stripped.split(":", 1)[1])
    if current:
        jobs.append(current)
    return [job for job in jobs if job.get("name") and job.get("url") and job.get("schedule")]


def render_cron(jobs):
    lines = ["version: 1", "cron:"]
    for job in jobs:
        lines.append(f"    - name: '{job['name']}'")
        lines.append(f"      url: '{job['url']}'")
        lines.append(f"      schedule: '{job['schedule']}'")
    lines.append("")
    return "\n".join(lines)


def merge_plugin_cron(root_text, plugins_dir, plugin_names):
    jobs = parse_cron_jobs(root_text)
    seen = {job["name"] for job in jobs}
    for plugin_name in plugin_names:
        plugin_name = plugin_name.strip()
        if not plugin_name:
            continue
        cron_file = Path(plugins_dir) / plugin_name / "cron.yaml"
        if not cron_file.is_file():
            continue
        for job in parse_cron_jobs(cron_file.read_text()):
            if job["name"] in seen:
                continue
            jobs.append(job)
            seen.add(job["name"])
    return render_cron(jobs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="cron.yaml")
    parser.add_argument("--plugins-dir", default="plugins")
    parser.add_argument("--plugins", default=os.environ.get("PLUGINS", ""))
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()

    root_path = Path(args.root)
    merged = merge_plugin_cron(root_path.read_text(), args.plugins_dir, args.plugins.split(","))
    if args.write:
        root_path.write_text(merged)
    else:
        print(merged, end="")


if __name__ == "__main__":
    main()
