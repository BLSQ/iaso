import datetime

from django.test import SimpleTestCase
from lxml import etree

from iaso.scenarios.clock import expression_at, xform_at


AT = datetime.datetime(2026, 8, 15, 9, 30, tzinfo=datetime.timezone(datetime.timedelta(hours=1)))
TODAY = "date('2026-08-15')"
NOW = "date-time('2026-08-15T09:30:00.000+01:00')"

XFORM = b"""<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml"
        xmlns:jr="http://openrosa.org/javarosa" xmlns:odk="http://www.opendatakit.org/xforms">
  <h:head>
    <h:title>Clock</h:title>
    <model odk:xforms-version="1.0.0">
      <instance><data id="clock"><visit/><today_text/><stamp/><today/><child jr:template=""><name/></child></data></instance>
      <instance id="days"><root><item><name>past</name><day>2026-01-01</day></item></root></instance>
      <bind nodeset="/data/visit" type="date" constraint=". &lt;= today()" jr:constraintMsg="Not after today()"/>
      <bind nodeset="/data/today_text" type="string" calculate="format-date(today(), '%d/%m/%Y')"/>
      <bind nodeset="/data/stamp" type="dateTime" calculate="once(now())" relevant="/data/today != 'today()'"/>
      <bind nodeset="/data/today" type="date" jr:preload="date" jr:preloadParams="today"/>
      <setvalue event="odk-instance-first-load" ref="/data/visit" value="today()"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/visit"><label>Visit, <output value=" today() "/></label></input>
    <select1 ref="/data/today_text"><itemset nodeset="instance('days')/root/item[day &lt;= today()]"/></select1>
    <repeat nodeset="/data/child" jr:count="if(today() &gt; date('2026-07-01'), 2, 1)"><input ref="/data/child/name"/></repeat>
  </h:body>
</h:html>
"""


class ExpressionAtTestCase(SimpleTestCase):
    def test_today_and_now_take_the_steps_clock(self):
        self.assertEqual(expression_at("today()", AT), TODAY)
        self.assertEqual(expression_at("once(now())", AT), f"once({NOW})")
        self.assertEqual(expression_at("format-date(today (  ), '%d')", AT), f"format-date({TODAY}, '%d')")
        self.assertEqual(
            expression_at("decimal-date-time(now()) - decimal-date-time(today())", AT),
            f"decimal-date-time({NOW}) - decimal-date-time({TODAY})",
        )

    def test_string_literals_are_left_as_they_are(self):
        self.assertEqual(expression_at("concat('today()', \"now()\")", AT), "concat('today()', \"now()\")")
        # a quote of the other kind inside a literal doesn't end it
        self.assertEqual(expression_at('concat("it\'s", today())', AT), f'concat("it\'s", {TODAY})')

    def test_other_names_are_left_as_they_are(self):
        for expression in ["my-today()", "x:now()", "today.x()", "/data/today", "${today}", "today", "nowhere()"]:
            with self.subTest(expression):
                self.assertEqual(expression_at(expression, AT), expression)

    def test_the_date_is_the_local_one(self):
        # 23:30 in UTC-5 is already the next day in UTC: today() is the step's local date
        late = datetime.datetime(2026, 8, 15, 23, 30, tzinfo=datetime.timezone(datetime.timedelta(hours=-5)))

        self.assertEqual(expression_at("today()", late), TODAY)


class XFormAtTestCase(SimpleTestCase):
    def attribute(self, xform: bytes, xpath: str) -> str:
        namespaces = {"x": "http://www.w3.org/2002/xforms", "h": "http://www.w3.org/1999/xhtml"}
        [value] = etree.fromstring(xform).xpath(xpath, namespaces=namespaces)
        return value

    def test_the_xpath_of_the_form_takes_the_steps_clock(self):
        xform = xform_at(XFORM, AT)

        expected = {
            "//x:bind[@nodeset='/data/visit']/@constraint": f". <= {TODAY}",
            "//x:bind[@nodeset='/data/today_text']/@calculate": f"format-date({TODAY}, '%d/%m/%Y')",
            "//x:bind[@nodeset='/data/stamp']/@calculate": f"once({NOW})",
            "//x:setvalue/@value": TODAY,
            "//x:output/@value": f" {TODAY} ",
            "//x:itemset/@nodeset": f"instance('days')/root/item[day <= {TODAY}]",
            "//x:repeat/@*[local-name()='count']": f"if({TODAY} > date('2026-07-01'), 2, 1)",
        }
        for xpath, value in expected.items():
            with self.subTest(xpath):
                self.assertEqual(self.attribute(xform, xpath), value)

    def test_what_is_not_an_expression_is_left_as_it_is(self):
        xform = xform_at(XFORM, AT)

        unchanged = {
            # a message, a literal, the today metadata (filled by the engine itself), a path
            "//x:bind[@nodeset='/data/visit']/@*[local-name()='constraintMsg']": "Not after today()",
            "//x:bind[@nodeset='/data/stamp']/@relevant": "/data/today != 'today()'",
            "//x:bind[@nodeset='/data/today']/@*[local-name()='preloadParams']": "today",
            "//x:bind[@nodeset='/data/today']/@nodeset": "/data/today",
        }
        for xpath, value in unchanged.items():
            with self.subTest(xpath):
                self.assertEqual(self.attribute(xform, xpath), value)

    def test_without_a_clock_the_form_is_untouched(self):
        self.assertIs(xform_at(XFORM, None), XFORM)
