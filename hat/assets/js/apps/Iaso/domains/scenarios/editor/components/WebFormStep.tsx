import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Box } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

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
};

/** The step's form in ODK web-forms (as in Form AI), prefilled as the phone would; submitting it records the step. */
export const WebFormStep: FunctionComponent<Props> = ({ xform, onSubmit }) => {
    const frame = useRef<HTMLIFrameElement>(null);
    // a new form (or the same form prefilled differently) is a new web-forms instance
    const [frameKey, setFrameKey] = useState(0);
    useEffect(() => setFrameKey(key => key + 1), [xform]);

    const handleLoad = useCallback(() => {
        // web-forms listens once its app is mounted
        setTimeout(() => {
            // no submitDisabledMessage: submitting is allowed
            frame.current?.contentWindow?.postMessage(
                { type: 'load-form-xml', xml: xform },
                '*',
            );
        }, 500);
    }, [xform]);

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
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSubmit]);

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
