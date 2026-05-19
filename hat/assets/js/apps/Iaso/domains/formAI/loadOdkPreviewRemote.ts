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

/**
 * Loads the Vite Module Federation remote (odk-preview).
 * Webpack cannot consume it via `remotes:` — use init/get from remoteEntry.js instead.
 */
export function loadOdkPreviewMount(): Promise<OdkPreviewMountModule> {
    if (!mountModulePromise) {
        const entryUrl = __ODK_PREVIEW_REMOTE_ENTRY__;
        mountModulePromise = (async () => {
            const remote = (await import(
                /* webpackIgnore: true */
                entryUrl
            )) as ViteFederationRemote;

            await remote.init({});

            let module: unknown = await remote.get('./mount');
            // Vite federation: get() may return a factory, sometimes nested.
            for (let i = 0; i < 3 && typeof module === 'function'; i += 1) {
                module = await (module as () => unknown)();
            }

            if (
                module &&
                typeof module === 'object' &&
                'mountOdkPreview' in module &&
                typeof (module as OdkPreviewMountModule).mountOdkPreview ===
                    'function'
            ) {
                return module as OdkPreviewMountModule;
            }

            throw new Error(
                'ODK preview remote did not expose mountOdkPreview',
            );
        })();
    }

    return mountModulePromise;
}
