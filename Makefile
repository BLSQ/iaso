# Tests.
# =============================================================================

.PHONY: dbshell drop-test-db test

# make test
# make test TARGET=iaso.tests.api.test_profiles.ProfileAPITestCase
test:
	docker-compose exec iaso ./manage.py test \
	--noinput --keepdb --failfast --settings=hat.settings_test \
	$(TARGET)

# When the migration history is changed, we need to drop the DB before running the tests suite with `--keepdb`.
drop-test-db:
	docker-compose exec db psql -U postgres -c "drop database if exists test_iaso"

dbshell:
	docker-compose exec iaso ./manage.py dbshell

# Django.
# =============================================================================

.PHONY: django_admin

# make django_admin
# make django_admin COMMAND=shell_plus
# make django_admin COMMAND=createsuperuser
django_admin:
	docker-compose exec -ti iaso ./manage.py $(COMMAND)
