IASO frontend assets
====================

JavaScript, CSS, and images under ``hat/assets/`` are built with **Vite**
(``hat/vite.config.ts``). Production output and bundle statistics are written to
``hat/assets/frontend/`` (``bundle-stats.json`` / ``bundle-stats-prod.json``).

Django pages include bundles with::

    {% load render_bundle from frontend_bundles %}
    {% render_bundle 'common' 'js' attrs='type="module"' %}
    {% render_bundle 'iaso' 'js' attrs='type="module"' %}

See ``docs/pages/dev/reference/front-end_reference.en.md`` for adding new entries
and template integration.

Local dev: ``npm run dev`` or ``docker compose up frontend``.