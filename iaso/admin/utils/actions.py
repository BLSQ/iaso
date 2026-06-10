from django.contrib import admin, messages
from django.db import connection, transaction

from iaso.management.commands import unique_indexes


@admin.action(description="Create DB indexes (CONCURRENTLY)")
def create_indexes_action(modeladmin, request, queryset):
    previous = transaction.get_autocommit()
    try:
        transaction.set_autocommit(True)
        with connection.cursor() as cursor:
            for index in unique_indexes.INDEXES:
                index.apply(cursor)
        messages.success(request, "Indexes created (or already existed).")
    except Exception as e:
        messages.error(request, f"Error creating indexes: {e}")
    finally:
        transaction.set_autocommit(previous)
