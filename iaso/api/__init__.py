from rest_framework import serializers
from rest_framework.renderers import HTMLFormRenderer


# The code below override Django Rest Framework so Many2Many and ForeignKey field are replaced by
# text input in the Browsable API's form. To avoid leaking data and slow down.
# see https://github.com/encode/django-rest-framework/issues/3905

HTMLFormRenderer.default_style[serializers.RelatedField] = {"base_template": "input.html", "input_type": "text"}

HTMLFormRenderer.default_style[serializers.ManyRelatedField] = {"base_template": "input.html"}
