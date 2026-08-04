

This App is used to log API calls in the DB.

The idea is that the mobile app user may not have great internet connection where they are so in case of import problem we can fix it server side and not ask them to upload again.

    API endpoint to be logged as such are decorated with the @safe_api_import decorator.
    The request themselves are stored in the vector_control.APIImport model.
    To replay the failings requests use the django command reimport_failed_imports.py

This app used to be a lot of others things too before, hence the not matching name.
