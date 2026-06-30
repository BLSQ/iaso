import os
import re
import subprocess
import sys

import boto3  # type: ignore


def eb_deploy(env_name, version_name):
    print("Deploying to", env_name, flush=True)
    return subprocess.check_call(["eb", "deploy", env_name, "--staged", "-l", version_name])
    # for Action debugging: print(f"eb deploy {env_name}")


if __name__ == "__main__":
    # Connect to aws to get the list of environment linked to the application
    client = boto3.client("elasticbeanstalk")
    desc = client.describe_environments(ApplicationName="Iaso")
    eb_envs = {x["EnvironmentName"]: x for x in desc["Environments"]}

    if "VERSION_NAME" not in os.environ:
        exit("Mission VERSION environment variable")
    version = os.environ["VERSION_NAME"]

    requested_env_name = sys.argv[1].lower()
    requested_platform = sys.argv[2].lower()

    # # If the argument correspond to one of the env, deploy to it
    if requested_env_name in [x.lower() for x in eb_envs.keys()]:
        env_details = eb_envs[requested_env_name]
        m = re.search(r"Python|Docker", env_details["PlatformArn"])
        if not m:
            exit(f"Platform could not be retrieved for {requested_env_name}")
        platform = m.group().lower()
        if platform != requested_platform:
            exit(
                f"Platform mismatch on {requested_env_name}: the platform is running {platform}, you passed {requested_platform}"
            )
        exit(eb_deploy(requested_env_name, version_name=version))

    # otherwise consider it's a tag and update all the environment with the same `env` tag
    tag_envs = {}
    target_envs = []
    for env_name, env_details in eb_envs.items():
        if env_details["Status"] not in ("Ready", "Updating"):
            print("Env {} ({}) is not ready for deploy, skipping".format(env_name, env_details["Status"]))
            continue
        raw_tags = client.list_tags_for_resource(ResourceArn=env_details["EnvironmentArn"])

        m = re.search(r"Python|Docker", env_details["PlatformArn"])
        if not m:
            exit(f"Platform could not be retrieved for {requested_env_name}")
        platform = m.group().lower()

        tags = {x["Key"]: x["Value"] for x in raw_tags.get("ResourceTags")}
        tag_envs[env_name] = tags
        if "env" in tags and tags["env"].lower() == requested_env_name:
            if platform != requested_platform:
                print(
                    f"Platform mismatch on {requested_env_name}: the platform is running {platform}, you passed {requested_platform}"
                )
                continue
            print(f"{env_name} is a {platform} based environment")
            target_envs.append(env_name)

    if len(target_envs) == 0:
        exit(f"No target env found for {requested_env_name}")
    else:
        print(f"Will deploy to environments: {', '.join(target_envs)}")
        for e in target_envs:
            r = eb_deploy(e, version_name=version)
