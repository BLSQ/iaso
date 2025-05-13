# Using Translations in Iaso Frontend

Iaso uses a centralized translation system that works across the main application, plugins, and shared components. This guide explains how the translation system works and how to add new languages.

## Overview

The translation system allows you to:
- Maintain translations in a centralized location
- Share translations between the main app, plugins, and shared components
- Add new languages without modifying the core codebase
- Use translations in both development and production environments
- Configure language-specific settings like date formats and number formatting

## How It Works

### Translation Discovery

During the build process (both development and production), Iaso:

1. Scans the main application for translation files
2. Scans all plugins for translation files
3. Scans shared components (bluesquare-components) for translation files
4. Generates combined translation files
5. Makes these files available through Module Federation

### Generated Files

The system generates several files in the `hat/assets/js/apps/Iaso/bundle/generated/` directory:

- `combinedTranslations.js` - Combined translations from all sources
- `languageConfigs.js` - Language-specific configuration including date formats and number formatting
- `combinedConfig.js` - Combined configuration for plugins
- `pluginKeys.js` - Keys for plugin integration

### Module Federation

Iaso exposes these generated files through Webpack's ModuleFederationPlugin:

```javascript
new ModuleFederationPlugin({
    name: 'IasoModules',
    filename: 'remoteEntry.js',
    library: { type: 'self', name: 'IasoModules' },
    exposes: {
        './plugins/configs': combinedConfigPath,
        './plugins/keys': pluginKeysPath,
        './translations/configs': combinedTranslationsPath,
        './language/configs': languageConfigsPath,
    },
    shared: {
        react: {
            singleton: true,
            eager: true,
            requiredVersion: false,
        },
        'react-dom': {
            singleton: true,
            eager: true,
            requiredVersion: false,
        },
        'react-intl': {
            singleton: true,
            eager: true,
            requiredVersion: false,
        },
        '@mui/material': {
            singleton: true,
            eager: true,
            requiredVersion: false,
        },
        'bluesquare-components': {
            singleton: true,
            eager: true,
            requiredVersion: false,
        },
    },
})
```

Additionally, the webpack configuration includes aliases for these exposed modules:

```javascript
resolve: {
    alias: {
        'react/jsx-runtime': 'react/jsx-runtime.js',
        // Add alias for the combined config
        'IasoModules/plugins/configs': combinedConfigPath,
        'IasoModules/plugins/keys': pluginKeysPath,
        'IasoModules/translations/configs': combinedTranslationsPath,
        'IasoModules/language/configs': languageConfigsPath,
        // ...
    },
    // ...
}
```

## Translation Structure

Translations are organized in the following structure:

```
hat/
├── assets/
│   └── js/
│       └── apps/
│           └── Iaso/
│               └── translations/
│                   ├── en.json
│                   ├── fr.json
│                   ├── en.config.js
│                   ├── fr.config.js
│                   └── ...
plugins/
└── your_plugin/
    └── js/
        └── translations/
            ├── en.json
            ├── fr.json
            └── ...
bluesquare-components/
└── src/
    └── translations/
        ├── en.json
        ├── fr.json
        └── ...
```

### Translation File Format

Translation files are JSON files with a flat structure of key-value pairs:

```json
{
  "common.button.save": "Save",
  "common.button.cancel": "Cancel",
  "common.button.edit": "Edit",
  "common.button.delete": "Delete",
  "common.message.confirm": "Are you sure?",
  "common.message.success": "Operation completed successfully",
  "common.message.error": "An error occurred",
  "common.label.name": "Name",
  "common.label.description": "Description",
  "common.label.status": "Status",
  "common.label.date": "Date",
  "common.label.type": "Type",
  "common.label.actions": "Actions"
}
```

### Language Configuration Files

Each language can have a configuration file (e.g., `en.config.js`, `fr.config.js`) that contains language-specific settings:

```javascript
// en.config.js
export default {
    label: 'English',
    dateFormats: {
        LT: 'h:mm A',
        LTS: 'DD/MM/YYYY HH:mm',
        L: 'DD/MM/YYYY',
        LL: 'Do MMMM YYYY',
        LLL: 'Do MMMM YYYY LT',
        LLLL: 'dddd, MMMM Do YYYY LT',
    },
    thousandGroupStyle: 'thousand',
};
```

