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
    permissionsMessages?: PermissionsMessages;
    permissionsGroupsMessages?: PermissionsMessages;
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
- `permissionsMessages`: Labels and tooltips for the plugin's permissions. Merged by `usePermissionsMessages()`
- `permissionsGroupsMessages`: Labels for the plugin's permission groups. Merged by `usePermissionsGroupsMessages()`
- `customComponents`: Components inserted into host slots. See [Custom components](#custom-components)

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
    permissionsMessages: PERMISSIONS_MESSAGES,
    permissionsGroupsMessages: PERMISSIONS_GROUPS_MESSAGES,
    customComponents: [
        {
            key: 'tasks.rowAction',
            component: MyTaskRowAction,
        },
    ],
};
```

### Permission labels

Core permission labels live in `hat/assets/js/apps/Iaso/domains/users/permissionsMessages.ts`. Group labels live in `permissionsGroupsMessages.ts`. A plugin keeps its own labels and exposes them on the `Plugin` object. Host screens do not import the plugin file. They call:

- `usePermissionsMessages()` for a permission codename and its tooltip
- `usePermissionsGroupsMessages()` for a permission group

Each hook starts from the core map and spreads every enabled plugin's map on top. A plugin key with the same name replaces the core string.

`permissionsMessages` is a `defineMessages` record. The key is the permission codename (`iaso_polio`). The tooltip key is that codename plus `_tooltip` (`iaso_polio_tooltip`). `permissionsGroupsMessages` uses the group codename (`polio`).

String values still belong in the plugin locale files (`js/src/constants/translations/<lang>.json`). The message `id` must match a key in those files.

### Custom components

A custom component is a React component a plugin inserts into a slot the host already renders. The plugin declares it in `config.tsx`:

```typescript
customComponents: [
    { key: 'topbar.disclaimer', component: Disclaimer },
],
```

The host reads those registrations from `hat/assets/js/apps/Iaso/plugins/hooks/customComponents.ts`. Two hooks, because the two kinds of slot behave differently:

- `useFindCustomComponent(key)` returns one component, the last plugin that registered `key`. Use it when the slot is a single widget.
- `useCustomComponentsByKey(key)` returns every component registered under `key`, from every enabled plugin. Use it when several plugins can add to the same place.

A key that no host screen asks for is never rendered. Adding a slot means rendering one of these hooks in the host, then registering a component under that key from the plugin.

| Key | Hook | Rendered in | Props the host passes |
| --- | --- | --- | --- |
| `topbar.disclaimer` | `useFindCustomComponent` | `components/nav/TopBarComponent.tsx` | none |
| `tasks.rowAction` | `useCustomComponentsByKey` | `domains/tasks/components/ActionCell.tsx` | `task` |
| `groups.dialogField` | `useCustomComponentsByKey` | `domains/orgUnits/groups/components/GroupsDialog.tsx` | `values`, `onChange` |

`tasks.rowAction` is an extra control on a task row. `groups.dialogField` is an extra field in the org-unit group create/edit dialog. `topbar.disclaimer` is a single line in the top bar; a later plugin replaces an earlier one.

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

1. Create a new plugin using the custom Django command:
   ```bash
   python manage.py startplugin <your_plugin_name>
   ```

It will automatically create all the required files in `plugins/<your_plugin_name>`.


2. Initialize the plugin configuration:
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

3. Add your plugin's main component:
   ```typescript
   // js/index.tsx
   import React from 'react';

   const MyPlugin: React.FC = () => {
       return <div>My Plugin Content</div>;
   };

   export default MyPlugin;
   ```

4. Document your plugin:
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

## Translations

The plugin system includes support for translations. For a comprehensive guide on the translation system, see [Using Translations in Iaso Frontend](./use_translations.en.md).

### Plugin-Specific Translation Details

#### Translation Structure in Plugins

A valid plugin with translations should follow this structure:

```
plugins/
└── your_plugin/
    ├── js/
    │   ├── config.tsx       # Required: Plugin configuration
    │   ├── index.tsx       # Plugin entry point
    │   ├── components/     # Plugin components
    │   ├── routes/         # Plugin route components
    │   └── src/
    │       └── constants/
    │           └── translations/
    │               ├── en.json  # English translations (required)
    │               ├── fr.json  # French translations (optional)
    │               └── ...      # Other language translations
    └── README.md          # Plugin documentation
```

#### Adding Translations to a Plugin

To add translations to your plugin:
1. In `js/src/constants/translations/` structure your translation files as a flat object with dot-notation keys:
```json
{
    "myPlugin.title": "My Plugin Title",
    "myPlugin.description": "Plugin description"
}
```

2. Make sure to include at least an English translation file (`en.json`) as it will be used as a fallback for other languages

#### Translation Fallbacks

The system uses a fallback mechanism to ensure all strings are translated:
1. If a translation is missing for a specific language, the system will use the English translation
2. If the English translation is also missing, the system will use the key itself
3. Warnings will be displayed in the console during build when fallbacks are used
