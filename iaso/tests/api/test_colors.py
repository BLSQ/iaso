from iaso import models as m
from iaso.test import APITestCase
from iaso.utils.colors import COLOR_CHOICES, DISPERSED_COLOR_ORDER


class ColorsApiTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account(name="test account")
        account.save()

        cls.user = cls.create_user_with_profile(username="user", account=account)

    def test_colors_unauth(self):
        """Test that unauthenticated users can access colors API"""
        response = self.client.get("/api/colors/", format="json")
        self.assertEqual(response.status_code, 200)

    def test_colors_rainbow_order(self):
        """Test colors API returns rainbow order by default"""
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/colors/", format="json")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), len(COLOR_CHOICES))

        # Verify structure
        first_color = data[0]
        self.assertIn("value", first_color)
        self.assertIn("label", first_color)

        # Verify order matches COLOR_CHOICES
        for i, color in enumerate(data):
            self.assertEqual(color["value"], COLOR_CHOICES[i][0])
            self.assertEqual(color["label"], COLOR_CHOICES[i][1])

    def test_colors_dispersed_order(self):
        """Test colors API returns dispersed order when requested"""
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/colors/?dispersed=true", format="json")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), len(COLOR_CHOICES))

        # Verify structure
        first_color = data[0]
        self.assertIn("value", first_color)
        self.assertIn("label", first_color)

        # Verify order matches DISPERSED_COLOR_ORDER
        for i, color in enumerate(data):
            expected_index = DISPERSED_COLOR_ORDER[i]
            self.assertEqual(color["value"], COLOR_CHOICES[expected_index][0])
            self.assertEqual(color["label"], COLOR_CHOICES[expected_index][1])

    def test_colors_dispersed_false(self):
        """Test colors API returns rainbow order when dispersed=false"""
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/colors/?dispersed=false", format="json")
        self.assertEqual(response.status_code, 200)

        data = response.json()

        # Should return rainbow order (same as default)
        for i, color in enumerate(data):
            self.assertEqual(color["value"], COLOR_CHOICES[i][0])
            self.assertEqual(color["label"], COLOR_CHOICES[i][1])

    def test_colors_response_structure(self):
        """Test that each color has correct structure with value and label"""
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/colors/", format="json")
        data = response.json()

        for color in data:
            # Check keys
            self.assertEqual(set(color.keys()), {"value", "label"})

            # Check value is hex color
            self.assertIsInstance(color["value"], str)
            self.assertTrue(color["value"].startswith("#"))
            self.assertIn(len(color["value"]), [7, 8])  # #RRGGBB or #RRGGBBAA

            # Check label is string
            self.assertIsInstance(color["label"], str)
            self.assertTrue(len(color["label"]) > 0)

    def test_colors_dispersed_various_boolean_values(self):
        """Test that various boolean representations work for dispersed parameter"""
        self.client.force_authenticate(self.user)

        # Test various truthy values
        for value in ["true", "True", "TRUE", "1", "yes", "Yes"]:
            response = self.client.get(f"/api/colors/?dispersed={value}", format="json")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            # Verify it's dispersed order by checking first color
            first_color = data[0]
            self.assertEqual(first_color["value"], COLOR_CHOICES[DISPERSED_COLOR_ORDER[0]][0])

        # Test various falsy values
        for value in ["false", "False", "FALSE", "0", "no", "No"]:
            response = self.client.get(f"/api/colors/?dispersed={value}", format="json")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            # Verify it's rainbow order by checking first color
            first_color = data[0]
            self.assertEqual(first_color["value"], COLOR_CHOICES[0][0])

    def test_colors_dispersed_invalid_value(self):
        """Test that invalid dispersed values return 400 error"""
        self.client.force_authenticate(self.user)

        # Test invalid values that should return 400
        for value in ["invalid", "maybe", "2"]:
            response = self.client.get(f"/api/colors/?dispersed={value}", format="json")
            self.assertEqual(
                response.status_code,
                400,
                f"Expected 400 for dispersed={value}, got {response.status_code}",
            )
            data = response.json()
            self.assertIn("dispersed", data)

    def test_colors_dispersed_empty_string(self):
        """Test that empty string for dispersed parameter defaults to False"""
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/colors/?dispersed=", format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Empty string should be treated as False (rainbow order)
        first_color = data[0]
        self.assertEqual(first_color["value"], COLOR_CHOICES[0][0])
