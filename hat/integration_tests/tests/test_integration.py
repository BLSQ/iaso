from django.test import tag
# Use LiveServerTestCase since our static files are already at STATIC_ROOT
# To see, search for STATIC_ROOT in
# https://docs.djangoproject.com/en/1.10/_modules/django/test/testcases/#LiveServerTestCase
# StaticLiveServerTestCase does not work, needs STATICFILES_DIRS defined
from django.test.testcases import LiveServerTestCase

from hat.common.utils import run_cmd

from selenium import webdriver
import os
import sys
from sauceclient import SauceClient

# only used by non-travis runs
import datetime

os.environ['DJANGO_LIVE_TEST_SERVER_ADDRESS'] = '0.0.0.0:8080'

SAUCE_USERNAME = os.environ['SAUCE_USERNAME']
SAUCE_ACCESS_KEY = os.environ['SAUCE_ACCESS_KEY']

# tunnel_id = os.getenv('TRAVIS_JOB_NUMBER', None)
build = 'Sense HAT Dashboard - ' + os.getenv('TRAVIS_BUILD_NUMBER', 'local {}'.format(datetime.datetime.now()))

sauce_url = 'http://{0}:{1}@ondemand.saucelabs.com:80/wd/hub' \
                .format(SAUCE_USERNAME, SAUCE_ACCESS_KEY)
sauce_api = SauceClient(SAUCE_USERNAME, SAUCE_ACCESS_KEY)

capabilities = {
    'browserName': "chrome",
    'version': "52",
    'build': build,
    'tags': ['HAT-dashboard'],
}

# if tunnel_id:
#     capabilities['tunnel-identifier'] = tunnel_id


@tag('selenium')
class SeleniumTestCase(LiveServerTestCase):
    def setUp(self):
        super().setUp()
        capabilities['name'] = self.id()

        self.browser = webdriver.Remote(
           command_executor=sauce_url,
           desired_capabilities=capabilities
        )

    def tearDown(self):
        self.browser.quit()
        super().tearDown()

    # this is used to report the test result to Sauce:
    # http://www.piware.de/2012/10/python-unittest-show-log-on-test-failure/
    # while that is important for Travis (the builds there would fail anyway)
    # it makes it easier to find the right results in the saucelabs dashboard
    # HEADS UP: if we're parallelizing sauce runs, this needs to be modified
    def run(self, result=None):
        # gets the 'full suite' result so we need to compare to prev value
        if result:
            orig_err_fail = result.errors + result.failures

        super().run(result)

        # new errors emerged from this test run:
        if result.errors + result.failures > orig_err_fail:
            sauce_api.jobs.update_job(self.browser.session_id, passed=False)
        # passed
        else:
            sauce_api.jobs.update_job(self.browser.session_id, passed=True)

    def test_front_page_and_static_files(self):
        self.browser.get('http://localhost:8080/login')
        loginpage_text = self.browser.find_element_by_tag_name('body').text
        self.assertIn('Sense HAT', loginpage_text)

        stylesheet_href = self.browser.find_element_by_tag_name('link').get_attribute('href')
        stylesheet_content = run_cmd(['curl', stylesheet_href])
        self.assertIn('font-family', stylesheet_content)
