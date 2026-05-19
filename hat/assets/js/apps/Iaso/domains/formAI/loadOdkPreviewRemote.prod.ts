import type { OdkPreviewMountProps } from '../../types/odkPreview';

type OdkPreviewMountModule = {
    mountOdkPreview: (
        el: HTMLElement,
        props: OdkPreviewMountProps,
    ) => () => void;
};

type FederationRemote = {
    init: (shareScope: Record<string, unknown>) => Promise<void>;
    get: (module: string) => Promise<unknown>;
};

declare const __ODK_PREVIEW_REMOTE_ENTRY__: string;

let mountPromise: Promise<OdkPreviewMountModule> | null = null;

function parseMountModule(module: unknown): OdkPreviewMountModule {
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

async function unwrapFederationModule(module: unknown): Promise<unknown> {
    let current = module;
    for (let i = 0; i < 3 && typeof current === 'function'; i += 1) {
        current = await (current as () => unknown)();
    }
    return current;
}

async function loadFromRemoteEntry(): Promise<OdkPreviewMountModule> {
    const remote = (await import(
        /* webpackIgnore: true */
        __ODK_PREVIEW_REMOTE_ENTRY__
    )) as FederationRemote;

    if (typeof remote?.init !== 'function' || typeof remote?.get !== 'function') {
        throw new Error(
            `Invalid ODK preview remoteEntry (${__ODK_PREVIEW_REMOTE_ENTRY__})`,
        );
    }

    await remote.init({});
    return parseMountModule(
        await unwrapFederationModule(await remote.get('./mount')),
    );
}

export function loadOdkPreviewMount(): Promise<OdkPreviewMountModule> {
    if (!mountPromise) {
        mountPromise = loadFromRemoteEntry();
    }
    return mountPromise;
}
