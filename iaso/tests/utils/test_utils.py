from pprint import pprint


def var_dump(what):
    if type(what) is dict:
        pprint(what)
    elif type(what) is list:
        for t in what:
            pprint(t)
    else:
        try:
            pprint(what.__dict__)
        except:
            pprint(what)


# borrowed from django snippets website, modified to handle django related (prefetched) relationships
def obj_compare(obj1, obj2, excluded_keys=["_state", "_django_version"], related_objects=[]):
    d1, d2 = obj1.__dict__, obj2.__dict__
    old, new = {}, {}
    for k, v in d1.items():
        if k in excluded_keys:
            continue
        try:
            if v != d2[k]:
                old.update({k: v})
                new.update({k: d2[k]})
        except KeyError:
            old.update({k: v})

    for related in related_objects:
        related_obj1 = getattr(obj1, related)
        related_obj2 = getattr(obj2, related)
        for obj1_related, obj2_related in zip(related_obj1, related_obj2):
            related_old, related_new = obj_compare(obj1_related, obj2_related, excluded_keys)
            if related_old or related_new:
                old.update({related: related_old})
                new.update({related: related_new})

    return old, new
