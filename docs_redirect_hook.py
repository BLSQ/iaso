"""
mkdocs native hook (docs: https://www.mkdocs.org/user-guide/configuration/#hooks) -
writes static HTML redirects for every page that moved during the 2026 pages/
folder flatten (removing the "topic/topic.md" wrapper-folder convention),
across all 3 built locales (root/default=en, fr/, es/).

Not using the mkdocs-redirects plugin here: it has no awareness of
mkdocs-static-i18n's locale-prefix + suffix-stripping output convention, so it
generated redirects pointing at URLs that don't actually exist in the built
site (verified empirically while doing this restructure). Writing the
(correct, verified) redirect files ourselves in on_post_build sidesteps that
entirely, with no extra dependency.

Each tuple is (old_dir, new_dir, old_html_name, new_html_name[, anchor]), all
relative to a docs_dir "root" that then gets a locale prefix ("", "fr", "es")
applied uniformly - mkdocs-static-i18n builds a full page tree per locale
(falling back to the default-locale content where no translation exists), so
a page that moved has the same old->new URL shape under every locale prefix.

The optional 5th element is a same-page anchor to append to the redirect
target - used when a whole page got merged into a *section* of another page
rather than getting a page of its own (e.g. use_form_ai.html merged into a
subsection of user_guide.html). Headings translate, so their anchor slugs
differ per locale (accents/apostrophes get stripped differently) - pass
either a plain string (same anchor for every locale) or a dict keyed by
locale prefix ("" for the default/en build, "fr", "es") when they differ.
A locale missing from the dict gets no anchor (plain page redirect) - use
this for a locale where the merged-into section doesn't exist yet.
"""

import posixpath

from pathlib import Path


LOCALE_PREFIXES = ["", "fr", "es"]  # "" = default locale (en), built at site root

