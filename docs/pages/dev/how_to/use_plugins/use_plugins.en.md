# Using Plugins in Iaso Frontend

Iaso uses Webpack's Module Federation to dynamically load plugins at runtime. This guide explains how the plugin system works and how to create new plugins.

## Overview

The plugin system allows you to:
- Add new features to Iaso without modifying the core codebase
- Load plugin code dynamically at runtime
- Share common dependencies between plugins and the main application
- Extend the UI with new routes and menu items

## How It Works

### Plugin Discovery

During the build process (both development and production), Iaso:

1. Scans the `/plugins` directory for valid plugin folders
2. Looks for plugin configuration files (`config.tsx`)
3. Generates combined configuration files
4. Makes these files available through Module Federation

### Generated Files

The system generates several files in the `hat/assets/js/apps/Iaso/bundle/generated/` directory:

- `combinedPluginConfigs.js` - Combined configurations from all plugins
- `pluginKeys.js` - List of available plugin identifiers

### Module Federation

Iaso exposes these generated files through Webpack's ModuleFederationPlugin:

```javascript
new ModuleFederationPlugin({
    name: 'IasoModules',
    filename: 'remoteEntry.js',
    exposes: {
        './plugins/configs': combinedConfigPath,
        './plugins/keys': pluginKeysPath,
    },
    shared: {
        // Shared dependencies between plugins and main app
        react: { singleton: true, eager: true },
        'react-dom': { singleton: true, eager: true },
        'react-intl': { singleton: true, eager: true },
        '@mui/material': { singleton: true, eager: true },
        'bluesquare-components': { singleton: true, eager: true },
    },
})
```

## Plugin Structure

A valid plugin must follow this structure:

```
plugins/
└── your_plugin/
    ├── js/
    │   ├── config.tsx       # Required: Plugin configuration
    │   ├── index.tsx       # Plugin entry point
    │   ├── components/     # Plugin components
    │   └── routes/         # Plugin route components
    └── README.md          # Plugin documentation
```

### Plugin Configuration

The `config.tsx` file must export a configuration object that matches the `Plugin` type defined in `hat/assets/js/apps/Iaso/plugins/types.ts`:

```typescript
import { ElementType } from 'react';
import { Theme } from '@mui/material/styles';
import { MenuItem } from '../domains/app/types';
import {
    RouteCustom,
    Redirection as RoutingRedirection,
} from '../routing/types';

export type Plugin = {
    routes: RouteCustom[];
    menu: MenuItem[];
    translations: Record<string, any>;
    homeUrl?: string;
    homeOnline?: ElementType;
    homeOffline?: ElementType;
    key?: string;
    baseUrls: Record<string, string>;
    paramsConfig: Record<string, string[]>;
    redirections?: RoutingRedirection[];
    theme?: Theme;
    customComponents?: {
        key: string;
        component: ElementType;
    }[];
};

export type Plugins = {
    plugins: Plugin[];
};
```

#### Required Properties

- `routes`: Array of custom routes for the plugin
- `menu`: Array of menu items to be added to the main navigation
- `translations`: Record of translations for the plugin
- `baseUrls`: Record of base URLs for the plugin
- `paramsConfig`: Record of parameter configurations for the plugin

#### Optional Properties

- `homeUrl`: URL for the plugin's home page
- `homeOnline`: Component to display when the plugin is online
- `homeOffline`: Component to display when the plugin is offline
- `key`: Unique identifier for the plugin
- `redirections`: Array of routing redirections
- `theme`: Custom theme for the plugin
- `customComponents`: Array of custom components to be registered

#### Example Configuration

```typescript
// js/config.tsx
import React from 'react';
import MyPluginComponent from './components/MyPluginComponent';
import MyPluginHome from './components/MyPluginHome';

export default {
    routes: [
        {
            path: '/my-plugin',
            component: MyPluginComponent,
            permissions: ['plugin_access'],
        },
    ],
    menu: [
        {
            label: 'My Plugin',
            icon: 'plugin',
            path: '/my-plugin',
            permissions: ['plugin_access'],
            subMenu: [
                {
                    label: 'Sub Feature',
                    path: '/my-plugin/sub-feature',
                    permissions: ['sub_feature_access'],
                },
            ],
        },
    ],
    translations: {
        en: {
            'myPlugin.title': 'My Plugin',
            'myPlugin.description': 'This is my plugin',
        },
        fr: {
            'myPlugin.title': 'Mon Plugin',
            'myPlugin.description': 'C\'est mon plugin',
        },
    },
    homeUrl: '/my-plugin',
    homeOnline: MyPluginHome,
    key: 'my-plugin',
    baseUrls: {
        api: '/api/my-plugin',
    },
    paramsConfig: {
        'my-plugin': ['id', 'type'],
    },
    redirections: [
        {
            from: '/old-path',
            to: '/my-plugin',
        },
    ],
    customComponents: [
        {
            key: 'myCustomComponent',
            component: MyCustomComponent,
        },
    ],
};
```

## Development vs Production

### Development Mode

In development (`webpack.dev.js`):
- Files are generated on-the-fly when changes are detected
- Hot Module Replacement (HMR) is enabled for quick development
- Source maps are available for debugging
- Plugin changes are automatically detected and reloaded

### Production Mode

In production (`webpack.prod.js`):
- Files are generated once during the build process
- Code is minified and optimized
- Dead code elimination is performed
- Source maps are optional (configurable)

## Loading Plugins at Runtime

The main application:
1. Loads the plugin keys from `IasoModules/plugins/keys`
2. Loads configurations from `IasoModules/plugins/configs`
3. Registers plugin routes in the router
4. Adds plugin menu items to the navigation
5. Initializes plugin components and themes

## Creating a New Plugin

Quick start guide:

1. Create a new directory in the plugins folder:
   ```bash
   mkdir -p plugins/my-plugin/js
   ```

2. Create the basic file structure:
   ```bash
   cd plugins/my-plugin
   touch js/config.tsx js/index.tsx README.md
   ```

3. Initialize the plugin configuration:
   ```typescript
   // js/config.tsx
   import React from 'react';
   import MyPluginComponent from './components/MyPluginComponent';

   export default {
       routes: [
           {
               path: '/my-plugin',
               component: MyPluginComponent,
               permissions: ['plugin_access'],
           },
       ],
       menu: [
           {
               label: 'My Plugin',
               icon: 'plugin',
               path: '/my-plugin',
               permissions: ['plugin_access'],
           },
       ],
       translations: {
           en: {
               'myPlugin.title': 'My Plugin',
               'myPlugin.description': 'This is my plugin',
           },
           fr: {
               'myPlugin.title': 'Mon Plugin',
               'myPlugin.description': 'C\'est mon plugin',
           },
       },
       baseUrls: {
           api: '/api/my-plugin',
       },
       paramsConfig: {
           'my-plugin': ['id', 'type'],
       },
   };
   ```

4. Add your plugin's main component:
   ```typescript
   // js/index.tsx
   import React from 'react';

   const MyPlugin: React.FC = () => {
       return <div>My Plugin Content</div>;
   };

   export default MyPlugin;
   ```

5. Document your plugin:
   ```markdown
   # My Plugin

   Description of what your plugin does.

   ## Features
   - Feature 1
   - Feature 2

   ## Required Permissions
   - plugin_access

   ## Configuration
   Any specific configuration needed.
   ```
