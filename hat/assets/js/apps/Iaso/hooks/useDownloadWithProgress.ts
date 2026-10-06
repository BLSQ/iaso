import { useCallback, useEffect, useRef, useState } from 'react';
import { openSnackBar } from '../components/snackBars/EventDispatcher';
import { errorSnackBar } from '../constants/snackBars';
import { iasoFetch } from '../libs/Api';

export type DownloadStatus = 'idle' | 'preparing' | 'downloading';

export type DownloadState = {
    // key of the download in progress (ex: the file format)
    key?: string;
    status: DownloadStatus;
    loadedBytes: number;
    // unknown when the server doesn't give the size
    totalBytes?: number;
};

const IDLE: DownloadState = { status: 'idle', loadedBytes: 0 };
// avoids re-rendering for every received chunk
const PROGRESS_REFRESH_MS = 250;

const getFilename = (response: Response): string | undefined => {
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return match ? decodeURIComponent(match[1]) : undefined;
};

const getTotalBytes = (response: Response): number | undefined => {
    // the exports give the file size in X-File-Size: Content-Length is removed when the response is gzipped
    const size =
        response.headers.get('X-File-Size') ??
        (response.headers.get('Content-Encoding')
            ? null
            : response.headers.get('Content-Length'));
    return size ? Number(size) : undefined;
};

const saveFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // revoking right after the click can cancel the download in some browsers
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

/**
 * Downloads a file through fetch instead of a plain link, so that the page knows when the server is still
 * preparing the file (long exports) and can show the download progress.
 */
export const useDownloadWithProgress = (): {
    download: (url: string, key: string, defaultFilename: string) => void;
    state: DownloadState;
} => {
    const [state, setState] = useState<DownloadState>(IDLE);
    const abortController = useRef<AbortController | undefined>();

    useEffect(() => () => abortController.current?.abort(), []);

    const download = useCallback(
        async (url: string, key: string, defaultFilename: string) => {
            const controller = new AbortController();
            abortController.current = controller;
            setState({ key, status: 'preparing', loadedBytes: 0 });
            try {
                const response = await iasoFetch(url, {
                    signal: controller.signal,
                });
                if (controller.signal.aborted) return;

                const totalBytes = getTotalBytes(response);
                setState({
                    key,
                    status: 'downloading',
                    loadedBytes: 0,
                    totalBytes,
                });

                const chunks: BlobPart[] = [];
                const reader = response.body?.getReader();
                if (reader) {
                    let loadedBytes = 0;
                    let lastRefresh = 0;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                        loadedBytes += value.length;
                        if (Date.now() - lastRefresh > PROGRESS_REFRESH_MS) {
                            lastRefresh = Date.now();
                            setState({
                                key,
                                status: 'downloading',
                                loadedBytes,
                                totalBytes,
                            });
                        }
                    }
                } else {
                    chunks.push(await response.blob());
                }
                if (controller.signal.aborted) return;

                saveFile(
                    new Blob(chunks, {
                        type: response.headers.get('Content-Type') ?? '',
                    }),
                    getFilename(response) ?? defaultFilename,
                );
            } catch (error) {
                if (!controller.signal.aborted) {
                    openSnackBar(errorSnackBar('downloadError', null, error));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setState(IDLE);
                }
            }
        },
        [],
    );

    return { download, state };
};
