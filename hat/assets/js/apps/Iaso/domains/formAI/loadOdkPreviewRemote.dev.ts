import type { OdkPreviewMountProps } from '../../types/odkPreview';

type OdkPreviewMountModule = {
    mountOdkPreview: (
        el: HTMLElement,
        props: OdkPreviewMountProps,
    ) => () => void;
};

declare const __ODK_PREVIEW_DEV_MOUNT__: string;

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

export function loadOdkPreviewMount(): Promise<OdkPreviewMountModule> {
    const url = `${__ODK_PREVIEW_DEV_MOUNT__}?t=${Date.now()}`;
    return import(/* webpackIgnore: true */ url)
        .then(parseMountModule)
        .catch(error => {
            throw new Error(
                'Start odk-preview: cd docker/odk-preview && npm run dev',
                { cause: error },
            );
        });
}
