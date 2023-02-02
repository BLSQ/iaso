class DbRouter(object):
    """This router is here to allow foreign key between the `default` db and the `worker` db which are the same"""

    def allow_relation(self, _obj1, _obj2, **_hints):
        return True
