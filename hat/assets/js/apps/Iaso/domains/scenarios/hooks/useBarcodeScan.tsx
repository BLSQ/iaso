import React, { ReactElement, useCallback, useState } from 'react';
import { QrScannerDialog } from '../editor/components/QrScannerDialog';

/**
 * The phone's scan button, for the form's barcode questions: the QR code read with the camera (or from a photo) in
 * this page, sent to web-forms. The dialog to render, and the handler for `WebFormStep`.
 */
export const useBarcodeScan = (): {
    onBarcode: () => Promise<string | null>;
    barcodeDialog: ReactElement;
} => {
    // the scan web-forms waits for
    const [pending, setPending] = useState<(code: string | null) => void>();

    const onBarcode = useCallback(
        () => new Promise<string | null>(resolve => setPending(() => resolve)),
        [],
    );
    const finish = useCallback(
        (code: string | null) => {
            pending?.(code);
            setPending(undefined);
        },
        [pending],
    );

    return {
        onBarcode,
        barcodeDialog: (
            <QrScannerDialog
                open={pending !== undefined}
                onClose={() => finish(null)}
                onDetect={finish}
            />
        ),
    };
};