MOVED_PAGES = [
    ("pages/dev/how_to/add_new_permission", "pages/dev/how_to", "add_new_permission.html", "add_new_permission.html"),
    (
        "pages/dev/how_to/attach_file_to_forms",
        "pages/dev/how_to",
        "attach_file_to_forms.html",
        "attach_file_to_forms.html",
    ),
    ("pages/dev/how_to/build_odk_preview", "pages/dev/how_to", "build_odk_preview.html", "build_odk_preview.html"),
    (
        "pages/dev/how_to/configure_black_on_vsc",
        "pages/dev/how_to",
        "configure_black_on_vsc.html",
        "configure_black_on_vsc.html",
    ),
    ("pages/dev/how_to/contribute", "pages/dev/how_to", "contribute.html", "contribute.html"),
    (
        "pages/dev/how_to/create_entities_in_web_ui",
        "pages/dev/how_to",
        "create_entities_in_web_ui.html",
        "create_entities_in_web_ui.html",
    ),
    (
        "pages/dev/how_to/create_entity_workflow",
        "pages/dev/how_to",
        "create_entity_workflow.html",
        "create_entity_workflow.html",
    ),
    (
        "pages/dev/how_to/create_forms_for_entities",
        "pages/dev/how_to",
        "create_forms_for_entities.html",
        "create_forms_for_entities.html",
    ),
    (
        "pages/dev/how_to/create_mobile_reports",
        "pages/dev/how_to",
        "create_mobile_reports.html",
        "create_mobile_reports.html",
    ),
    (
        "pages/dev/how_to/create_registry_in_web_ui",
        "pages/dev/how_to",
        "create_registry_in_web_ui.html",
        "create_registry_in_web_ui.html",
    ),
    ("pages/dev/how_to/debug_backend", "pages/dev/how_to", "debug_backend.html", "debug_backend.html"),
    ("pages/dev/how_to/deploy", "pages/dev/how_to", "deploy.html", "deploy.html"),
    ("pages/dev/how_to/embed_superset", "pages/dev/how_to", "embed_superset.html", "embed_superset.html"),
    (
        "pages/dev/how_to/exclude_featureflag_related_module",
        "pages/dev/how_to",
        "exclude_featureflag_related_module.html",
        "exclude_featureflag_related_module.html",
    ),
    ("pages/dev/how_to/hot_fix", "pages/dev/how_to", "hot_fix.html", "hot_fix.html"),
    (
        "pages/dev/how_to/iaso_special_question_names",
        "pages/dev/how_to",
        "iaso_special_question_names.html",
        "iaso_special_question_names.html",
    ),
    (
        "pages/dev/how_to/iaso_specific_intents",
        "pages/dev/how_to",
        "iaso_specific_intents.html",
        "iaso_specific_intents.html",
    ),
    (
        "pages/dev/how_to/manually_test_enketo",
        "pages/dev/how_to",
        "manually_test_enketo.html",
        "manually_test_enketo.html",
    ),
    (
        "pages/dev/how_to/openhexa-integration",
        "pages/dev/how_to",
        "openhexa-integration.html",
        "openhexa-integration.html",
    ),
    (
        "pages/dev/how_to/planning-pipeline-integration",
        "pages/dev/how_to",
        "planning-pipeline-integration.html",
        "planning-pipeline-integration.html",
    ),
    ("pages/dev/how_to/rebuild_front", "pages/dev/how_to", "rebuild_front.html", "rebuild_front.html"),
    ("pages/dev/how_to/run_docs_locally", "pages/dev/how_to", "run_docs_locally.html", "run_docs_locally.html"),
    ("pages/dev/how_to/run_smoke_tests", "pages/dev/how_to", "run_smoke_tests.html", "run_smoke_tests.html"),
    ("pages/dev/how_to/setup_dev_env", "pages/dev/how_to", "setup_dev_env.html", "setup_dev_env.html"),
    ("pages/dev/how_to/setup_dev_env", "pages/dev/how_to", "setuper.html", "setuper.html"),
    ("pages/dev/how_to/use_iaso_apis", "pages/dev/how_to", "use_iaso_apis.html", "use_iaso_apis.html"),
    ("pages/dev/how_to/use_plugins", "pages/dev/how_to", "use_plugins.html", "use_plugins.html"),
    ("pages/dev/how_to/use_tranlations", "pages/dev/how_to", "use_translations.html", "use_translations.html"),
    ("pages/dev/how_to/vscode_workspace", "pages/dev/how_to", "vscode_workspace.html", "vscode_workspace.html"),
    ("pages/dev/how_to/write_visit_on_nfc", "pages/dev/how_to", "write_visit_on_nfc.html", "write_visit_on_nfc.html"),
    ("pages/dev/reference/API/payments", "pages/dev/reference/API", "payments.html", "payments.html"),
    ("pages/dev/reference/analytics", "pages/dev/reference", "plausible-setup.html", "plausible-setup.html"),
    ("pages/dev/reference/audit", "pages/dev/reference", "audit.html", "audit.html"),
    ("pages/dev/reference/background_tasks", "pages/dev/reference", "background_tasks.html", "background_tasks.html"),
    ("pages/dev/reference/clamav", "pages/dev/reference", "clamav.html", "clamav.html"),
    (
        "pages/dev/reference/data_model_glossary",
        "pages/dev/reference",
        "data_model_glossary.html",
        "data_model_glossary.html",
    ),
    ("pages/dev/reference/doc_setup", "pages/dev/reference", "doc_setup.html", "doc_setup.html"),
    ("pages/dev/reference/docker", "pages/dev/reference", "docker.html", "docker.html"),
    ("pages/dev/reference/env_variables", "pages/dev/reference", "env_variables.html", "env_variables.html"),
    (
        "pages/dev/reference/front-end_reference",
        "pages/dev/reference",
        "front-end_reference.html",
        "front-end_reference.html",
    ),
    (
        "pages/dev/reference/guidelines/api",
        "pages/dev/reference/guidelines",
        "api_synchronization.html",
        "api_synchronization.html",
    ),
    ("pages/dev/reference/guidelines/back-end", "pages/dev/reference/guidelines", "back-end.html", "back-end.html"),
    ("pages/dev/reference/guidelines/front-end", "pages/dev/reference/guidelines", "front-end.html", "front-end.html"),
    ("pages/dev/reference/guidelines/git", "pages/dev/reference/guidelines", "git.html", "git.html"),
    ("pages/dev/reference/public_registry", "pages/dev/reference", "public_registry.html", "public_registry.html"),
    (
        "pages/dev/reference/sql_dashboard",
        "pages/dev/reference",
        "SQL_Dashboard_feature.html",
        "SQL_Dashboard_feature.html",
    ),
    ("pages/dev/reference/vector_control", "pages/dev/reference", "vector_control.html", "vector_control.html"),
    (
        "pages/users/how_to/convert_docx_to_md",
        "pages/users/how_to",
        "convert_docx_to_md.html",
        "convert_docx_to_md.html",
    ),
    (
        "pages/users/how_to/create_new_documentation_page",
        "pages/users/how_to",
        "create_new_documentation_page.html",
        "create_new_documentation_page.html",
    ),
    (
        "pages/users/how_to/edit_documentation",
        "pages/users/how_to",
        "edit_documentation.html",
        "edit_documentation.html",
    ),
    ("pages/users/how_to/run_ETL", "pages/users/how_to", "run_ETL.html", "run_ETL.html"),
    (
        "pages/users/how_to/setup_an_empty_iaso_account",
        "pages/users/how_to",
        "setup_an_empty_iaso_account.html",
        "setup_an_empty_iaso_account.html",
    ),
    (
        "pages/users/how_to/setup_dhis2_login_in_iaso",
        "pages/users/how_to",
        "setup_dhis2_login_in_iaso.html",
        "setup_dhis2_login_in_iaso.html",
    ),
    ("pages/users/how_to/use_form_ai", "pages/users/how_to", "use_form_ai.html", "use_form_ai.html"),
    # merged into a subsection of user_guide.html rather than getting its own page:
    (
        "pages/users/how_to",
        "pages/users/reference",
        "use_form_ai.html",
        "user_guide.html",
        {"": "create-your-form-with-ai", "fr": "creer-votre-formulaire-avec-lia"},
        # no "es" entry: the ES user_guide.html has no Form AI section yet (there
        # was never an ES use_form_ai.es.md to move), so ES gets a plain redirect
        # to the top of user_guide.html instead of a (nonexistent) anchor.
    ),
    ("pages/users/reference/how_we_work", "pages/users/reference", "how_we_work.html", "how_we_work.html"),
    ("pages/users/reference/iaso_concepts", "pages/users/reference", "iaso_concepts.html", "iaso_concepts.html"),
    ("pages/users/reference/iaso_mobile", "pages/users/reference", "iaso_mobile.html", "iaso_mobile.html"),
    ("pages/users/reference/iaso_modules", "pages/users/reference", "iaso_modules.html", "iaso_modules.html"),
    ("pages/users/reference/iaso_web", "pages/users/reference", "user_guide.html", "user_guide.html"),
    ("pages/users/reference/interop", "pages/users/reference", "interop.html", "interop.html"),
]

