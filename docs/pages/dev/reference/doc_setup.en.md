## Documentation setup

Iaso's online documentation is built using mkDocs and deployed on Github pages. A CNAME record allows it to be available on docs.openiaso.com

### mkDocs setup

The mkDocs build is configured in mkdocs.yml, at the root of the project
The docs (markdown files) themselves as well as all other files related to mkdocs are located in the `/docs` folder

The dependencies are in the `docs` dependency group of `pyproject.toml`, and locked in `uv.lock` together with the rest of the project.
Run the site locally with `uv run --only-group docs mkdocs serve` (see [How to run this site locally](../how_to/run_docs_locally.en.md)).

The markdown files follow the format `<name>.<locale>.md` to enable the localization plugin to display the right files

The menu is defined in mkdocs.yml:
- default menu is under `nav``
- french menu is under `plugins>i18n>languages>fr> nav`


## Github pages setup

There is a `deploy_doc` Github action that will build and deploy the documentation when pushing on `develop`. 
The action itself will deploy the branch `gh-pages`. This in turn will trigger Github's own action to deploy the Github page.

IMPORTANT:
- There is a `CNAME` file in the `/docs` folder. Removing or altering it will break the redirection of `docs.openisao.com` to the Github page
- The `gh-pages` branch should be left alone. It only contains the built documentation and none of the Iaso code