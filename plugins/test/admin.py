from django.contrib import admin

from plugins.test.models import BlogPost


class BlogPostAdmin(admin.ModelAdmin):
    search_fields = ("title", "content")
    list_display = ("title", "author", "created_at", "updated_at")
    date_hierarchy = "created_at"
    list_filter = ("author", "updated_at")
    readonly_fields = ("created_at", "updated_at")


admin.site.register(BlogPost, BlogPostAdmin)
