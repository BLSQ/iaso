## Documentation setup

Iaso's online documentation is built using mkDocs and deployed on Github pages. A CNAME record allows it to be available on docs.openiaso.com

### mkDocs setup

The mkDocs build is configured in mkdocs.yml, at the root of the project
The docs (markdown files) themselves as well as all other files related to mkdocs are located in the `/docs` folder

The dependencies are in `/docs/requirements.txt`. The file has been generated using `pip-compile` and `/docs/requirements.in`, except for the plugin `mkdocs-static-i18n` which had its version upgarded manually.

The markdown files follow the format `<name>.<locale>.md` to enable the localization plugin to display the right files

The menu is defined in mkdocs.yml:
- default menu is under `nav``
- french menu is under `plugins>i18n>languages>fr> nav`

We had to duplicate the whole menu because we have a nested menu. On the flip side this can allow us to have an entirely different menu structure for each language if we wish to do so.


## Github pages setup

There is a `deploy_doc` Github action that will build and deploy the documentation when pushing on `main`. 
The action itself will deploy the branch `gh-pages`. This in turn will trigger Github's own action to deploy the Github page.

IMPORTANT:
- There is a `CNAME` file in the `/docs` folder. Removing or altering it will break the redirection of `docs.openisao.com` to the Github page
- The `gh-pages` branch should be left alone. It only contains the built documentation and none of the Iaso code