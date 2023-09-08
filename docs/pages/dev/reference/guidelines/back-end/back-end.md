Backend and API Guidelines
==========================

## Important considerations
Please do a rough design before any implementation and discuss it with the rest of the team. It doesn't need to be too detailed but you should have at least a list of Model, the important fields on it, the security model and what endpoint you will add.

### Security
When Adding New feature that will add Model and API please think about the security model.
You can start by asking yourself these questions:

1. Which user should have access to this?
2. How to implement the multi-tenant
3. Are new permission needed?
4. Is the item listable/readable by user without the permission to implement Filter dropdown. For example users without the Form permission but with the Submission permission can still list Form from the API to be able to filter Instance by Form

### Tenancy
Iaso is multi tenant. Tenant are called and represented by the model `Account`. It represents roughly one client org or country. It also represents the natural limit of right for a user.

So all new model and API per default should support tenancy. It's kind of annoying  to add it later.

We have two kind of tenancy, one per Project, one per Account. A Project represent a mobile app, there might be several linked to an account. You will have to consider which want you one to use. In some case it might be both.

In some case if your new model is linked to existing one it might derive the tenancy from there (for example FormVersion derive their tenancy from Form). 

In practice this will consist on:
1. adding a ForeignKey to Account or Project on your model.
2. At creation 
2. in your ViewSet filtering on the Object in the account (see filtering for user)

In most case if this an API for the Mobile the tenancy will be per project. But if that's not the case and  you are really not sure, there is nobody to ask and you need to advance, add it on the Account it will be simpler.


Don't hesitate to ask if you don't understand what tenancy means or how it works.

### In the broad lines adding a complete new feature will consist of

1. The model(s): The modelisation in the Database
2. The serializer(s): Which decide which field  are returned to the client. But also which field(s) are accepted for creating and modifying object
3. The ViewSet(s) which represent the Endpoints (GET PATCH, POST DELETE etc...)
4. The routing, tell which url we use. `/api/yourmodel`
5. The security model : Who can see and modify what and how.

## New Model implementation 
Always add the field `created_at`, `updated_at`. This allow us the minimum of traceability and is useful in debug.
```python
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```
You might need Soft delete (see Soft Delete section)

Don't forget the tenancy.

Examples: There is a very simple Model/API example in the directory `plugins/tests` that you can use as a template.

## API
Please use serializers !

This will allow the API to be autodocumented in the swagger and the browsable API interface. You can check the swagger at /swagger/

For the ViewSet, always^ inherit  ModelViewSet from iaso.api.common, not the one from DRF !
This will handle the Pagination that is particular to Django correctly out of the box.

^ Except in some case obviously but it should be the default

For the default case you ModelViewSet should be very simple, and you should not have to reimplement `def list()` and `def create()` etc... if you properly did the Serializer and inherited from `iaso.api.common.ModelViewset`


### Filtering for user
Per default you will want to filter what is viewable by the correctly connected user (at minimum for the tenancy, see relevant section)

To do so add a `get_queryset()` method on your ViewSet which will filter the queryset on the user. It's not a bad idea to move the logic of that code directly on your Model queryset by adding a `Queryset.for_user(user: User)` on your model so we can reuse it on other models. See for example TeamQuerySet.


### Permissions
We use the DRF system with `permission_class ` see DRF Doc. See also `plugins/test/api.py` for an example.

By default all the API require to be logged but any user can post GET / POST / PATCH / DELETE so beware of that.

Further restriction can be added using `http_method_names = ["put"]` if you want to be extra sure, but that shouldn't be the only check method.

Do not hesitate to put test to check that the method are effectively restricted to both authorized and unauthenticated user so they are not re-enabled by default.

If you want to check if an user has a permission there is a HasPermission class in `iaso.api.common.py`
TODO : expand section


### Filtering
Set the `filter_backends` config key in your ViewSet, with per default at least, the backends  `filters.OrderingFilter`  and `DjangoFilterBackend`

```python
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,

    ]
```

This will allow ordering and filtering on the key present on the model automatically.

The front dev will push you to include special filter with Javascript case name like `FormId` or stuff which will require special case in list() because that's what they are used to but in 99% of the case this is not needed and there is already a filter in python case `form_id`. The normal django operator can also be used `__in` for list, `__gte` for `>=` , `iexact` to ignore case, etc..

