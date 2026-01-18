# Plausible Analytics Setup

This guide explains how to set up and configure Plausible analytics in Iaso.

## Overview

Iaso supports Plausible analytics integration for tracking user activity and account usage. The system automatically generates analytics scripts and tracks custom events with user and account information.

### Analytics Levels

The system provides different levels of analytics tracking:

1. **Basic Tracking**: Page views for all users (domain only)
2. **Enhanced Tracking**: Custom events with user/account data for authenticated users
3. **Future**: Custom analytics scripts for specific customer requirements

## Prerequisites

- A Plausible account and subscription
- Access to your Iaso instance
- Domain name for your Iaso instance

## Step 1: Enable Analytics

### Environment Variable

Add the following environment variable to enable analytics:

```bash
ENABLE_ANALYTICS=true
```

**Docker Compose:**
```yaml
# docker-compose.yml
services:
  iaso:
    environment:
      ENABLE_ANALYTICS: "true"
```

**Environment File:**
```bash
# .env
ENABLE_ANALYTICS=true
```

## Step 2: Add Your Domain to Plausible

1. **Log into your Plausible dashboard**
2. **Add a new site** with your Iaso domain
3. **Enter your domain** (e.g., `your-iaso-instance.com`)
4. **Save the site**

## Step 3: Configure Custom Properties

To see user and account data in your Plausible dashboard, you need to add custom properties:

### Required Custom Properties

| Property Name | Type | Description |
|---------------|------|-------------|
| `username` | String | User's username |
| `user_id` | Number | User's unique ID |
| `account_name` | String | Account/organization name |
| `account_id` | Number | Account's unique ID |

### How to Add Custom Properties

1. **Go to your site in Plausible**
2. **Navigate to Settings** → **Custom Properties**
3. **Click "Add custom property"**
4. **Enter the property details:**
   - **Name**: `username`
5. **Repeat for all properties**
6. **Save each property**

## Step 4: Verify Setup

### Check Analytics Script

1. **Enable analytics**: `ENABLE_ANALYTICS=true`
2. **Access your Iaso instance**
3. **Log in as a user**
4. **Open browser developer tools**
5. **Check the page source** for the Plausible script:
   ```html
   <script defer data-domain="your-domain.com" src="https://plausible.io/js/script.js"></script>
   ```

### Check Network Requests

1. **Open browser developer tools**
2. **Go to Network tab**
3. **Refresh the page**
4. **Look for requests to `plausible.io`**
5. **Verify custom events are being sent**

## Step 5: View Analytics Data

### Custom Events

In your Plausible dashboard, you'll see:

- **Event Name**: "User Login"
- **Properties**: All user and account details
- **Timing**: When users log in and access pages

### Dashboard Views

You can create custom views to analyze:

- **User Activity**: Most active users
- **Account Usage**: Usage per account/organization
- **Feature Usage**: Which features are used most
- **User Journeys**: Individual user behavior patterns

## Plausible Filters and Iaso Pages

Iaso supports creating pages with raw HTML, Superset dashboards, or embedded Plausible dashboards. You can use Plausible's filtering capabilities to create targeted analytics views.

### Filtering by User Properties

Plausible allows filtering results using URL parameters. You can create Iaso pages that show filtered analytics data:

#### Filter for Non-Connected Pages
To show only analytics for non-authenticated users (pages without user data):
```
https://plausible.io/your-domain.com?f=is,props:username,(none)
```

#### Filter by Account
To show analytics for a specific account:
```
https://plausible.io/your-domain.com?f=is,props:account_id,123
```

#### Filter by Username
To show analytics for a specific user:
```
https://plausible.io/your-domain.com?f=is,props:username,john_doe
```

### Creating Iaso Pages with Filtered Analytics

#### 1. Raw HTML Page
Create a page with embedded Plausible dashboard:

```html
<iframe 
    src="https://plausible.io/your-domain.com?f=is,props:account_id,123" 
    width="100%" 
    height="600px"
    frameborder="0">
</iframe>
```


#### 2. Plausible Dashboard Page
Create a dedicated analytics page:

```html
<!-- Full analytics dashboard -->
<iframe 
    src="https://plausible.io/your-domain.com?f=is,props:username,(none)&period=30d" 
    width="100%" 
    height="800px">
</iframe>
```

### Common Filter Patterns

#### Account-Specific Dashboards
```
# Dashboard for specific account
https://plausible.io/your-domain.com?f=is,props:account_id,678&period=30d

# Dashboard for account by name
https://plausible.io/your-domain.com?f=is,props:account_name,WHO%20Country%20Office
```

#### User-Specific Views
```
# Analytics for specific user
https://plausible.io/your-domain.com?f=is,props:username,john_doe&period=7d

# Analytics for users in specific account
https://plausible.io/your-domain.com?f=is,props:account_id,678&f=is,props:username,(not%20none)
```

