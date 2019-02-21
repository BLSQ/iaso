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

    def test_limited_user(self):
        self.assertTrue(self.client.login(username='importer', password='importerimporter'))
        url = reverse('devices-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_partial_update(self):
        self.assertTrue(self.client.login(username='supervisor', password='supervisorsupervisor'))

        url404 = reverse('devices-detail', args=[6666])
        response404 = self.client.patch(url404, {'is_test': True}, format='json')
        self.assertEqual(response404.status_code, status.HTTP_404_NOT_FOUND)

        url101 = reverse('devices-detail', args=[101])
        response101 = self.client.patch(url101, {'is_test': True}, format='json')
        self.assertEqual(response101.status_code, status.HTTP_200_OK)
        self.assertEqual(response101.data['device_id'], 'device_1')
        self.assertEqual(response101.data['is_test'], True)

        url_list = reverse('devices-list')
        response_list = self.client.get(url_list, format='json')
        device_1 = [r for r in response_list.data if r['device_id'] == 'device_1']
        self.assertEqual(len(device_1), 0)  # by default, test devices are hidden
        # Now, again showing the test devices
        url_list = reverse('devices-list') + '?with_tests_devices=true'
        response_list = self.client.get(url_list, format='json')
        device_1 = [r for r in response_list.data if r['device_id'] == 'device_1']
        self.assertEqual(len(device_1), 1)
        self.assertEqual(device_1[0]['is_test'], True)

        # Check that patching other values (or none) doesn't reset the is_test flag
        response = self.client.patch(url101, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['device_id'], 'device_1')
        self.assertEqual(response.data['is_test'], True)

        response = self.client.patch(url101, {'is_test': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['device_id'], 'device_1')
        self.assertEqual(response.data['is_test'], False)
