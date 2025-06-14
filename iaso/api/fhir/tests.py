"""
Tests for FHIR Location API
"""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, DataSource, OrgUnit, OrgUnitType, Project, SourceVersion
from iaso.test import APITestCase


User = get_user_model()


class FHIRLocationAPITestCase(APITestCase):
    """
    Test case for FHIR Location API endpoints
    """

    @classmethod
    def setUpTestData(cls):
        # Create test account
        cls.account = Account.objects.create(name="Test Health System")

        # Create data source and version
        cls.data_source = DataSource.objects.create(name="Test Data Source")
        cls.source_version = SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account.default_version = cls.source_version
        cls.account.save()

        # Create project
        cls.project = Project.objects.create(name="Test Project", app_id="test.project", account=cls.account)

        # Create user with permissions
        cls.user = cls.create_user_with_profile(
            username="test_user", account=cls.account, permissions=["iaso_org_units"]
        )

        # Create org unit types
        cls.country_type = OrgUnitType.objects.create(name="Country", short_name="CTRY", depth=0, category="COUNTRY")
        cls.region_type = OrgUnitType.objects.create(name="Region", short_name="REG", depth=1, category="REGION")
        cls.district_type = OrgUnitType.objects.create(name="District", short_name="DIST", depth=2, category="DISTRICT")
        cls.hf_type = OrgUnitType.objects.create(name="Health Facility", short_name="HF", depth=3, category="HF")

        # Add org unit types to project
        cls.project.unit_types.add(cls.country_type, cls.region_type, cls.district_type, cls.hf_type)

        # Create org unit hierarchy
        cls.country = OrgUnit.objects.create(
            name="Test Country",
            org_unit_type=cls.country_type,
            version=cls.source_version,
            source_ref="CTRY001",
            uuid="country-uuid-123",
            validation_status=OrgUnit.VALIDATION_VALID,
            aliases=["TC", "TEST_COUNTRY"],
        )

        cls.region = OrgUnit.objects.create(
            name="Test Region",
            org_unit_type=cls.region_type,
            parent=cls.country,
            version=cls.source_version,
            source_ref="REG001",
            uuid="region-uuid-456",
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.district = OrgUnit.objects.create(
            name="Test District",
            org_unit_type=cls.district_type,
            parent=cls.region,
            version=cls.source_version,
            source_ref="DIST001",
            validation_status=OrgUnit.VALIDATION_NEW,
        )

        cls.health_facility = OrgUnit.objects.create(
            name="Test Health Facility",
            org_unit_type=cls.hf_type,
            parent=cls.district,
            version=cls.source_version,
            source_ref="HF001",
            validation_status=OrgUnit.VALIDATION_REJECTED,
        )

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def test_list_locations_returns_fhir_bundle(self):
        """Test that listing locations returns a proper FHIR Bundle"""
        url = reverse("fhir-location-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check FHIR Bundle structure
        self.assertEqual(data["resourceType"], "Bundle")
        self.assertEqual(data["type"], "searchset")
        self.assertIn("total", data)
        self.assertIn("entry", data)
        self.assertEqual(data["total"], 4)  # All 4 org units

        # Check first entry is a proper FHIR Location
        first_entry = data["entry"][0]
        self.assertIn("resource", first_entry)
        self.assertIn("fullUrl", first_entry)

        location = first_entry["resource"]
        self.assertEqual(location["resourceType"], "Location")
        self.assertIn("id", location)
        self.assertIn("name", location)
        self.assertIn("status", location)

    def test_retrieve_single_location(self):
        """Test retrieving a single location by ID"""
        url = reverse("fhir-location-detail", kwargs={"pk": self.country.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check FHIR Location structure
        self.assertEqual(data["resourceType"], "Location")
        self.assertEqual(data["id"], str(self.country.id))
        self.assertEqual(data["name"], self.country.name)
        self.assertEqual(data["status"], "active")  # VALIDATION_VALID -> active
        self.assertEqual(data["mode"], "instance")

        # Check identifiers
        self.assertIn("identifier", data)
        identifiers = data["identifier"]

        # Should have source_ref, uuid, and aliases
        source_ref_id = next((i for i in identifiers if i["use"] == "official"), None)
        self.assertIsNotNone(source_ref_id)
        self.assertEqual(source_ref_id["value"], "CTRY001")

        uuid_id = next((i for i in identifiers if "uuid" in i["system"]), None)
        self.assertIsNotNone(uuid_id)
        self.assertEqual(uuid_id["value"], "country-uuid-123")

        # Check aliases
        alias_ids = [i for i in identifiers if "alias" in i["system"]]
        self.assertEqual(len(alias_ids), 2)
        alias_values = [i["value"] for i in alias_ids]
        self.assertIn("TC", alias_values)
        self.assertIn("TEST_COUNTRY", alias_values)

    def test_retrieve_nonexistent_location_returns_operation_outcome(self):
        """Test that retrieving a non-existent location returns proper error"""
        url = reverse("fhir-location-detail", kwargs={"pk": 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        data = response.json()

        # Check OperationOutcome structure
        self.assertEqual(data["resourceType"], "OperationOutcome")
        self.assertIn("issue", data)
        self.assertEqual(len(data["issue"]), 1)

        issue = data["issue"][0]
        self.assertEqual(issue["severity"], "error")
        self.assertEqual(issue["code"], "not-found")

    def test_location_with_parent_has_part_of(self):
        """Test that a location with parent has partOf reference"""
        url = reverse("fhir-location-detail", kwargs={"pk": self.region.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check partOf reference
        self.assertIn("partOf", data)
        part_of = data["partOf"]
        self.assertEqual(part_of["reference"], f"Location/{self.country.id}")
        self.assertEqual(part_of["display"], self.country.name)

    def test_location_type_mapping(self):
        """Test that org unit types are properly mapped to FHIR types"""
        url = reverse("fhir-location-detail", kwargs={"pk": self.health_facility.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check type
        self.assertIn("type", data)
        location_type = data["type"][0]
        self.assertEqual(location_type["text"], "Health Facility")

        coding = location_type["coding"][0]
        self.assertEqual(coding["system"], "http://iaso.org/org-unit-type")
        self.assertEqual(coding["code"], "HF")
        self.assertEqual(coding["display"], "Health Facility")

        # Check physicalType for health facility
        self.assertIn("physicalType", data)
        physical_type = data["physicalType"]
        physical_coding = physical_type["coding"][0]
        self.assertEqual(physical_coding["code"], "bu")  # Building

    def test_validation_status_mapping(self):
        """Test that validation status is properly mapped to FHIR status"""
        test_cases = [
            (self.country, "active"),  # VALIDATION_VALID
            (self.district, "inactive"),  # VALIDATION_NEW
            (self.health_facility, "suspended"),  # VALIDATION_REJECTED
        ]

        for org_unit, expected_status in test_cases:
            url = reverse("fhir-location-detail", kwargs={"pk": org_unit.id})
            response = self.client.get(url)

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertEqual(data["status"], expected_status)

    def test_extensions_include_iaso_specific_data(self):
        """Test that extensions include Iaso-specific data"""
        url = reverse("fhir-location-detail", kwargs={"pk": self.region.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check extensions
        self.assertIn("extension", data)
        extensions = data["extension"]

        # Should have validation status extension
        validation_ext = next((e for e in extensions if "validation-status" in e["url"]), None)
        self.assertIsNotNone(validation_ext)
        self.assertEqual(validation_ext["valueCode"], OrgUnit.VALIDATION_VALID)

        # Should have depth extension
        depth_ext = next((e for e in extensions if "type-depth" in e["url"]), None)
        self.assertIsNotNone(depth_ext)
        self.assertEqual(depth_ext["valueInteger"], 1)

    def test_children_endpoint_returns_child_locations(self):
        """Test the children endpoint returns child locations"""
        url = reverse("fhir-location-children", kwargs={"pk": self.country.id})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check Bundle structure
        self.assertEqual(data["resourceType"], "Bundle")
        self.assertEqual(data["type"], "searchset")
        self.assertEqual(data["id"], f"children-{self.country.id}")
        self.assertEqual(data["total"], 1)  # Only region is direct child

        # Check the child is the region
        child_location = data["entry"][0]["resource"]
        self.assertEqual(child_location["id"], str(self.region.id))
        self.assertEqual(child_location["name"], self.region.name)

    def test_search_by_name(self):
        """Test searching locations by name"""
        url = reverse("fhir-location-list")
        response = self.client.get(url, {"name": "Health"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should find the health facility
        self.assertEqual(data["total"], 1)
        location = data["entry"][0]["resource"]
        self.assertEqual(location["name"], "Test Health Facility")

    def test_search_by_status(self):
        """Test searching locations by status"""
        url = reverse("fhir-location-list")
        response = self.client.get(url, {"status": "active"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should find 2 active locations (country and region)
        self.assertEqual(data["total"], 2)

    def test_pagination_with_fhir_parameters(self):
        """Test pagination using FHIR _count and _skip parameters"""
        url = reverse("fhir-location-list")
        response = self.client.get(url, {"_count": 2, "_skip": 1})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Should have 2 entries (from skip=1, count=2)
        # Since we have 4 total and skip 1, we should get entries 2-3 (2 entries)
        self.assertLessEqual(len(data["entry"]), 2)  # At most 2 entries
        self.assertEqual(data["total"], 4)  # Total count unchanged

        # Check pagination links
        self.assertIn("link", data)
        links = data["link"]

        # Should have self link
        self_link = next((l for l in links if l["relation"] == "self"), None)
        self.assertIsNotNone(self_link)

        # Should have previous link since we're not at the start
        prev_link = next((l for l in links if l["relation"] == "previous"), None)
        self.assertIsNotNone(prev_link)

    def test_metadata_endpoint_returns_capability_statement(self):
        """Test metadata endpoint returns proper CapabilityStatement"""
        url = reverse("fhir-location-metadata")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Check CapabilityStatement structure
        self.assertEqual(data["resourceType"], "CapabilityStatement")
        self.assertEqual(data["status"], "active")
        self.assertEqual(data["publisher"], "Iaso")
        self.assertEqual(data["fhirVersion"], "4.0.1")

        # Check resource capabilities
        self.assertIn("rest", data)
        rest = data["rest"][0]
        self.assertEqual(rest["mode"], "server")

        location_resource = rest["resource"][0]
        self.assertEqual(location_resource["type"], "Location")

        # Check supported interactions
        interactions = [i["code"] for i in location_resource["interaction"]]
        self.assertIn("read", interactions)
        self.assertIn("search-type", interactions)

    def test_unauthorized_access_forbidden(self):
        """Test that unauthorized access is forbidden"""
        self.client.force_authenticate(user=None)

        url = reverse("fhir-location-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_permission_forbidden(self):
        """Test that user without org_units permission is forbidden"""
        # Create user without permissions
        user_no_perm = self.create_user_with_profile(username="no_perm_user", account=self.account, permissions=[])

        self.client.force_authenticate(user=user_no_perm)

        url = reverse("fhir-location-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
