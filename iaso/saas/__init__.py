try:
    from .quotas import disk_space, project, submissions, user  # noqa: F401
    from .signals import disk_space, project, submissions, user  # noqa: F401
except ImportError:
    pass
