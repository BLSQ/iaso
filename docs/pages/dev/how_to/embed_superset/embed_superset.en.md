## Superset Dashboard Integration

Iaso supports embedding [Superset](https://superset.apache.org/) dashboards for advanced analytics and reporting. To configure this integration, you need to set up the following environment variables:

```bash
SUPERSET_URL="https://your-superset-instance.com"
SUPERSET_ADMIN_USERNAME="admin_username"
SUPERSET_ADMIN_PASSWORD="admin_password"
```

These credentials must be for an **admin** user of your Superset instance, as they are used by `iaso/api/superset.py` to create guest tokens for dashboard embedding.

### Creating Embedded Superset Pages

Once the environment variables are configured, you can create embedded Superset dashboards through the Django admin interface (for the moment, setting it up via the `/dashboard/pages` is not fully supported yet):

1. Go to `/admin/iaso/page/` in your Iaso instance
2. Create a new Page with:
    - **Type**: "Superset dashboard"
    - **Superset dashboard ID**: The ID of the dashboard in your Superset instance
    - **Superset dashboard UI config**: Optional JSON configuration for UI customization (you can find examples [in the embedded SDK documentation](https://www.npmjs.com/package/@superset-ui/embedded-sdk))
    - **Slug**: A unique URL slug for accessing the embedded dashboard

The embedded dashboard will be accessible at `/pages/{your-slug}/` and will use guest token authentication for secure access.