See the field lookup for the complete reference
`https://docs.djangoproject.com/en/4.1/ref/models/querysets/#field-lookups`

All these filters are conveniently listed in the swagger for each endpoint and in the browsable API

If your model use SoftDelete include the `DeletionFilterBackend` filter. See the SoftDelete section

```
        DeletionFilterBackend,
```


If you need more control on how fields can be used for ordering and filtering you can respectively use `ordering_fields` and `filterset_fields`. See the django-filter and drf doc.

Frontend expect "big" api to accept a `search` filter which usually does a `icontains` on any of the model StringField (e.g. name or description) or related model (e.g the org unit name).

The `filters.OrderingFilter` use the `?order_by` query parameters, multiple field can be specified, separated by `,`,  `-` in front of the field can be used to specify to reverse the order

### Annotation for ordering and filtering
In very special case if you need strange manipulation for ordering or filtering,
adding an annotation on the queryset might help a lot. Since it does all the calculation on the database side, this allows use to add filter on fields that would otherwise not be possible without retrieving a lot of data on the backend. 

You might need to add them in  `ordering_fields` and `filterset_fields`. (TODO Olivier : check)
### Mobile
If this API is accessible via mobile, add a separate endpoint for the mobile to use,
in `/api/mobile`, even if it is the same as the "regular" `web` endpoint and that you connect it to the same ViewSet. This allows us flexibility if we have to break compatibility in the future.


For date in new API endpoint we use the RFC format (2022-03-02 23:34...) that is the default in DRF so there is nothing to be done. Old endpoint might still use the old format in Timestamp.

In the endpoint for mobile we  always use Timestamp. You can use TimestampField and DateTimestampField in your Serializer for this.


Take special care when modifying the API used by the mobile, we don't have a complete list,
but we still have old version of the APP using very old endpoints that newer version don't use anymore.


For API endpoint that the mobile APP will POST to, you should check with Martin if you may need the decorator `@safe_api_import` to ensure no data is lost. See `/iaso/hat/vector_control/README.md`

### CSV and XLS export
For data that will be presented as a table, we will want to provide
CSV and XLS export to the user in nearly all cases. 

We don't use the CSV export provided by DRF for that and use a bit of code that we copy  past and should really be refactored.

TODO: Expand section

### SoftDelete
Soft Delete is a way to mark an Object as deleted without actually deleting it
from the database. That way we can still show them to user in the interface it
they choose to and the user can restore it easily.

We have a standard way to implement it:
- Have your model inherit from the SoftDelete.
- This will add the deleted_at field. When the field is null it's not deleted
 if it contains a data it is deleted.

In the ViewSet add the filter DeletionFilterBackend.

Test that you can restore by doing a patch on your row on the `deleted_at` fields



#### Permissions
if you add a new permission, don't forget to add it in the Frontend, or it will not be displayed properly. See the instruction on the top of `menupermissions/models.py`

### Django Admin
If you add New model, add them in the Admin if you don't know which fields or filter to add just add at least the minimum, we can expand it latter.

Minimum Admin for a Model (BlogPost in this Example), in admin.py
```
class BlogPostAdmin(admin.ModelAdmin):
    pass

admin.site.register(BlogPost, BlogPostAdmin)
```

If you want a base to be a mot more fancy:
```
    search_fields = ("title", "content")
    list_display = ("title", "author", "created_at", "updated_at")
    date_hierarchy = "created_at"
    list_filter = ("author", "updated_at")
    readonly_fields = ("created_at", "updated_at")

```

Configuration settings
======================
We configure the Iaso deployement (the server) via environment flags. So if you add something configurable on the whole server level do it that way. See https://12factor.net/config if your are not familiar with the philosophy. 

Note :There are of course some exceptions and thus some settings are configured in the Database. Notably for the Polio plugins. But please keep that exceptional.

