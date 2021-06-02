# Polio Campaign

### Setup

The Polio Campaign app has integration with the Google Sheet API used to populate the preparedness data. This integration requires a JSON API Key with the Sheet API Enabled, the details of how to create an API key and enable the Sheet API can be found on the [Google Sheet API documentation](https://developers.google.com/sheets/api).

The app expects an environment variable `GOOGLE_API_KEY_BASE64` containing the JSON API Key decoded to base64. On Unix distributions, you can use the output of command `base64 credential.json` as the env variable.
