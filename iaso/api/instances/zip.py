from collections.abc import AsyncGenerator, AsyncIterable
from stat import S_IFREG

from stream_zip import NO_COMPRESSION_64, AsyncMemberFile, async_stream_zip
from wrapt import sync_to_async

from iaso.models import Instance, InstanceFile


async def generate_zip(instance: Instance) -> AsyncGenerator[bytes]:
    """
    This function generates a zip and starts sending it to client chunk by
    chunk as soon as it's being created.

    The zip file contains all the files attached to the instance
    """

    async def generate_files_to_add_in_zip() -> AsyncIterable[AsyncMemberFile]:
        mode = S_IFREG | 0o600
        instance_files = await sync_to_async(list)(instance.instancefile_set.all())
        for instance_file in instance_files:

            async def file_content_iterator(file: InstanceFile) -> AsyncIterable[bytes]:
                with file.file.open("rb") as f:
                    while True:
                        chunk: bytes = f.read(65536)  # 65536 is the default int value for async_stream_zip's chunk_size
                        if not chunk:
                            break
                        yield chunk

            yield (
                instance_file.name,
                instance_file.created_at,
                mode,
                NO_COMPRESSION_64,
                file_content_iterator(instance_file),
            )

    zipped_chunks = async_stream_zip(generate_files_to_add_in_zip())

    async for zipped_chunk in zipped_chunks:
        yield zipped_chunk
