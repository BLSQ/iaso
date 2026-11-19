import hashlib
import io

from typing import BinaryIO, Optional

from Crypto.Cipher import AES
from Crypto.Hash import SHA1
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad as pkcs7_pad, unpad
from django.core.files import File


def calculate_md5(file_obj: File, chunk_size: int = 8192) -> str:
    if not file_obj:
        return ""

    hasher = hashlib.md5()

    file_original_position = file_obj.tell()

    file_obj.seek(0)
    for chunk in file_obj.chunks(chunk_size):
        hasher.update(chunk)

    file_obj.seek(file_original_position)  # Restore original position

    return hasher.hexdigest()


def file_content_changed(old_md5: Optional[str], new_file: File) -> bool:
    """Return True if new_file content differs from the previously stored md5."""
    if not old_md5:
        return True
    return old_md5 != calculate_md5(new_file)


class PasswordCipher:
    """AES encryption with a password, in the format read by the mobile app.

    Encryption settings:
    - 256 bits (32 bytes) key from PBKDF2 key derivation function (with salt of
      32 bytes, 1234 iteration and HMAC SHA-1)
    - Mode: Cipher-Block Chaining (CBC), with PKCS7 padding

    See:
    - https://pycryptodome.readthedocs.io/en/latest/src/cipher/aes.html
    - https://pycryptodome.readthedocs.io/en/latest/src/protocol/kdf.html
    """

    SALT_SIZE = 32
    KEY_SIZE = 32
    PBKDF2_ITERATIONS = 1234
    BLOCK_SIZE = AES.block_size
    HEADER_SIZE = SALT_SIZE + BLOCK_SIZE

    def __init__(self, password: str, salt: Optional[bytes] = None, iv: Optional[bytes] = None):
        """To encrypt, leave out `salt` and `iv` so that random ones are picked."""
        self.salt = get_random_bytes(self.SALT_SIZE) if salt is None else salt
        key = PBKDF2(password, self.salt, dkLen=self.KEY_SIZE, count=self.PBKDF2_ITERATIONS, hmac_hash_module=SHA1)
        self._aes = AES.new(key, AES.MODE_CBC, iv=iv)

    @property
    def header(self) -> bytes:
        return self.salt + self._aes.iv

    def encrypt(self, data: bytes, *, pad: bool = False) -> bytes:
        """
        Encrypt `data` using AES.

        The length must be a multiple of `BLOCK_SIZE` unless `pad` is set (use it for the last block).
        """
        return self._aes.encrypt(pkcs7_pad(data, self.BLOCK_SIZE) if pad else data)

    @classmethod
    def decrypt(cls, data: bytes, password: str) -> bytes:
        cipher = cls(password, salt=data[: cls.SALT_SIZE], iv=data[cls.SALT_SIZE : cls.HEADER_SIZE])
        return unpad(cipher._aes.decrypt(data[cls.HEADER_SIZE :]), cls.BLOCK_SIZE)


class StreamingEncryptionWriter(io.RawIOBase):
    """Streaming encryption writer."""

    def __init__(self, output: BinaryIO, password: str):
        super().__init__()
        self._cipher = PasswordCipher(password)
        self._output = output
        # As AES only encrypts whole blocks,
        # the last bytes written are buffered here until the block is full.
        self._partial_block = b""
        output.write(self._cipher.header)

    # Part of the io.IOBase interface.
    def writable(self) -> bool:
        return True

    def write(self, data) -> int:
        if self.closed:
            raise ValueError("write to closed file")
        data = bytes(data)
        buffered = self._partial_block + data
        whole_blocks_end = len(buffered) - len(buffered) % PasswordCipher.BLOCK_SIZE
        self._output.write(self._cipher.encrypt(buffered[:whole_blocks_end]))
        self._partial_block = buffered[whole_blocks_end:]
        return len(data)

    def close(self):
        if not self.closed:
            self._output.write(self._cipher.encrypt(self._partial_block, pad=True))
        super().close()
