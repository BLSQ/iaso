"""
FHIR Location API Usage Examples

This file contains example code showing how to use the FHIR Location API
both as a client and for testing purposes.
"""

from typing import Dict, List, Optional

import requests


class FHIRLocationClient:
    """
    Example client for the FHIR Location API
    """

    def __init__(self, base_url: str, auth_token: str):
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/fhir+json",
            "Accept": "application/fhir+json",
        }

    def get_all_locations(self, count: int = 20, skip: int = 0) -> Dict:
        """
        Get all locations with pagination

        Args:
            count: Number of results per page (max 100)
            skip: Number of results to skip

        Returns:
            FHIR Bundle containing Location resources
        """
        url = f"{self.base_url}/fhir/Location/"
        params = {"_count": count, "_skip": skip}

        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def get_location(self, location_id: str) -> Dict:
        """
        Get a specific location by ID

        Args:
            location_id: The location ID

        Returns:
            FHIR Location resource
        """
        url = f"{self.base_url}/fhir/Location/{location_id}/"

        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def search_locations_by_name(self, name: str) -> Dict:
        """
        Search locations by name

        Args:
            name: Name to search for (case-insensitive)

        Returns:
            FHIR Bundle containing matching Location resources
        """
        url = f"{self.base_url}/fhir/Location/"
        params = {"name": name}

        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def search_locations_by_status(self, status: str) -> Dict:
        """
        Search locations by status

        Args:
            status: Status to filter by (active|suspended|inactive)

        Returns:
            FHIR Bundle containing matching Location resources
        """
        url = f"{self.base_url}/fhir/Location/"
        params = {"status": status}

        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def search_locations_by_identifier(self, identifier: str) -> Dict:
        """
        Search locations by any identifier (source_ref, uuid, alias)

        Args:
            identifier: Identifier value to search for

        Returns:
            FHIR Bundle containing matching Location resources
        """
        url = f"{self.base_url}/fhir/Location/"
        params = {"identifier": identifier}

        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def get_child_locations(self, parent_id: str) -> Dict:
        """
        Get child locations of a specific location

        Args:
            parent_id: The parent location ID

        Returns:
            FHIR Bundle containing child Location resources
        """
        url = f"{self.base_url}/fhir/Location/{parent_id}/children/"

        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def get_capability_statement(self) -> Dict:
        """
        Get the FHIR CapabilityStatement for the Location API

        Returns:
            FHIR CapabilityStatement resource
        """
        url = f"{self.base_url}/fhir/Location/metadata/"

        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()


def example_usage():
    """
    Example usage of the FHIR Location API client
    """

    # Initialize client
    client = FHIRLocationClient(base_url="https://your-iaso-instance.com", auth_token="your-auth-token")

    try:
        # Get all locations (first page)
        print("=== Getting all locations ===")
        bundle = client.get_all_locations(count=10)
        print(f"Found {bundle['total']} total locations")

        if bundle["entry"]:
            first_location = bundle["entry"][0]["resource"]
            print(f"First location: {first_location['name']} (ID: {first_location['id']})")

            # Get specific location details
            print("\n=== Getting location details ===")
            location = client.get_location(first_location["id"])
            print(f"Location: {location['name']}")
            print(f"Status: {location['status']}")
            if "position" in location:
                pos = location["position"]
                print(f"Coordinates: {pos['latitude']}, {pos['longitude']}")

            # Get child locations
            print("\n=== Getting child locations ===")
            children = client.get_child_locations(first_location["id"])
            print(f"Found {children['total']} child locations")

        # Search examples
        print("\n=== Search examples ===")

        # Search by name
        hospitals = client.search_locations_by_name("hospital")
        print(f"Found {hospitals['total']} locations with 'hospital' in name")

        # Search by status
        active_locations = client.search_locations_by_status("active")
        print(f"Found {active_locations['total']} active locations")

        # Get capability statement
        print("\n=== API Capabilities ===")
        capability = client.get_capability_statement()
        software = capability["software"]
        print(f"API: {software['name']} v{software['version']}")
        print(f"FHIR Version: {capability['fhirVersion']}")

    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
    except KeyError as e:
        print(f"Unexpected response format: {e}")


