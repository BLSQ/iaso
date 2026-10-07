"""Admin page editing the `task_throttles` Config (see beanstalk_worker/throttle.py) through a validated form,
instead of editing its JSON by hand."""

import json

from collections import Counter
from typing import Dict, List, Optional, Sequence, Tuple

from django import forms
from django.db.models import Count
from django.utils import timezone

from beanstalk_worker.services import LOST_AFTER
from beanstalk_worker.throttle import Concurrency, Throttle
from iaso.models import QUEUED, Task, TaskLease


MODE_CODE = "code"
MODE_LIMIT = "limit"
MODE_UNLIMITED = "unlimited"
_MISSING = object()

KEYS_HELP_TEXT = "Overrides for some keys, one per line: <code>42 = 4</code> or <code>17 = unlimited</code>."


def config_version(config) -> str:
    """Identifies the saved version of the Config, to detect when two people edit it at the same time."""
    return config.updated_at.isoformat() if config else ""


def code_limit_label(concurrency: Concurrency) -> str:
    if callable(concurrency.limit):
        return "computed by the code"
    return "unlimited" if concurrency.limit is None else str(concurrency.limit)


def parse_key_overrides(text: str) -> Dict[str, Optional[int]]:
    overrides = {}
    for number, line in enumerate(text.splitlines(), start=1):
        line = line.strip()
        if not line:
            continue
        key, separator, value = line.partition("=")
        key, value = key.strip(), value.strip().lower()
        if not separator or not key or not value:
            raise forms.ValidationError(f"Line {number}: expected `key = limit`, got `{line}`")
        if key in overrides:
            raise forms.ValidationError(f"Line {number}: `{key}` is already defined")
        if value in (MODE_UNLIMITED, "null"):
            overrides[key] = None
        elif value.isdigit() and int(value) >= 1:
            overrides[key] = int(value)
        else:
            raise forms.ValidationError(f"Line {number}: the limit must be a number >= 1 or `unlimited`, got `{value}`")
    return overrides


def format_key_overrides(overrides: Dict[str, Optional[int]]) -> str:
    return "\n".join(f"{key} = {MODE_UNLIMITED if limit is None else limit}" for key, limit in overrides.items())


def _is_limit(value) -> bool:
    return value is None or (isinstance(value, int) and not isinstance(value, bool) and value >= 1)


