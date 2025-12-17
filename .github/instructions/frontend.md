---
version: 1
scope: paths
patterns:
  - "hat/**"
---
Frontend (React/TS):
- Components as arrow functions typed FunctionComponent<Props>; one per file; split into small pieces; keep static data in constants/config.
- Styling: styles object typed SxStyles + sx prop; avoid makeStyles.
- Translations: use useSafeIntl; flat/dot keys with defaults; reuse ids; rich text via values callbacks.
- Tables/filters/routing: TableWithDeepLinking; deep-link filters via routes params (ordered, pagination params first after accountId); use InputComponent/OrgUnitTreeviewModal/DateRange; use useFilterState; API calls without query params end with “/”.
- React Query: keys like ['resource'], ['resource', id], ['resource', id, 'property']; use params object in keys for filtered lists; invalidate matching shapes; use raw numbers, not prefixed strings.
- Misc: order translations alphanumerically; default spacing theme.spacing(2); avoid overusing Grid.

