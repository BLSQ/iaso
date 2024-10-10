# Configuring a Public Registry

To configure a public registry, follow these steps:

## Step 1: Activate the Plugin

First, you need to activate the plugin by adding `"registry"` to the `PLUGINS` variable in your settings.

```
PLUGINS = registry,...
```

## Step 2: Make a Data Source Public

1. Open the Django admin interface.
2. Navigate to the data source you want to make public.
3. Select the data source and mark it as public.

## Step 3: Create a Public Registry Config

1. In the Django admin interface, navigate to the public registry config section.
2. Click on "Add" to create a new public registry config.

### Configuration Fields

-   **Host**: Enter any URL you want to use as the host.
-   **Slug**: Set this to `default_registry` (this value is hardcoded in the front-end at the moment).
-   **Whitelist**: Leave this field to the default value.
-   **Account**: Select the account where your data source is located.
-   **Root Orgunit**: Leave this field empty.
-   **Data Source**: Select the data source you made public.
-   **Source Version**: Select the version of the data source.
-   **App ID**: Fill in the App ID of the project that uses the account and the data source.

## Example Configuration

Here is an example configuration:

-   **Host**: `https://www.example.com`
-   **Slug**: `default_registry`
-   **Whitelist**: `{"fields": ["Name"]}`
-   **Account**: `polioTest`
-   **Root Orgunit**: (leave empty)
-   **Data Source**: `polio`
-   **Source Version**: `Polio 1`
-   **App ID**: `com.poliooutbreaks.app`

## Final Steps

After filling in all the required fields, save the configuration. Your public registry should now be configured and ready to use.
