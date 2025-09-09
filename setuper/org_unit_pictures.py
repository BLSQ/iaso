import random


def associate_favorite_picture(iaso_client):
    org_unit_types = iaso_client.get("/api/v2/orgunittypes/?with_units_count=true")["orgUnitTypes"]

    for org_unit_type in org_unit_types:
        orgunits = iaso_client.get(
            "/api/orgunits/",
            params={"limit": org_unit_type["units_count"], "orgUnitTypeId": org_unit_type["id"]},
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
