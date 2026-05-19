import type { OdkPreviewMountProps } from '../../types/odkPreview';

type ViteFederationRemote = {
    init: (shareScope: Record<string, unknown>) => Promise<void>;
    get: (module: string) => Promise<() => Record<string, unknown>>;
};

type OdkPreviewMountModule = {
    mountOdkPreview: (
        el: HTMLElement,
        props: OdkPreviewMountProps,
    ) => () => void;
};

let mountModulePromise: Promise<OdkPreviewMountModule> | null = null;

const ODK_PREVIEW_DEV_HINT =
    'Start odk-preview: cd docker/odk-preview && npm run dev';

function assertMountModule(module: unknown): OdkPreviewMountModule {
    if (
        module &&
        typeof module === 'object' &&
        'mountOdkPreview' in module &&
        typeof (module as OdkPreviewMountModule).mountOdkPreview === 'function'
    ) {
        return module as OdkPreviewMountModule;
    }
    throw new Error('ODK preview did not expose mountOdkPreview');
}

/** Dev: Vite serves src/mount.ts with HMR (no federation / no build). */
async function loadDevMount(): Promise<OdkPreviewMountModule> {
    const baseUrl = __ODK_PREVIEW_DEV_MOUNT__;
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
    try {
        const module = await import(/* webpackIgnore: true */ url);
        return assertMountModule(module);
    } catch (error) {
        throw new Error(`${ODK_PREVIEW_DEV_HINT} (${baseUrl})`, {
            cause: error,
        });
    }
}

/** Prod: load federation remoteEntry.js from static files or ODK_PREVIEW_REMOTE_URL. */
async function loadFederationRemote(): Promise<OdkPreviewMountModule> {
    const entryUrl = __ODK_PREVIEW_REMOTE_ENTRY__;
    const remote = (await import(
        /* webpackIgnore: true */
        entryUrl
    )) as ViteFederationRemote;

    if (typeof remote?.init !== 'function' || typeof remote?.get !== 'function') {
        throw new Error(`Invalid ODK preview remoteEntry (${entryUrl})`);
    }

    await remote.init({});

    let module: unknown = await remote.get('./mount');
    for (let i = 0; i < 3 && typeof module === 'function'; i += 1) {
        module = await (module as () => unknown)();
    }

    return assertMountModule(module);
}

export function loadOdkPreviewMount(): Promise<OdkPreviewMountModule> {
    if (__ODK_PREVIEW_DEV__) {
        return loadDevMount();
    }

    if (!mountModulePromise) {
        mountModulePromise = loadFederationRemote();
    }

    return mountModulePromise;
}