You can change your own local configuration in the file `.env`. Do note that if you make any modification in your `.env` or  in your `docker-compose.yml` file. You will need to restart the whole docker-compose for it to take effect (Ctrl-c your current docker-compose and bring it back up with `docker-compose up`


If you add a new Environement variable to allow some configuration:
1. Do not access the Enviroement variable directly from your python code !
1. Instead add it as a variable in the `settings.py`.
1. Add a comment explaing what this variable does.
1. Always provide a default value
1. To allow developer to change the variable locally add it in docker-compose.yml

Also [KISS](https://en.wikipedia.org/wiki/KISS_principle), the less configuration the better !

There is no comprehensive documentation of all the configuration settings except what is in settings.py so it's important that you comment it well !

Example
-------
1. `settings.py`
```
# Application customizations
APP_TITLE = os.environ.get("APP_TITLE", "Iaso")
```
2. Docker-compose
```diff
diff --git a/docker-compose.yml b/docker-compose.yml
index 057b81e39..49b29ac30 100644
--- a/docker-compose.yml
+++ b/docker-compose.yml
@@ -44,6 +44,7 @@ services:
       THEME_PRIMARY_BACKGROUND_COLOR:
       FAVICON_PATH:
       LOGO_PATH:
+      APP_TITLE:
       SHOW_NAME_WITH_LOGO:
       RDS_USERNAME: postgres
       RDS_PASSWORD: postgres
```
3. Your python code
```
from django.conf import settings
settings.APP_TITLE
```






Feature Flags
=============

Feature flags allow to enable special feature or behaviour for our clients.
The use case are: certain workflow that are particular to a client use case or feature that are still in development and that we are co-developing with the client.

Example of feature flag: Enable editing an org unit geography directly via the web map or requiring user to log in into the mobile app to submit.

We have two kind of flags in iaso: Mobile and Web

1. To control how the Mobile application behave. Model `FeatureFlag` that are linked to `Project` (there might have multiple Mobile application per account)
2. Model `AccountFeatureFlag` for the whole account. It is mainly used to control the behaviour of the web frontend.

The list of flags are stored in database tables, to add a new Flag migration are used.

Usually client can control which Project/Mobile flag they have but not the one on the Account level.


To toggle a Mobile Feature flag for a client, add it in the dashboard -> Admin -> Projects -> Edit a project -> `Options`. 

To toggle an Account Feature flag, it is in the django Admin



Adding a new Feature Flag via a Migration
-----------------------------------------
For example a a Project Feature Flag


1. Create an empty migration:
  `python manage.py makemigrations --empty yourappname`
2. Open the generated migration file, and adapt it to Create the migration.
3. It should look like this
```python
def create_feature_flags(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.create(
        code="CHECK_POSITION_FOR_FORMS",
        name="Mobile: Enforce users are within reach of the Org Unit before starting a form.",
    )


def destroy_feature_flags(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.filter(code="CHECK_POSITION_FOR_FORMS").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0150_profile_home_page"),
    ]

    operations = [
        migrations.RunPython(create_feature_flags, destroy_feature_flags),
    ]
```
4. Run black on it
5. Add the file in git


See https://docs.djangoproject.com/en/4.0/topics/migrations/#data-migrations

Typing and annotations
------
If you use an annotate and mypy complains when using the field. You can add the field on the model using Annotated. for example:



```python
from typing_extensions import Annotated, TypedDict

class LastBudgetAnnotation(TypedDict):
    budget_last_updated_at: datetime


class MonSerializeur()
    def get_budget_last_updated_at(self, campaign: Annotated[Campaign, LastBudgetAnnotation]):
        if campaign.budget_last_updated_at:
            return campaign.budget_last_updated_at.strftime("%Y-%m-%d")


```

Do not use the `WithAnnotations` from django-stubs. it doesn't work with our setup. I think it's a problem of python 3.8

# Glossary
* DRF: Django Rest Framework, the magic framework we use to generate the API
* mypy: Tool used to check the 
* ci: continuous integration, it the fact that we launch the test on github on each commit
* There is a Glossary of common Model in the Iaso root Readme. also check it


# FAQ
## I added a new environement variable in my .env but it is not accessible from python or in the `settings.py`
The new environment variable need to be listed in the docker-compose.yml

## Logging is broken
Symptom : The request are not displayed in the the sever console, or in productoin ` /var/app/log`

Someone probably imported a function from the `tests` directory, which disable logging. Please don't do that. Move the imported code elsewhere. See https://github.com/BLSQ/iaso/commit/b22b1bcc31a5b05650b675a3c168285103f9bcf8

## in prod how to see the log
`journalctl -u web`