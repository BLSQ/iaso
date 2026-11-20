# Front-end reference

Frontend assets include JS, CSS, translations and images. They are built with
**Vite** (`hat/vite.config.ts`). Output and bundle statistics live under
``hat/assets/frontend/``.

Django templates mount bundles via ``{% load render_bundle from frontend_bundles %}``
(``iaso.frontend_bundles`` reads ``bundle-stats*.json`` written by Vite).


Build
=====

Dev and prod
------------

* Dev: ``npm run dev`` (Docker: ``docker compose up frontend`` → ``start_frontend``)

* Prod: ``npm run build`` (default Vite production mode; ``build:prod`` is an alias). Dev bundle: ``npm run build:dev``.

* Local prod check: ``npm run preview`` after ``npm run build``.

* Stats files: ``bundle-stats.json`` (dev) / ``bundle-stats-prod.json`` (prod)


JS build
--------

Rollup entry points are declared in ``hat/vite.config.ts`` (`common`, `iaso`,
`superset`). Add new pages by extending ``rollupOptions.input`` and writing
stats for Django via the bundle-stats Vite plugin.


Including a JS bundle in a Django template
----------------------------------------

If we have created a new JS app ``MyCustomApp`` in ``hat/assets/js/apps/``.

The entrypoint should be ``/dashboard/my-custom-app``

Folders and files affected::

    + hat/
      + assets/
        + js/
          + apps/
            + MyCustomApp
              . index.js
              . MyCustomApp.js
              . MyCustomAppContainer.js

      + dashboard/
        . urls.py
        . views.py

      + templates/
        + dashboard/
          . my_custom_app.html

      . vite.config.ts


These are the steps to visualize it within the dashboard:

- In ``hat/vite.config.ts``, add a Rollup input and extend the django stats plugin
  entry map (same pattern as ``iaso`` / ``superset``).

- In ``hat/dashboard/views.py`` include a new view.

```python
    @login_required()  # needs login?
    @permission_required('cases.view')  # the needed permissions
    @require_http_methods(['GET'])  # http methods allowed
    def my_custom_app(request: HttpRequest) -> HttpResponse:
        return render(request, 'dashboard/my_custom_app.html')
```



- In ``hat/dashboard/urls.py`` include a new url pattern.
```python
    url(r'^my-custom-app/.*$', views.my_custom_app, name='my_custom_app'),
```

      url(r'^my-custom-app/.*$', views.my_custom_app, name='my_custom_app'),


- In ``hat/templates/dashboard`` create a new template file ``my_custom_app.html``.

```html
      {% extends 'app.html' %}
      {% load i18n %}
      {% load render_bundle from frontend_bundles %}

      {% block header %}
        <h1 class="header__title">{% trans 'My Custom App' %}</h1>
      {% endblock %}

      {% block content %}

        <div class="content">
          <div id="app-container"></div>
        </div>

        {% render_bundle 'common' %}
        {% render_bundle 'my_custom_app' %}
        <script>
          HAT.MyCustomApp.default(
            document.getElementById('app-container'),
            '/dashboard/my-custom-app/'
          )
        </script>
      {% endblock %}
```

Testing the production build
============================

#. Stop any containers that might be currently running.
#. Start the containers with:

   .. code:: shell

      TEST_PROD=true docker compose up

When the setup is run with ``TEST_PROD=true``, it will exit the unneeded containers
``frontend`` and ``jupyter``. With ``TEST_PROD=true`` it runs a production build at startup, so
that there is no need to rebuild the image for that.

JS Unit Testing
---------------

```shell
    docker compose run hat test_js
```



Adding new assets in package.json
=================================

Unfortunately, for now you need to rebuild the container after adding or
upgrading packages in ``package.json``.

.. code:: shell

    docker compose build

or

.. code:: shell

    docker compose up --build


Translations
============

Translations are extracted on the first production Vite build. Just like the django
translation strings; translations are downloaded for every `Travis CI <https://travis-ci.com>`__
build, and uploaded on the ``development`` branch.

Set up VSCode for front-end development
=======================================

See also: `this pull request <https://github.com/BLSQ/iaso/pull/120>`__

The script ``show-lint-problems`` can be turned into a VSCode task that will show all linter errors in VSCode's PROBLEMS Tab.

Steps to follow:

- Go to Terminal>Configure task

- Select npm: show-lint-problems

- Add ``$eslint-stylish`` to the ``problemMatcher`` array

- Run the task: Terminal>Run Task...> npm: show-lint-problems. 
  IMPORTANT: you need to run the task this way. Running the script directly from the terminal using npm will not enable VS Code to display the problems in the PROBLEMS tab

- You should be able to see and track the problems through the dedicated tab. 
  CAUTION: if you navigate to a file through the tab, then close the file, it will be removed from the problems list, even if it wasn't changed. This seems to be a problem with using npm through VSCode's tasks

Depend on bluesquare-components library
=======================================

See the `library's README <https://github.com/BLSQ/bluesquare-components/blob/main/README.md>`__ for the general setup.

When depending on a local version of the library:

- Your local folder should be on the same level as the iaso folder, so that the path to the tgz file in your package.json is : ../bluesquare-components/bluesquare-components-0.1.0.tgz

- Run ``docker compose build --build-arg LIBRARY=<name-of-the-library-image>``