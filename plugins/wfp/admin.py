from django.contrib import admin

from .models import (
    Beneficiary,
    Journey,
    Step,
    Visit,
)

admin.site.register(Beneficiary)
admin.site.register(Journey)
admin.site.register(Step)
admin.site.register(Visit)