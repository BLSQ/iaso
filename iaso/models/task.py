import traceback

from logging import getLogger
from typing import Optional

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from iaso.models import (
    ERRORED,
    KILLED,
    QUEUED,
    STATUS_TYPE_CHOICES,
    SUCCESS,
    Account,
    KilledException,
)


logger = getLogger(__name__)


class Task(models.Model):
    """Represents an asynchronous function that will be run by a background worker for things like a data import"""

    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    progress_value = models.IntegerField(default=0)
    end_value = models.IntegerField(default=0)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_tasks")
    launcher = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    result = models.JSONField(null=True, blank=True)
    status = models.CharField(choices=STATUS_TYPE_CHOICES, max_length=40, default=QUEUED)
    name = models.TextField()
    params = models.JSONField(null=True, blank=True)
    queue_answer = models.JSONField(null=True, blank=True)
    progress_message = models.TextField(null=True, blank=True)
    should_be_killed = models.BooleanField(default=False)
    external = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["name"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return "%s - %s - %s -%s" % (
            self.name,
            self.created_by,
            self.status,
            self.created_at,
        )

    def as_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "started_at": self.started_at.timestamp() if self.started_at else None,
            "ended_at": self.ended_at.timestamp() if self.ended_at else None,
            "params": self.params,
            "result": self.result,
            "status": self.status,
            "created_by": (
                self.created_by.iaso_profile.as_short_dict()
                if self.created_by and self.created_by.iaso_profile
                else None
            ),
            "launcher": (
                self.launcher.iaso_profile.as_short_dict() if self.launcher and self.launcher.iaso_profile else None
            ),
            "progress_value": self.progress_value,
            "end_value": self.end_value,
            "name": self.name,
            "queue_answer": self.queue_answer,
            "progress_message": self.progress_message,
            "should_be_killed": self.should_be_killed,
        }

    def stop_if_killed(self):
        self.refresh_from_db()
        if self.should_be_killed:
            logger.warning(f"Stopping Task {self} as it as been marked for kill")
            self.status = KILLED
            self.ended_at = timezone.now()
            self.result = {"result": KILLED, "message": "Killed"}
            self.save()

    def report_progress_and_stop_if_killed(
        self,
        progress_value: Optional[int] = None,
        progress_message: Optional[str] = None,
        end_value: Optional[int] = None,
        prepend_progress=False,
    ):
        """Save progress and check if we have been killed
        We use a separate transaction, so we can report the progress even from a transaction, see services.py
        """
        logger.info(f"Task {self} reported {progress_message}")
        self.refresh_from_db()
        if self.should_be_killed:
            self.stop_if_killed()
            raise KilledException("Killed by user")

        if progress_value:
            self.progress_value = progress_value
        if progress_message:
            if prepend_progress:
                self.progress_message = (
                    progress_message + "\n" + self.progress_message if self.progress_message else progress_message
                )
            else:
                self.progress_message = progress_message
        if end_value:
            self.end_value = end_value
        self.create_log_entry_if_needed(progress_message)
        self.save()

    def report_success_with_result(self, message: Optional[str] = None, result_data=None):
        logger.info(f"Task {self} reported success with message {message}")
        self.progress_message = message
        self.status = SUCCESS
        self.ended_at = timezone.now()
        self.result = {"result": SUCCESS, "data": result_data}
        self.create_log_entry_if_needed(message)
        self.save()

    def report_success(self, message: Optional[str] = None):
        logger.info(f"Task {self} reported success with message {message}")
        self.progress_message = message
        self.status = SUCCESS
        self.ended_at = timezone.now()
        self.result = {"result": SUCCESS, "message": message}
        self.create_log_entry_if_needed(message)
        self.save()

    def report_failure(self, e: Exception):
        self.status = ERRORED
        self.ended_at = timezone.now()
        self.result = {
            "result": ERRORED,
            "message": str(e),
            "stack_trace": traceback.format_exc(),
            "last_progress_message": self.progress_message,
        }
        self.progress_message = e.message if hasattr(e, "message") else str(e)
        # Extra debug info
        if hasattr(e, "extra"):
            self.result["extra"] = e.extra

        self.create_log_entry_if_needed(self.progress_message)
        self.save()

    def terminate_with_error(self, message: Optional[str] = None, exception=None):
        self.refresh_from_db()
        logger.error(f"Task {self} ended in error %s", message, exc_info=exception)
        self.status = ERRORED
        self.ended_at = timezone.now()
        self.result = {"result": ERRORED, "message": message if message else "Error"}
        self.create_log_entry_if_needed(message)
        self.save()

    def create_log_entry_if_needed(self, message: Optional[str]):
        if message:
            TaskLog.objects.create(task=self, message=message)


class TaskLog(models.Model):
    """Tasks are updated on progress/success/error to set `progress_message` but previous messages are lost.
    This is the history of all the received messages."""

    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    message = models.TextField(null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.id:
            raise ValueError("Cannot update a TaskLog")
        super().save(*args, **kwargs)
