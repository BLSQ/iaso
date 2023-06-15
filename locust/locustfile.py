import os

from locust import HttpUser, task, between, events
import uuid, random, shutil

DEFAULT_APP_ID = "com.bluesquarehub.iaso"


@events.init_command_line_parser.add_listener
def _(parser):
    parser.add_argument("--app-id", type=str, default=DEFAULT_APP_ID)
    parser.add_argument("--username", type=str, default="", help="Username to use for login")
    parser.add_argument("--password", type=str, is_secret=True, default="", help="Password to use for login")
    parser.add_argument(
        "--min-instances", type=int, default="1", help="Minimum number of instances to send during the upload"
    )
    parser.add_argument(
        "--max-instances", type=int, default="10", help="Maximum number of instances to send during the upload"
    )


class IasoUser(HttpUser):
    wait_time = between(1, 3)

    @task(1)
    def download(self):
        app_id = self.environment.parsed_options.app_id
        self.client.get(f"/api/apps/{app_id}/")
        self.client.get(f"/api/orgunittypes/?app_id={app_id}")
        self.client.get(
            f"/api/mobile/forms/?app_id={app_id}&fields=id,name,form_id,org_unit_types,period_type,single_per_period,"
            f"periods_before_allowed,periods_after_allowed,latest_form_version,label_keys,possible_fields,"
            f"predefined_filters,has_attachments,created_at,updated_at"
        )
        self.client.get(
            f"/api/formversions/?app_id={app_id}&fields=id,version_id,form_id,form_name,full_name,file,mapped,"
            f"start_period,end_period,mapping_versions,descriptor,created_at,updated_at"
        )
        self.download_org_units(page=1, app_id=app_id)
        self.client.get(f"/api/mobile/plannings/?app_id={app_id}")
        self.client.get(f"/api/mobile/storage/passwords/?app_id={app_id}")
        self.client.get(f"/api/mobile/entitytypes/?app_id={app_id}")
        self.download_entities(page=1, app_id=app_id)
        self.client.get(f"/api/mobile/reports/?app_id={app_id}")
        self.client.get(f"/api/mobile/storage/blacklisted/?app_id={app_id}")
        self.client.get(f"/api/mobile/workflows/?app_id={app_id}")

    def download_org_units(self, page, app_id):
        with self.client.get(f"/api/mobile/orgunits/?app_id={app_id}&limit=25000&page={page}") as response:
            if response.json()["has_next"]:
                self.download_org_unit(page + 1)

    def download_entities(self, page, app_id):
        with self.client.get(f"/api/mobile/entities/?app_id={app_id}&page={page}") as response:
            if response.json()["has_next"]:
                self.download_org_unit(page + 1)

    @task(9)
    def upload(self):
        app_id = self.environment.parsed_options.app_id
        self.client.post(
            url=f"/api/mobile/orgunits/?app_id={app_id}",
            headers={"Content-Type": "application/json; charset=utf-8"},
            json=[
                {
                    "id": "fake",
                    "name": "Fake OU",
                    "org_unit_type_id": 1,
                    "time": 0,
                    "created_at": 123.0,
                    "updated_at": 123.0,
                }
            ],
        )
        min_instances = self.environment.parsed_options.min_instances
        max_instances = self.environment.parsed_options.max_instances
        for i in range(random.randint(min_instances, max_instances)):
            self.post_instance(app_id)

    def post_instance(self, app_id):
        _id = uuid.uuid4()
        self.client.post(
            url=f"/api/instances/?app_id={app_id}",
            headers={"Content-Type": "application/json; charset=utf-8"},
            json=[
                {
                    "id": f"fake_{_id}",
                    "name": "Fake Instance",
                    "file": f"{_id}.xml",
                    "formId": "1",
                    "orgUnitId": "1",
                    "created_at": 123.0,
                    "updated_at": 123.0,
                }
            ],
        )
        self.client.head(
            url="/sync/form_upload/",
            headers={
                "Accept-Encoding": "gzip,deflate",
                "X-OpenRosa-Version": "1.0",
            },
        )
        shutil.copy("instance.xml", f"{_id}.xml")
        with open(f"{_id}.xml", "rb") as file:
            self.client.post(
                url="/sync/form_upload/",
                headers={
                    "Accept-Encoding": "gzip,deflate",
                    "X-OpenRosa-Version": "1.0",
                },
                file={"xml_submission_file": file},
            )
        os.remove(f"{_id}.xml")

    def on_start(self):
        username = self.environment.parsed_options.username
        password = self.environment.parsed_options.password
        if username and username != "" and password and password != "":
            with self.client.post("/api/token/", json={"username": "foo", "password": "bar"}) as response:
                if response.status_code == 200:
                    token = response.json()["access"]
                    self.client.headers = {"Authorization": f"Bearer {token}"}
