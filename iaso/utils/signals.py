from functools import wraps


def skip_if_raw(func):
    """
    Decorator to skip a signal when raw=True.

    Django passes this parameter when loading raw database records
    (e.g. during fixture loading), not through usual application logic.
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        if kwargs.get("raw"):
            return None
        return func(*args, **kwargs)

    return wrapper


def receiver_with_multiple_senders(signal, senders, **kwargs):
    """
    Based on django.dispatch.dispatcher.receiver

    Allows multiple senders so we can avoid using a stack of
    regular receiver decorators with one sender each.
    """

    def decorator(receiver_func):
        for sender in senders:
            if isinstance(signal, (list, tuple)):
                for s in signal:
                    s.connect(receiver_func, sender=sender, **kwargs)
            else:
                signal.connect(receiver_func, sender=sender, **kwargs)

        return receiver_func

    return decorator
