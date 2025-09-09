"""
sudo su -
export $(cat /opt/elasticbeanstalk/deployment/env | xargs)
source /var/app/venv/*/bin/activate
DEBUG=true DEBUG_SQL=true python3 /var/app/current/manage.py shell
"""

import json
import time
import traceback

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import connection, reset_queries
from django.db.backends.utils import CursorDebugWrapper
from django.http import StreamingHttpResponse
from django.urls import resolve
from rest_framework.test import APIRequestFactory


def enable_capture_queries(executed_queries=[]):
    if not hasattr(CursorDebugWrapper, "_patched"):
        original_execute = CursorDebugWrapper.execute

        def traced_execute(self, sql, params=None):
            start_time = time.perf_counter()
            result = original_execute(self, sql, params)
            end_time = time.perf_counter()

            if not sql.strip().lower().startswith("explain"):
                try:
                    final_sql = self.db.ops.last_executed_query(self.cursor, sql, params)
                except Exception:
                    final_sql = sql
                stack = "".join(traceback.format_stack(limit=25))
                executed_queries.append(
                    {
                        "sql": final_sql,
                        "stack": stack,
                        "duration": end_time - start_time,
                    }
                )
            return result

        CursorDebugWrapper.execute = traced_execute
        CursorDebugWrapper._patched = True

    return executed_queries


def dump_executed_queries(executed_queries, threshold_duration=0.4, auto_explain=False, full_stack=False):
    for i, q in enumerate(executed_queries):
        if q["duration"] > threshold_duration:
            print(f"\n--- SQL #{i + 1} ---")
            print(f"Duration: {q['duration']:.3f}s")
            print(q["sql"])
            print("Traceback:")
            for line in q["stack"].splitlines():
                if full_stack:
                    print(line)
                elif (
                    "/var/app/current/" in line or "/opt/app/iaso" in line
                ) and "iaso/management/commands/explain_request.py" not in line:
                    # production or docker place for "our" code
                    print(line)

            if auto_explain and q["sql"].strip().lower().startswith("select"):
                try:
                    with connection.cursor() as cursor:
                        cursor.execute("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + q["sql"])
                        result = cursor.fetchone()[0]
                        parsed = json.loads(result) if isinstance(result, str) else result
                        print("Explain plan: (drop it in https://tatiyants.com/pev/)")
                        # don't pretty print so it's easier to paste in the explain plan app
                        print(json.dumps(parsed))
                except Exception as e:
                    print(f"EXPLAIN failed: {e}")


def is_content_type_textual(content_type: str) -> bool:
    if not content_type:
        return False

    textual_types = [
        "application/json",
        "application/xml",
        "application/javascript",
        "application/x-www-form-urlencoded",
    ]
    return content_type.startswith("text/") or content_type in textual_types


def consume_response(response):
    content_type = response.get("Content-Type", "")
    is_textual = is_content_type_textual(content_type)
    size_mb = -1
    # ensure we use the response or stream all the response to get the correct sql, duration and content
    if isinstance(response, StreamingHttpResponse):
        body = "".join(
            chunk.decode() if isinstance(chunk, bytes) else str(chunk) for chunk in response.streaming_content
        )
        size_mb = len(body) / 1024 / 1024
    else:
        size_mb = len(response.content) / 1024 / 1024
        if is_textual:
            body = response.content.decode()
        else:
            body = "binary content"

    return [size_mb, body, is_textual]


"""

adapt the entity_type_ids below

    docker compose exec iaso ./manage.py explain_request \
        --url-path="/api/entities/?order_columns=-last_saved_instance&search=a&entity_type_ids=2&limit=20&page=1&tab=list" \
        --username="testemailstable-2-40-8-2" --threshold-duration=0 --explain=true

adapt the form ids below

    simple json
        docker compose exec iaso ./manage.py explain_request  \
            --url-path="/api/forms/12/" \    
            --username="testemailstable-2-40-8-2" 
            --threshold-duration=0 --explain=true --print-response=true    

    streaming csv 

        docker compose exec iaso ./manage.py explain_request \
            --url-path="/api/instances/?form_ids=12&csv=true" \
            --username="testemailstable-2-40-8-2" \
            --threshold-duration=0 --explain=true --print-response=true
    
    xslx binary content

        docker compose exec iaso ./manage.py explain_request \
            --url-path="/api/instances/?form_ids=12&xlsx=true" \
            --username="testemailstable-2-40-8-2" --threshold-duration=0 --explain=true

    xml output
    
        docker compose exec iaso ./manage.py explain_request \
            --url-path="/api/forms/12/manifest/" \
            --username="testemailstable-2-40-8-2" \
            --threshold-duration=0 --explain=true --print-response=true

"""


class Command(BaseCommand):
    help = "test Get function and get main sqls and optionnaly explain plans"

    def add_arguments(self, parser):
        parser.add_argument(
            "--url-path",
            type=str,
            help="iaso url to 'get' ex: /api/entities/?order_columns=-last_saved_instance&search=a&entity_type_ids=2&limit=20&page=1&tab=list",
            required=False,
        )
        parser.add_argument("--username", type=str, help="user to use to call the api", required=False)
        parser.add_argument("--threshold-duration", type=float, help="threshold for logging the sql", default=0.4)

        parser.add_argument("--explain", type=bool, help="launch explain plan if sql is logged", default=True)
        parser.add_argument("--print-response", type=bool, help="print the response json/text", default=False)
        parser.add_argument("--full-stack", type=bool, help="print the full stack of originating sql", default=False)

    def log(self, *args):
        print(*args)

    def handle(self, *args, **options):
        username = options.get("username")
        url_path = options.get("url_path")
        threshold_duration = options.get("threshold_duration")
        auto_explain = options.get("explain")
        print_response = options.get("print_response")

        full_stack = options.get("full_stack")

        executed_queries = enable_capture_queries(executed_queries=[])

        User = get_user_model()
        user = User.objects.get(username=username)

        factory = APIRequestFactory()
        raw_request = factory.get(url_path)
        raw_request.user = user

        match = resolve(raw_request.path)
        view_func = match.func

        executed_queries.clear()
        reset_queries()
        start = time.perf_counter()
        # Make sure to pass path parameters like pk if url like /api/forms/12/
        response = view_func(raw_request, *match.args, **match.kwargs)
        # Force rendering if it's a DRF Response
        if hasattr(response, "render"):
            response.render()

        self.log(response)

        size_mb, body, is_textual = consume_response(response)

        duration = time.perf_counter() - start

        dump_executed_queries(
            executed_queries, threshold_duration=threshold_duration, auto_explain=auto_explain, full_stack=full_stack
        )
        self.log(f"Headers: {response.headers}")
        self.log(f"Status: {response.status_code}")

        if print_response:
            if is_textual:
                self.log("Body:\n", body)

        self.log(f"Response size: ({size_mb:.2f} MB)")

        self.log(f"Total request time: {duration:.3f}s with {len(executed_queries)} queries")
