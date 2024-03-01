import os

from Crypto.Cipher import AES
from Crypto.Hash import SHA1
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad


def encrypt_file(file_path, file_name_in, file_name_out, password):
    """
    Encrypt a file using AES with following settings:
    - 256 bits (32 bytes) key from PBKDF2 key derivation function (with salt of
      32 bytes, 1234 iteration and HMAC SHA-1)
    - Mode: Cipher-Block Chaining (CBC)

    See:
    - https://pycryptodome.readthedocs.io/en/latest/src/cipher/aes.html
    - https://pycryptodome.readthedocs.io/en/latest/src/protocol/kdf.html
    """
    salt = get_random_bytes(32)
    key = PBKDF2(
        password,
        salt,
        dkLen=32,
        count=1234,
        hmac_hash_module=SHA1,
    )  # AES-256 key (32 bytes)

    data = ""
    with open(os.path.join(file_path, file_name_in), "rb") as file:
        data = file.read()

    cipher = AES.new(key, AES.MODE_CBC)
    ct_bytes = cipher.encrypt(pad(data, AES.block_size))

    file_path_out = os.path.join(file_path, file_name_out)
    with open(file_path_out, "wb") as file_enc:
        file_enc.write(salt)
        file_enc.write(cipher.iv)
        file_enc.write(ct_bytes)

    return file_path_out


def decrypt_file(file_path, file_name_in, file_name_out, password):
    """
    Decrypt a AES-256 encrypted file with the same settings as described in
    the `encrypt_file` function.
    """
    with open(os.path.join(file_path, file_name_in), "rb") as file_enc:
        salt = file_enc.read(32)
        iv = file_enc.read(16)
        ct = file_enc.read()

    key = PBKDF2(
        password,
        salt,
        dkLen=32,
        count=1234,
        hmac_hash_module=SHA1,
    )  # AES-256 key (32 bytes)

    cipher = AES.new(key, AES.MODE_CBC, iv=iv)
    decrypted_data = unpad(cipher.decrypt(ct), AES.block_size)

    file_path_out = os.path.join(file_path, file_name_out)
    with open(file_path_out, "wb") as file_dec:
        file_dec.write(decrypted_data)

    return file_path_out