def extract_location_hierarchy(bundle: Dict) -> List[Dict]:
    """
    Extract and organize location hierarchy from a FHIR Bundle

    Args:
        bundle: FHIR Bundle containing Location resources

    Returns:
        List of location dictionaries with hierarchy information
    """
    locations = []

    for entry in bundle.get("entry", []):
        location = entry["resource"]

        # Extract basic information
        loc_info = {
            "id": location["id"],
            "name": location["name"],
            "status": location["status"],
            "type": None,
            "parent_id": None,
            "coordinates": None,
            "identifiers": [],
        }

        # Extract type
        if "type" in location and location["type"]:
            type_info = location["type"][0]
            if "coding" in type_info and type_info["coding"]:
                loc_info["type"] = type_info["coding"][0]["display"]

        # Extract parent reference
        if "partOf" in location:
            part_of = location["partOf"]["reference"]
            if part_of.startswith("Location/"):
                loc_info["parent_id"] = part_of.replace("Location/", "")

        # Extract coordinates
        if "position" in location:
            pos = location["position"]
            loc_info["coordinates"] = {
                "latitude": pos["latitude"],
                "longitude": pos["longitude"],
                "altitude": pos.get("altitude"),
            }

        # Extract identifiers
        for identifier in location.get("identifier", []):
            loc_info["identifiers"].append(
                {
                    "system": identifier["system"],
                    "value": identifier["value"],
                    "use": identifier.get("use", "secondary"),
                }
            )

        locations.append(loc_info)

    return locations


def print_location_tree(locations: List[Dict], parent_id: Optional[str] = None, indent: int = 0):
    """
    Print locations in a tree structure

    Args:
        locations: List of location dictionaries
        parent_id: Parent ID to filter by (None for root)
        indent: Current indentation level
    """
    # Find locations with the specified parent
    children = [loc for loc in locations if loc["parent_id"] == parent_id]

    for location in children:
        # Print current location
        prefix = "  " * indent + "- "
        type_info = f" ({location['type']})" if location["type"] else ""
        status_info = f" [{location['status']}]"
        print(f"{prefix}{location['name']}{type_info}{status_info}")

        # Print coordinates if available
        if location["coordinates"]:
            coords = location["coordinates"]
            coord_prefix = "  " * (indent + 1) + "📍 "
            print(f"{coord_prefix}Lat: {coords['latitude']}, Lon: {coords['longitude']}")

        # Print identifiers
        for identifier in location["identifiers"]:
            if identifier["use"] == "official":
                id_prefix = "  " * (indent + 1) + "🆔 "
                print(f"{id_prefix}{identifier['value']}")

        # Recursively print children
        print_location_tree(locations, location["id"], indent + 1)


if __name__ == "__main__":
    # Run example usage
    example_usage()

    # Example of processing a bundle response
    print("\n" + "=" * 50)
    print("Example: Processing location hierarchy")
    print("=" * 50)

    # This would typically come from the API
    example_bundle = {
        "resourceType": "Bundle",
        "total": 3,
        "entry": [
            {
                "resource": {
                    "resourceType": "Location",
                    "id": "1",
                    "name": "Test Country",
                    "status": "active",
                    "type": [{"coding": [{"display": "Country"}]}],
                    "identifier": [{"system": "http://openiaso.com/source-ref", "value": "CTRY001", "use": "official"}],
                }
            },
            {
                "resource": {
                    "resourceType": "Location",
                    "id": "2",
                    "name": "Test Region",
                    "status": "active",
                    "type": [{"coding": [{"display": "Region"}]}],
                    "partOf": {"reference": "Location/1"},
                    "position": {"latitude": 12.345, "longitude": -1.567},
                }
            },
            {
                "resource": {
                    "resourceType": "Location",
                    "id": "3",
                    "name": "Test Hospital",
                    "status": "active",
                    "type": [{"coding": [{"display": "Health Facility"}]}],
                    "partOf": {"reference": "Location/2"},
                    "position": {"latitude": 12.346, "longitude": -1.568, "altitude": 1200},
                }
            },
        ],
    }

    # Extract and print hierarchy
    locations = extract_location_hierarchy(example_bundle)
    print_location_tree(locations)
