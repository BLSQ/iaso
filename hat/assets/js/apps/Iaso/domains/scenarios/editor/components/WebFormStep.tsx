import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Box } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';
import { IntentRequest, IntentResult } from '../utils';

const styles: SxStyles = {
    // as tall as the screen allows on large ones: real forms are long
    frame: {
        width: '100%',
        height: { xs: 640, lg: 'max(640px, calc(100vh - 280px))' },
        border: 'none',
        display: 'block',
    },
};

type Props = {
    xform: string;
    onSubmit: (instanceXml: string) => void;
    // answers the form's external app questions (`intent`), as the phone's apps do; null: cancelled
    onIntent?: (request: IntentRequest) => Promise<IntentResult | null>;
    // scans a barcode question (camera, photo), as the phone's scan button; null: cancelled
    onBarcode?: (request: { reference: string }) => Promise<string | null>;
};

/** The step's form in ODK web-forms (as in Form AI), prefilled as the phone would; submitting it records the step. */
export const WebFormStep: FunctionComponent<Props> = ({
    xform,
    onSubmit,
    onIntent,
    onBarcode,
}) => {
    const frame = useRef<HTMLIFrameElement>(null);
    // a new form (or the same form prefilled differently) is a new web-forms instance
    const [frameKey, setFrameKey] = useState(0);
    useEffect(() => setFrameKey(key => key + 1), [xform]);

    const handleLoad = useCallback(() => {
        // web-forms listens once its app is mounted
        setTimeout(() => {
            // no submitDisabledMessage: submitting is allowed
            frame.current?.contentWindow?.postMessage(
                {
                    type: 'load-form-xml',
                    xml: xform,
                    intents: Boolean(onIntent),
                    barcodes: Boolean(onBarcode),
                },
                '*',
            );
        }, 500);
    }, [xform, onIntent, onBarcode]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.source !== frame.current?.contentWindow) {
                return;
            }
            if (
                event.data?.type === 'odk-submit' &&
                typeof event.data.xml === 'string'
            ) {
                onSubmit(event.data.xml);
            }
            // what the form asks this page: an app to launch, a barcode to scan
            const answer =
                (event.data?.type === 'odk-intent' && onIntent) ||
                (event.data?.type === 'odk-barcode' && onBarcode);
            if (answer) {
                const reply = (outcome: Record<string, unknown>) =>
                    frame.current?.contentWindow?.postMessage(
                        {
                            type: 'odk-host-result',
                            id: event.data.id,
                            ...outcome,
                        },
                        '*',
                    );
                answer(event.data.request)
                    .then(result => reply({ result }))
                    .catch(error =>
                        reply({ error: String(error?.message ?? error) }),
                    );
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSubmit, onIntent, onBarcode]);

    return (
        <Box>
            <Box
                component="iframe"
                key={frameKey}
                ref={frame}
                src={`${window.STATIC_URL ?? '/static/'}odk-preview/index.html`}
                title="ODK web-forms"
                onLoad={handleLoad}
                sx={styles.frame}
            />
        </Box>
    );
};
