Frontend Assets Readme:
==========

Frontend assets include JS, CSS, translations and images. They are all handled by webpack. Most of the structure is taken from this blog post: http://owaislone.org/blog/webpack-plus-reactjs-and-django/

Frontend assets are mounted on the pages via the [django-webpack-loader](https://github.com/owais/django-webpack-loader)

### The 2 builds, dev and pred:

* 2 webpack configuration files: `webpack.dev.js` and `webpack.prod.js`.

* A JS production build is created inside the docker-file, via `npm run build`

* the `start_dev` entry point starts a webpack development server, that watches assets, rebuilds and does hot reloading of JS Components.


JS Build
----------

Each page has their own JS entry point (needs to be defined in both webpack files). On top of that, they load a common chunk, containing react, react-intl and other stuff that the `webpack common chunk` plugin finds is shared between the apps.


CSS Build
----------

The CSS build is separate, and can contain both `.sass` and `.css` files. They spit out a webpack build called styles.css

Translations
--------

Translations are extracted on the first webpack build. Just like the django translation strings, translations are downloaded for every travis build, and uploaded on teh `development` branch.

JS Unit Testing
--------

The JS Unit test setup is the same as Sense-HAT-Mobile, you can run tests and linting via `npm test`