These configuration files are used to:
- Set the display name of the language in the UI
- Configure date and time formats
- Set number formatting preferences (thousand, lakh, wan)

## Development vs Production

### Development Mode

In development (`webpack.dev.js`):
- Translation files are generated on-the-fly when changes are detected
- Hot Module Replacement (HMR) is enabled for quick development
- Changes to translation files are automatically detected and reloaded

### Production Mode

In production (`webpack.prod.js`):
- Translation files are generated once during the build process
- Translations are optimized and minified
- Source maps are optional (configurable)

## Loading Translations at Runtime

The main application:
1. Loads translations from `./assets/js/apps/Iaso/bundle/generated/combinedTranslations.js`
2. Loads language configurations from `./assets/js/apps/Iaso/bundle/generated/languageConfigs.js`
3. Loads plugin configurations from `./assets/js/apps/Iaso/bundle/generated/combinedPluginConfigs.js`
4. Loads plugin keys from `./assets/js/apps/Iaso/bundle/generated/pluginKeys.js`
5. Initializes the React-Intl provider with the loaded translations
6. Makes translations available to all components through the React-Intl context

## Adding a New Language

To add a new language to the system, follow these steps:

### 1. Add the Language to AVAILABLE_LANGUAGES Environment Variable

First, you need to add the new language code to the `AVAILABLE_LANGUAGES` environment variable. This variable is used at run time to determine which languages to display.

```bash
# For development
export AVAILABLE_LANGUAGES="en,fr,es"

# For production, add to your .env file or deployment configuration
AVAILABLE_LANGUAGES=en,fr,es
```


### 2. Copy and Translate Existing Language Files

The simplest way to add a new language is to copy an existing language file (e.g., `en.json`) and translate all the keys:

```bash
# Main application (required)
cp hat/assets/js/apps/Iaso/translations/en.json hat/assets/js/apps/Iaso/translations/es.json

# Optional: Plugin translations
# If not provided, English will be used as fallback
cp plugins/your_plugin/js/translations/en.json plugins/your_plugin/js/translations/es.json

# Optional: Shared components translations
# If not provided, English will be used as fallback
cp bluesquare-components/src/translations/en.json bluesquare-components/src/translations/es.json
```


Then edit each file to translate the values while keeping the keys the same:

```json
{
  "common.button.save": "Guardar",
  "common.button.cancel": "Cancelar",
  "common.button.edit": "Editar",
  "common.button.delete": "Eliminar",
  "common.message.confirm": "¿Estás seguro?",
  "common.message.success": "Operación completada con éxito",
  "common.message.error": "Se produjo un error",
  "common.label.name": "Nombre",
  "common.label.description": "Descripción",
  "common.label.status": "Estado",
  "common.label.date": "Fecha",
  "common.label.type": "Tipo",
  "common.label.actions": "Acciones"
}
```

### 3. Create a Language Configuration File (Optional)

If you need custom date formats or number formatting for your language, create a configuration file:

```bash
# Main application
cp hat/assets/js/apps/Iaso/translations/en.config.js hat/assets/js/apps/Iaso/translations/es.config.js
```

Then edit the file to customize the settings:

```javascript
// es.config.js
export default {
    label: 'Español',
    dateFormats: {
        LT: 'H:mm',
        LTS: 'DD/MM/YYYY H:mm',
        L: 'DD/MM/YYYY',
        LL: 'D [de] MMMM [de] YYYY',
        LLL: 'D [de] MMMM [de] YYYY H:mm',
        LLLL: 'dddd, D [de] MMMM [de] YYYY H:mm',
    },
    thousandGroupStyle: 'thousand',
};
```

### 4. Rebuild the Application

Rebuild the application to generate the new translation files:

```bash
# Development
npm run dev

# Production
npm run build
```

The system will automatically detect the new language file and include it in the generated files.

## Account-Specific Custom Translations

Iaso supports account-specific custom translations that can be managed through the Django admin interface. This feature allows administrators to override default translations for specific accounts.

### How It Works

1. **Account Custom Translations Storage**:
   - Custom translations are stored in the `custom_translations` field of the Account model
   - The field is a JSON field that follows the same structure as regular translation files
   - Each account can have its own set of custom translations

