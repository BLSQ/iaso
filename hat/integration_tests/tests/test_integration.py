from django.test import tag
# Use LiveServerTestCase since our static files are already at STATIC_ROOT
# To see, search for STATIC_ROOT in
# https://docs.djangoproject.com/en/1.10/_modules/django/test/testcases/#LiveServerTestCase
# StaticLiveServerTestCase does not work, needs STATICFILES_DIRS defined
from django.test.testcases import LiveServerTestCase

from hat.common.utils import run_cmd

from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import os
from sauceclient import SauceClient

# only used by non-travis runs
import datetime

# Tell django which port to bind to, so it can be exposed for docker
os.environ['DJANGO_LIVE_TEST_SERVER_ADDRESS'] = '0.0.0.0:8081'

# Meta things for saucelabs (ignored for now)
SAUCE_USERNAME = os.environ.get('SAUCE_USERNAME', '')
SAUCE_ACCESS_KEY = os.environ.get('SAUCE_ACCESS_KEY', '')

build = 'Sense HAT Dashboard - ' + \
        os.getenv(
            'TRAVIS_BUILD_NUMBER',
            'local {}'.format(datetime.datetime.now()))

sauce_url = 'http://{0}:{1}@ondemand.saucelabs.com:80/wd/hub' \
                .format(SAUCE_USERNAME, SAUCE_ACCESS_KEY)
sauce_api = SauceClient(SAUCE_USERNAME, SAUCE_ACCESS_KEY)

capabilities = {
    'browserName': "chrome",
    'version': "52",
    'build': build,
    'tags': ['HAT-dashboard'],
}

# This is used on travis to connect to the right tunnel
tunnel_id = os.getenv('TRAVIS_JOB_NUMBER', None)
if tunnel_id:
    capabilities['tunnel-identifier'] = tunnel_id


# The tag is used to separate those tests from the 'normal' test run
@tag('selenium')
class SeleniumTestCase(LiveServerTestCase):
    fixtures = ['locations', 'users', 'patients', 'cases']

    def setUp(self):
        super().setUp()
        capabilities['name'] = self.id()

        self.browser = webdriver.Remote(
           command_executor=sauce_url,
           desired_capabilities=capabilities
        )

    def tearDown(self):
        if hasattr(self, 'browser'):
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
            orig_err_fail = len(result.errors) + len(result.failures)
        else:
            orig_err_fail = 0

        super().run(result)

        if not hasattr(self, 'browser'):
            return

        # new errors emerged from this test run:
        if len(result.errors) + len(result.failures) > orig_err_fail:
            sauce_api.jobs.update_job(self.browser.session_id, passed=False)
        # passed
        else:
            sauce_api.jobs.update_job(self.browser.session_id, passed=True)

    def login(self, username, password):
        # this form comes from django views, so skip data-qa here
        username_input = self.browser.find_element_by_id('id_username')
        username_input.clear()
        username_input.send_keys(username)

        password_input = self.browser.find_element_by_id('id_password')
        password_input.clear()
        password_input.send_keys(password)

        login_form = self.browser.find_element_by_css_selector('[data-qa=login-form]')
        login_form.submit()

        # this is how we wait for elements
        # http://selenium-python.readthedocs.io/waits.html#explicit-waits
        wait = WebDriverWait(self.browser, 10)
        element = wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, '[data-qa=logged-in-marker]')))

        self.assertEqual(element.get_attribute('content'), username)

    def test_front_page_and_static_files(self):
        self.browser.get('http://localhost:8081/login')
        loginpage_text = self.browser.find_element_by_tag_name('body').text
        self.assertIn('Sense HAT', loginpage_text)

        # check that static files are correctly loaded
        stylesheet_href = self.browser.find_element_by_tag_name('link').get_attribute('href')
        stylesheet_content = run_cmd(['curl', stylesheet_href])
        self.assertIn('font-family', stylesheet_content, msg='Did not load CSS File')

    def test_login(self):
        self.browser.get('http://localhost:8081/login')
        # see https://github.com/eHealthAfrica/sense-hat#fixtures for available users
        self.login('admin', 'adminadmin')