#### Anonymous vs Authenticated Users
```
# Only anonymous users (non-connected pages)
https://plausible.io/your-domain.com?f=is,props:username,(none)

# Only authenticated users
https://plausible.io/your-domain.com?f=is,props:username,(not%20none)
```

### Filter URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `f=is,props:username,(none)` | Filter for anonymous users | Non-connected pages |
| `f=is,props:account_id,123` | Filter by account ID | Account-specific dashboard |
| `f=is,props:account_name,WHO` | Filter by account name | Organization dashboard |
| `f=is,props:user_id,456` | Filter by user ID | User-specific analytics |
| `period=30d` | Time period | Last 30 days |
| `period=7d` | Time period | Last 7 days |
| `period=1m` | Time period | Last month |

### Creating Multi-Account Dashboards

For organizations managing multiple accounts, you can create comparison dashboards:

```html
<!-- Compare multiple accounts -->
<iframe 
    src="https://plausible.io/your-domain.com?f=is,props:account_id,123&f=is,props:account_id,456&period=30d" 
    width="100%" 
    height="600px">
</iframe>
```

### Using Plausible Dashboards in Iaso Pages

To create analytics dashboards in Iaso pages, use the **iframe option** with a specific Plausible URL:

```html
<iframe 
    src="https://plausible.io/your-domain.com?f=is,props:account_id,123&period=30d" 
    width="100%" 
    height="600px"
    frameborder="0">
</iframe>
```

This allows you to embed filtered Plausible analytics directly into your Iaso pages.

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_ANALYTICS` | `true` | Enable/disable analytics globally |

### Analytics Data Tracked

#### Page Views
- All page visits are automatically tracked
- Domain is automatically detected from the request

#### Custom Events (Authenticated Users Only)
- **Event**: "User Login"
- **Properties**:
  - `username`: User's username
  - `user_id`: User's unique ID
  - `account_name`: Account/organization name
  - `account_id`: Account's unique ID

#### Non-Connected Pages
For pages without user authentication (embeddable pages, public pages, etc.):
- **Only domain tracking**: Basic page views are tracked
- **No user data**: No custom events or user properties
- **Privacy-focused**: Minimal data collection for anonymous users

## Privacy and Security

### Data Privacy
- **No PII**: Usernames are typically not personally identifiable
- **Account Level**: Focuses on organizational usage patterns
- **GDPR Compliant**: Plausible is privacy-focused by design
- **No Cookies**: Plausible doesn't use cookies

### Security Considerations
- **HTTPS Only**: Analytics only works over HTTPS in production
- **Domain Validation**: Only tracks on the configured domain
- **User Consent**: Consider implementing user consent if required

## Troubleshooting

### Analytics Not Working

1. **Check environment variable**:
   ```bash
   echo $ENABLE_ANALYTICS
   ```

2. **Verify domain in Plausible**:
   - Ensure your domain is added to Plausible
   - Check for typos in the domain name

3. **Check browser console**:
   - Look for JavaScript errors
   - Verify Plausible script is loading

4. **Check network requests**:
   - Ensure requests to `plausible.io` are not blocked (i.e. by your ad blocker)
   - Check for CORS issues

### Custom Properties Not Showing

1. **Verify property names**: Must match exactly (case-sensitive)
2. **Check property types**: Ensure correct data types
3. **Wait for data**: Custom properties may take time to appear
4. **Check event data**: Verify events are being sent with properties

### Development Testing

For local development:

1. **Use a test domain**:
   ```bash
   # In /etc/hosts
   127.0.0.1 test-iaso.local
   ```

2. **Add test domain to Plausible**:
   - Add `test-iaso.local` as a site in Plausible

3. **Enable analytics locally**:
   ```bash
   ENABLE_ANALYTICS=true
   ```

4. **Access via test domain**:
   ```
   http://test-iaso.local:8081
   ```

## Advanced Configuration

### Custom Event Tracking

You can extend the analytics system to track additional events:

```javascript
// Example: Track feature usage
window.plausible('Feature Used', {
    props: {
        feature: 'data_export',
        username: 'user123',
        account_name: 'WHO'
    }
});
```

### Multiple Analytics Providers

The system is designed to support multiple analytics providers. Future versions may include:

- Google Analytics
- Matomo
- Custom analytics solutions

### Custom Analytics Scripts (Future Feature)

The `analytics_script` field in the Account model is preserved for future use:

- **Current**: Not used in the new analytics system
- **Future**: Will allow customers to specify custom analytics scripts
- **Implementation**: Will be added in a future version
- **Use Case**: For customers who need specific analytics providers or configurations

**Note**: The current system uses automatic Plausible script generation. Custom scripts will be implemented as an additional feature.

## Support

For issues with:

- **Iaso Analytics Integration**: Check this documentation
- **Plausible Service**: Contact Plausible support
- **Custom Properties**: Refer to Plausible documentation

## Related Documentation

- [Environment Variables](../env_variables/env_variables.en.md)
- [Docker Configuration](../../deployment/docker.md)
- [Privacy Policy](../../legal/privacy.md)