REDIRECT_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <link rel="canonical" href="{target}">
    <script>var anchor=window.location.hash.substr(1);location.href="{target}"+(anchor?"#"+anchor:"")</script>
    <meta http-equiv="refresh" content="0; url={target}">
</head>
<body>
You're being redirected to a <a href="{target}">new destination</a>.
</body>
</html>
"""


def on_post_build(config, **kwargs):
    site_dir = Path(config["site_dir"])
    written = 0
    for entry in MOVED_PAGES:
        old_dir, new_dir, old_name, new_name = entry[:4]
        anchor_spec = entry[4] if len(entry) > 4 else None
        for prefix in LOCALE_PREFIXES:
            old_path = site_dir / prefix / old_dir / old_name
            new_path = site_dir / prefix / new_dir / new_name
            if not new_path.exists():
                continue  # this locale wasn't actually built for this page
            if old_path.exists():
                continue  # a real page already lives at the old path - don't clobber it
            target = posixpath.relpath(
                (prefix + "/" + new_dir + "/" + new_name).strip("/"),
                start=(prefix + "/" + old_dir).strip("/"),
            )
            anchor = anchor_spec.get(prefix) if isinstance(anchor_spec, dict) else anchor_spec
            if anchor:
                target += "#" + anchor
            old_path.parent.mkdir(parents=True, exist_ok=True)
            old_path.write_text(REDIRECT_TEMPLATE.format(target=target), encoding="utf-8")
            written += 1
    print(f"docs_redirect_hook: wrote {written} redirect page(s) for the pages/ restructure")
