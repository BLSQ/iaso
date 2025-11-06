from iaso import models as m
from iaso.constants import COLOR_CHOICES, DISPERSED_COLOR_ORDER
from iaso.test import APITestCase


class ColorsApiTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account(name="test account")
        account.save()

        cls.user = user = m.User.objects.create(username="test_user")
        p = m.Profile(user=user, account=account)
        p.save()

    def test_colors_unauth(self):
        """Test that unauthenticated users cannot access colors API"""
        response = self.client.get("/api/colors/", format="json")
        self.assertEqual(response.status_code, 401)

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

    def test_colors_dispersed_different_from_rainbow(self):
        """Test that dispersed order is actually different from rainbow order"""
        self.client.force_authenticate(self.user)

        # Get rainbow order
        response_rainbow = self.client.get("/api/colors/", format="json")
        rainbow_data = response_rainbow.json()

        # Get dispersed order
        response_dispersed = self.client.get("/api/colors/?dispersed=true", format="json")
        dispersed_data = response_dispersed.json()

        # They should have the same colors but in different order
        rainbow_values = [c["value"] for c in rainbow_data]
        dispersed_values = [c["value"] for c in dispersed_data]

        # Same colors
        self.assertEqual(set(rainbow_values), set(dispersed_values))

        # Different order (at least first color should be different)
        self.assertNotEqual(rainbow_values[0], dispersed_values[0])

    def test_colors_dispersed_starts_with_blue(self):
        """Test that dispersed order starts with Light Blue 400, not red"""
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/colors/?dispersed=true", format="json")
        data = response.json()

        first_color = data[0]
        # Light Blue 400 is at index 9 in COLOR_CHOICES
        self.assertEqual(first_color["value"], COLOR_CHOICES[9][0])
        self.assertIn("Light Blue", first_color["label"])

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