class TaskThrottlesForm(forms.Form):
    version = forms.CharField(widget=forms.HiddenInput, required=False)
    tasks = forms.CharField(widget=forms.HiddenInput, required=False)

    def __init__(self, *args, throttled_tasks: Sequence[Tuple[str, Throttle]], content, **kwargs):
        super().__init__(*args, **kwargs)
        self.throttled_tasks = throttled_tasks
        self.content = content if isinstance(content, dict) else {}
        # values of the saved config this form can't represent: they are replaced when saving
        self.invalid_values: List[str] = [] if isinstance(content, dict) or content is None else [repr(content)]

        for t, (task_name, throttle) in enumerate(throttled_tasks):
            entry = self.content.get(task_name, {})
            if not isinstance(entry, dict):
                self.invalid_values.append(f"{task_name}: {entry!r}")
                entry = {}
            self.fields[f"t{t}_paused"] = forms.BooleanField(
                required=False, initial=entry.get("paused") is True, label="Paused"
            )
            for c, concurrency in enumerate(throttle.concurrency):
                self._add_concurrency_fields(
                    f"t{t}_c{c}", task_name, concurrency, entry.get(concurrency.name, _MISSING)
                )

    def _add_concurrency_fields(self, prefix, task_name, concurrency, configured):
        default, overrides = configured, {}
        if isinstance(configured, dict):
            default, overrides = configured.get("default", _MISSING), configured.get("keys", {})
            if not isinstance(overrides, dict) or not all(_is_limit(v) for v in overrides.values()):
                self.invalid_values.append(f"{task_name}.{concurrency.name}.keys: {overrides!r}")
                overrides = {}

        mode, limit = MODE_CODE, None
        if default is None:
            mode = MODE_UNLIMITED
        elif _is_limit(default):
            mode, limit = MODE_LIMIT, default
        elif default is not _MISSING:
            self.invalid_values.append(f"{task_name}.{concurrency.name}: {default!r}")

        self.fields[f"{prefix}_mode"] = forms.ChoiceField(
            choices=[
                (MODE_CODE, f"Default of the code ({code_limit_label(concurrency)})"),
                (MODE_LIMIT, "Limit to"),
                (MODE_UNLIMITED, "Unlimited"),
            ],
            initial=mode,
            label=concurrency.name,
        )
        self.fields[f"{prefix}_limit"] = forms.IntegerField(required=False, min_value=1, initial=limit, label="Limit")
        if concurrency.key:
            self.fields[f"{prefix}_keys"] = forms.CharField(
                required=False,
                initial=format_key_overrides(overrides),
                widget=forms.Textarea(attrs={"rows": 3, "cols": 30}),
                help_text=KEYS_HELP_TEXT,
                label="Per key",
            )

    def sections(self, running: Counter, queued: Dict[str, int], code_throttles: Dict[str, Optional[Throttle]]):
        """What the template displays for each task: its bound fields and the current usage of its slots."""
        for t, (task_name, throttle) in enumerate(self.throttled_tasks):
            limits = []
            for c, concurrency in enumerate(throttle.concurrency):
                prefix, key_prefix = f"t{t}_c{c}", f"{task_name}:{concurrency.name}"
                if concurrency.key:
                    usage = {k[len(key_prefix) + 1 :]: n for k, n in running.items() if k.startswith(f"{key_prefix}:")}
                    running_label = ", ".join(f"{key}: {n}" for key, n in sorted(usage.items())) or "0"
                else:
                    running_label = str(running.get(key_prefix, 0))
                limits.append(
                    {
                        "name": concurrency.name,
                        "keyed": concurrency.key is not None,
                        "running": running_label,
                        "mode": self[f"{prefix}_mode"],
                        "limit": self[f"{prefix}_limit"],
                        "keys": self[f"{prefix}_keys"] if concurrency.key else None,
                    }
                )
            yield {
                "name": task_name,
                "paused": self[f"t{t}_paused"],
                "queued": queued.get(task_name, 0),
                "limits": limits,
                "in_code": code_throttles.get(task_name) is not None,
            }

    def clean(self):
        cleaned_data = super().clean()
        new_content = {name: entry for name, entry in self.content.items() if name not in dict(self.throttled_tasks)}
        for t, (task_name, throttle) in enumerate(self.throttled_tasks):
            entry = {}
            if cleaned_data.get(f"t{t}_paused"):
                entry["paused"] = True
            for c, concurrency in enumerate(throttle.concurrency):
                value = self._clean_concurrency(f"t{t}_c{c}", concurrency, cleaned_data)
                if value is not _MISSING:
                    entry[concurrency.name] = value
            if entry:
                new_content[task_name] = entry
        cleaned_data["content"] = new_content
        return cleaned_data

    def _clean_concurrency(self, prefix, concurrency, cleaned_data):
        mode, limit = cleaned_data.get(f"{prefix}_mode"), cleaned_data.get(f"{prefix}_limit")
        default = _MISSING
        if mode == MODE_UNLIMITED:
            default = None
        elif mode == MODE_LIMIT:
            if limit is None and f"{prefix}_limit" not in self.errors:
                self.add_error(f"{prefix}_limit", "Enter the limit.")
            default = limit

        overrides = {}
        if concurrency.key:
            try:
                overrides = parse_key_overrides(cleaned_data.get(f"{prefix}_keys") or "")
            except forms.ValidationError as e:
                self.add_error(f"{prefix}_keys", e)
        if overrides:
            return {"keys": overrides} if default is _MISSING else {"default": default, "keys": overrides}
        return default


def running_throttle_keys(db="default") -> Counter:
    """How many live runs occupy each throttle key."""
    counts = Counter()
    alive = TaskLease.objects.using(db).filter(heartbeat_at__gte=timezone.now() - LOST_AFTER)
    for keys in alive.values_list("throttle_keys", flat=True):
        counts.update(keys)
    return counts


def queued_counts(task_names) -> Dict[str, int]:
    return dict(
        Task.objects.filter(name__in=task_names, status=QUEUED)
        .order_by()
        .values("name")
        .annotate(n=Count("id"))
        .values_list("name", "n")
    )


def describe_content(content) -> str:
    return json.dumps(content, indent=2, sort_keys=True)
