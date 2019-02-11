from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase


class DevicesTest(APITestCase):
    fixtures = ['locations', 'users', 'cases', 'patients', 'provinces', 'image_video_uploads']

    def test_list_devices(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))
        url = reverse('devices-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)  # devices
        device_1 = [r for r in response.data if r['device_id'] == 'device_1'][0]
        self.assertEqual(device_1['count_total'], 3)
        self.assertEqual(device_1['count_uploaded_pictures'], 1)
        self.assertEqual(device_1['count_captured_pictures'], 2)
        self.assertEqual(str(device_1['latest_image_upload']), '2018-01-01 00:00:00+00:00')
        self.assertEqual(device_1['count_uploaded_video'], 0)
        self.assertEqual(device_1['count_captured_video'], 1)
        self.assertIsNone(device_1['latest_video_upload'])

        device_2 = [r for r in response.data if r['device_id'] == 'device_2'][0]
        self.assertEqual(device_2['count_total'], 2)
        self.assertEqual(device_2['count_uploaded_pictures'], 0)
        self.assertEqual(device_2['count_captured_pictures'], 2)
        self.assertIsNone(device_2['latest_image_upload'])
        self.assertEqual(device_2['count_uploaded_video'], 0)
        self.assertEqual(device_2['count_captured_video'], 0)
        self.assertIsNone(device_2['latest_video_upload'])

        device_3 = [r for r in response.data if r['device_id'] == 'device_3'][0]
        self.assertEqual(device_3['count_total'], 2)
        self.assertEqual(device_3['count_uploaded_pictures'], 0)
        self.assertEqual(device_3['count_captured_pictures'], 0)
        self.assertIsNone(device_3['latest_image_upload'])
        self.assertEqual(device_3['count_uploaded_video'], 2)
        self.assertEqual(device_3['count_captured_video'], 2)
        self.assertEqual(str(device_3['latest_video_upload']), '2018-01-11 00:00:00+00:00')

