---
version: 1
scope: paths
patterns:
  - "plugins/**"
---
Plugins (frontend Module Federation):
- Plugins live under plugins/<name>/js with config.tsx (required), index.tsx, components/routes/src/constants/translations/.
- Build scans plugins to generate combinedPluginConfigs.js and pluginKeys.js (exposed via Module Federation: IasoModules/plugins/configs, .../keys); shared deps are singletons (react, react-dom, react-intl, @mui/material, bluesquare-components).
- config.tsx exports a Plugin object with routes/menu/translations/baseUrls/paramsConfig; optional homeUrl/homeOnline/homeOffline/key/redirections/theme/customComponents.
- Scaffolding: python manage.py startplugin <name>.
- Translations: at least en.json under js/src/constants/translations; keys flat/dot and prefixed with plugin name; fallback to en then key.

