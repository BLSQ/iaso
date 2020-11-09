import hashlib


def calculate_file_md5(file):
    if not file:
        return ""
    md5 = hashlib.md5()
    for chunk in file.chunks():
        md5.update(chunk)
    return md5.hexdigest()
