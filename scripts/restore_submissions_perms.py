def restore_submissions_perms():
    from django.contrib.auth.models import Permission, User

    users = User.objects.all()
    perm = Permission.objects.get(codename="iaso_submissions")

    for u in users:
        if not u.has_perm("iaso_submissions"):
            u.user_permissions.add(perm)
            u.save()
            print(perm, "==> permission added to ", u)


restore_submissions_perms()
