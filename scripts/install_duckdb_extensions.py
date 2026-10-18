"""Install the DuckDB extensions used by iaso, so they are not downloaded at runtime.

Without it, the first export using an extension in every new container (or test run) downloads it from
extensions.duckdb.org: ~5 s for the 47 MB postgres extension.

Run it at image build time, as the user running the app: the extensions are installed in its
~/.duckdb/extensions/<duckdb version>/, so they follow the duckdb version installed with them.
"""

import duckdb


# the extensions iaso INSTALLs, checked by iaso/tests/exports/test_duckdb_extensions.py
EXTENSIONS = [
    "excel",  # iaso/exports/tabular.py: xlsx exports
    "postgres",  # iaso/exports/duckdb_util.py: duckdb reading the django database
]


def install_extensions():
    with duckdb.connect() as connection:
        for extension in EXTENSIONS:
            connection.install_extension(extension)
            print(f"Installed duckdb {duckdb.__version__} extension {extension}")


if __name__ == "__main__":
    install_extensions()
