---
version: 1
scope: repository
---
Translations:
- Centralized: main app + plugins + bluesquare-components; generated combinedTranslations.js and languageConfigs.js (Module Federation).
- Main: hat/assets/js/apps/Iaso/translations/en.json required; optional <lang>.config.js for label/date/number formats.
- Plugins: plugins/<name>/js/src/constants/translations/en.json required; keys prefixed by plugin name.
- Env AVAILABLE_LANGUAGES controls exposed languages; copy en.json + translate; optionally copy en.config.js; rebuild (npm run dev/build).
- Account overrides: Account.custom_translations merged at runtime.

