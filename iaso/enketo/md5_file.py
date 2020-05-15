import hashlib


DEFAULT_CHUNK_SIZE = 64 * 2 ** 10


def calculate_file_md5(file_):
    if not file_:
        return ""
    md5 = hashlib.md5()
    for chunk in file_.chunks():
        md5.update(chunk)
    return md5.hexdigest()


def calculate_data_md5(data, chunk_size=None):
    if not data:
        return ""
    if not chunk_size:
        chunk_size = DEFAULT_CHUNK_SIZE
    md5 = hashlib.md5()
    idx = 0
    while True:
        chunk = data[idx : idx + chunk_size]
        if not chunk:
            break
        md5.update(chunk)
        idx = idx + chunk_size
    return md5.hexdigest()


def calculate_md5(file_=None, data=None, chunk_size=None):
    if file_:
        return calculate_file_md5(file_)
    return calculate_data_md5(data, chunk_size=chunk_size)