2. **Translation Override Process**:
   - When a user logs in, their account's custom translations are loaded
   - These custom translations are merged with the default translations
   - Custom translations take precedence over default translations
   - The merging happens at the key level for each language

### Example of Custom Translations Structure

```json
{
    "fr": {
        "iaso.label.entities": "Bénéficiaires personnalisés",
        "iaso.label.entity": "Bénéficiaire personnalisé"
    },
    "en": {
        "iaso.label.entities": "Custom Beneficiaries",
        "iaso.label.entity": "Custom Beneficiary"
    }
}
```

### Managing Custom Translations

To manage custom translations for an account:

1. Log in to the Django admin interface
2. Navigate to the Account model
3. Select the account you want to modify
4. Edit the `custom_translations` field
5. Save the changes

### Important Notes

- Custom translations are merged with default translations at runtime
- Only authenticated users with an account will see their custom translations
- Anonymous users will see only the default translations
- Custom translations are scoped to the account level
- Changes to custom translations take effect immediately after saving
- The system maintains a clean separation between default and custom translations

## Date Formatting in Components

Several components can be enhanced to use language-specific date formats:

1. **formatValue Function** (`hat/assets/js/apps/Iaso/domains/instances/utils/index.tsx`):
   - Use language-specific formats for date and datetime values
   - Ensure consistent date formatting across the application

2. **convertDate Function** (`plugins/polio/js/src/domains/Campaigns/campaignHistory/config.tsx`):
   - Update to use language configs for date formatting
   - Ensure dates are displayed according to the user's locale

## Number Formatting

The application already has some components using language configs for number formatting, but this can be extended:

1. **NumberCell Component**:
   - Already uses language configs for thousand separators and decimal points
   - Can be used as a reference for other number formatting components

2. **formatThousand Function**:
   - Extend to use language-specific formatting
   - Ensure consistent number formatting across the application

3. **formatRoundNumber Function** (`plugins/polio/js/src/domains/Budget/utils.tsx`):
   - Update to use language-specific formatting
   - Ensure numbers are displayed according to the user's locale

## Form Inputs

Form inputs can be enhanced to support language-specific formatting:

1. **InputComponent**:
   - Already has good support for language-specific number formatting
   - Can be used as a reference for other input types

2. **Other Input Types**:
   - Extend language-specific formatting to other input types
   - Ensure consistent input formatting across the application

## Plugin Translations

Plugins can provide their own translations that are automatically integrated into the main translation system. This allows plugins to be fully localized without modifying the core application.

### Plugin Translation Structure

Plugins should organize their translations in the following structure:

```
plugins/
└── your_plugin/
    └── js/
        └── src/
            └── constants/
                └── translations/
                    ├── en.json  # English translations (required)
                    ├── fr.json  # French translations (optional)
                    └── ...      # Other language translations
```

### Plugin Translation Keys

To avoid conflicts with the main application and other plugins, plugin translation keys should be prefixed with the plugin's name:

```json
{
  "myPlugin.title": "My Plugin Title",
  "myPlugin.description": "Plugin description",
  "myPlugin.button.save": "Save",
  "myPlugin.button.cancel": "Cancel"
}
```

### Plugin Translation Integration

During the build process:
1. The system scans all plugins for translation files
2. Plugin translations are combined with the main application translations
3. The combined translations are exposed through Module Federation
4. Plugins can access their translations using the same React-Intl hooks as the main application

### Plugin Translation Example

Here's an example of how to use translations in a plugin component:

```typescript
import React from 'react';
import { useIntl } from 'react-intl';

const MyPluginComponent: React.FC = () => {
    const intl = useIntl();
    
    return (
        <div>
            <h1>{intl.formatMessage({ id: 'myPlugin.title' })}</h1>
            <p>{intl.formatMessage({ id: 'myPlugin.description' })}</p>
            <button>{intl.formatMessage({ id: 'myPlugin.button.save' })}</button>
        </div>
    );
};

export default MyPluginComponent;
```

### Plugin Translation Fallbacks

The system uses a fallback mechanism to ensure all strings are translated:
1. If a translation is missing for a specific language, the system will use the English translation
2. If the English translation is also missing, the system will use the key itself
3. Warnings will be displayed in the console during build when fallbacks are used

For more information on creating plugins with translations, see [Using Plugins in Iaso Frontend](../use_plugins/use_plugins.en.md).
