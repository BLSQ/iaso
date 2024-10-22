import random


def associate_favorite_picture(iaso_client):
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/")["orgUnitTypes"]
    health_facility_type = [out for out in org_unit_types if out["name"] == "Health facility/Formation sanitaire - HF"][
        0
    ]
    orgunits = iaso_client.get(
        "/api/orgunits/",
        params={"limit": health_facility_type["units_count"], "orgUnitTypeId": health_facility_type["id"]},
    )["orgunits"]

    for orgunit in orgunits:
        org_unit_id = orgunit["id"]
        linked_pictures = iaso_client.get(
            "/api/instances/attachments/", params={"orgUnitId": org_unit_id, "image_only": True}
        )
        picture_ids = [picture["id"] for picture in linked_pictures]
        default_image = random.choice(picture_ids)
        favorite_image = {"default_image": default_image}
        iaso_client.patch(f"/api/orgunits/{org_unit_id}/", json=favorite_image)
