import { createApp, type App as VueApp } from 'vue';
import { webFormsPlugin } from '@getodk/web-forms';
import OdkPreview from './OdkPreview.vue';
import './previewStyles.css';

export type OdkPreviewMountProps = {
    formXml: string;
    submitDisabledMessage?: string;
    onSubmit?: (data: unknown) => void;
};

export function mountOdkPreview(
    el: HTMLElement,
    props: OdkPreviewMountProps,
): () => void {
    const app: VueApp = createApp(OdkPreview, props);
    app.use(webFormsPlugin);
    app.mount(el);
    return () => {
        app.unmount();
    };
}
