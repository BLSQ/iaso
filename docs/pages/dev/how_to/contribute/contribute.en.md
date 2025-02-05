# Contribute

### Code formatting


We have adopted Black [](https://github.com/psf/black) as our code
formatting tool. Line length is 120.

The easiest way to use is is to install the pre-commit hook:
1. Install pre-commit: pip install pre-commit
2. Execute pre-commit install to install git hooks in your .git/ directory.

Another good way to have it working is to set it up in your code editor.
Pycharm, for example, has good support for this.

The pre-commit is not mandatory but Continuous Integration will check
if the formatting is respected!

### Tests and linting


For the Python backend, we use the Django builtin test framework. Tests can be executed with

``` {.sourceCode .bash}
docker compose exec iaso ./manage.py test
```

### Translations

When modifying or adding new strings to translate, use our custom commands to manage translations:

```bash
# Generate/update and test translations
python manage.py make_translations

# Compile translation files
python manage.py compile_translations
```

These commands will process translation files in specific locations:
- `hat/locale/fr/LC_MESSAGES/django.po` for the core application
- `iaso/locale/fr/LC_MESSAGES/django.po` for the Iaso application
- Additional `.po` files in `plugins/*/locale/*/LC_MESSAGES/django.po` for plugins that use translations

The commands are designed to only process these specific paths, ignoring any other locations in the project.

### Code reloading

In development the servers will reload when they detect a file
change, either in Python or Javascript. If you need reloading for the bluesquare-components code, see the "Live Bluesquare Components" section. 

### Troubleshooting

If you need to restart everything
``` {.sourceCode .shell}
docker compose stop && docker compose start
```

If you encounter problems, you can try to rebuild everything from
scratch.

``` {.sourceCode .shell}
# kill containers
docker compose kill
# remove `iaso` container
docker compose rm -f iaso
# build containers
docker compose build
# start-up containers
docker compose up
```

### Jupyter Notebook

To run a Jupyter Notebook, just copy the env variable from runaisasdev.sh, activate the virtualenv and run

``` {.sourceCode .bash}
python manage.py shell_plus --notebook
```

### Testing prod js assets in development

During local development, by default, the Javascript and CSS will be loaded from
a webpack server with live reloading of the code. To locally test the compiled
version as it is in production ( minified and with the same compilation option).
You can launch docker compose with the `TEST_PROD=true` environment variable
set.

e.g `TEST_PROD=true docker compose up`

This can be useful to reproduce production only bugs. Please also test with this
configuration whenever you modify webpack.prod.js to validate your changes.

Alternatively this can be done outside of docker by running:

1. `npm run webpack-prod` to do the build
2. Launching the django server with `TEST_PROD`
   e.g. `TEST_PROD=true python manage.py runserver`.
