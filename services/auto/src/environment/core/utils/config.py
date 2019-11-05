import collections


def extend_config(source, overrides):
    """
    Update a nested dictionary or similar mapping.
    Modify ``source`` in place.
    """
    for key, value in overrides.items():
        if isinstance(value, collections.Mapping) and value:
            returned = extend_config(source.get(key, {}), value)
            source[key] = returned
        else:
            source[key] = overrides[key]
    return source