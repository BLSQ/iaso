# Using Translations in Iaso Frontend

Iaso uses a centralized translation system that works across the main application, plugins, and shared components. This guide explains how the translation system works and how to add new languages.

## Overview

The translation system allows you to:
- Maintain translations in a centralized location
- Share translations between the main app, plugins, and shared components
- Add new languages without modifying the core codebase
- Use translations in both development and production environments

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
- `languageKeys.js` - List of available language codes (automatically generated from translation files)

### Module Federation

Iaso exposes these generated files through Webpack's ModuleFederationPlugin:

```javascript
new ModuleFederationPlugin({
    name: 'IasoModules',
    filename: 'remoteEntry.js',
    exposes: {
        './translations/configs': combinedTranslationsPath,
        './translations/keys': languageKeysPath,
    },
    shared: {
        // Shared dependencies between plugins and main app
        'react-intl': { singleton: true, eager: true },
    },
})
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
1. Loads the language keys from `IasoModules/translations/keys`
2. Loads translations from `IasoModules/translations/configs`
3. Initializes the React-Intl provider with the loaded translations
4. Makes translations available to all components through the React-Intl context

## Adding a New Language

To add a new language to the system, follow these steps:

### 1. Copy and Translate Existing Language Files

The simplest way to add a new language is to copy an existing language file (e.g., `en.json`) and translate all the keys:

```bash
# Main application
cp hat/assets/js/apps/Iaso/translations/en.json hat/assets/js/apps/Iaso/translations/es.json

# Plugins (if they have translations)
cp plugins/your_plugin/js/translations/en.json plugins/your_plugin/js/translations/es.json

# Shared components (if they have translations)
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

### 2. Rebuild the Application

Rebuild the application to generate the new translation files:

```bash
# Development
npm run dev

# Production
npm run build
```

The system will automatically detect the new language file and include it in the generated files. No additional configuration is needed.





