import logging
from beanstalk_worker import task_decorator
import os
import json
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from datetime import datetime

logger = logging.getLogger(__name__)
# Can be queried from OpenHexa, but we'd need to use the hardcoded name ("lqas") anyway
PIPELINE_ID = "e5b9a3bb-a22c-461f-b000-4dfa8d1cc445"


@task_decorator(task_name="refresh_lqas_data")
def refresh_lqas_data(
    country_id=None,
    task=None,
):
    started_at = datetime.now()
    transport = RequestsHTTPTransport(
        url="https://api.openhexa.org/graphql/",
        verify=True,
        headers={"Authorization": f"Bearer {os.environ['OPENHEXA_API_1C9E_API_TOKEN']}"},
    )
    client = Client(transport=transport, fetch_schema_from_transport=True)
    get_runs = gql(
        """
    query pipeline {
        pipeline(id: $id){
            runs{
                items{
                    run_id
                    status
                    config
                }
            }
        }
    }
    """
    )
    latest_runs = client.execute(get_runs, variable_values={"id": PIPELINE_ID})
    active_runs = [
        run
        for run in latest_runs["runs"]["items"]
        if (run["status"] == "queued" or run["status"] == "success")
        and run.get("config", {}).get("country_id", None) == country_id
    ]
    if len(active_runs) > 0:
        logger.warning("Found active run for config")

    # Create task
    # Make API call
    # Set task status to ongoing
    # TODO get count of countries with config || send special message from pipeline when updating last config
    # TODO kill pipeline if task is killed

    finished_at = datetime.now()
    task_duration = (finished_at - started_at).total_seconds()
    # Report with result?
    task.report_success(f"Finished in {task_duration} seconds")
