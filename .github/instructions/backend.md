---
version: 1
scope: paths
patterns:
  - "iaso/**"
  - "hat/api/**"
---
Backend/API (Django/DRF):
- Use serializers for body + query params; base on iaso.api.common.ModelViewSet; declare http_method_names.
- Filter querysets for user/account/project; add select_related/prefetch_related to avoid N+1; prefer QuerySet.for_user helpers.
- One endpoint per operation (ADR). Mobile endpoints under /api/mobile; use timestamp serializers for mobile, RFC datetime for web.
- Filtering/ordering/pagination: DjangoFilterBackend + OrderingFilter; ordering_fields/filterset_fields; always paginate with a Paginator subclass.
- Permissions: set permission_classes or HasPermission; test auth/permissions/tenancy; never weaken auth.
- Migrations: add tenancy FKs + created_at/updated_at; env vars via settings.py with defaults and docker-compose exposure; avoid direct os.environ.
- Soft delete: SoftDelete + DeletionFilterBackend.
- Feature flags: FeatureFlag / AccountFeatureFlag via migrations.
- Managers vs querysets: chainable multi-object helpers on QuerySet; non-chainable on Manager; single-instance helpers on model.

