import React from 'react';
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { QrScannerDialog, readQrCode } from './QrScannerDialog';

describe('QrScannerDialog', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('offers an image when the browser has no camera', () => {
        vi.stubGlobal('navigator', { ...navigator, mediaDevices: undefined });

        renderWithThemeAndIntlProvider(
            <QrScannerDialog open onClose={vi.fn()} onDetect={vi.fn()} />,
        );

        expect(screen.getByRole('alert')).toHaveTextContent(
            "The camera isn't available (this browser has no camera access): choose a photo of the QR code instead.",
        );
        expect(screen.getByText('Choose an image')).toBeInTheDocument();
        // no camera: no word about its effects
        expect(screen.queryByText(/camera effects/)).toBeNull();
    });

    it('stops the camera when closed', async () => {
        // jsdom plays no video
        vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
        const stopTrack = vi.fn();
        const getUserMedia = vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: stopTrack }],
        });
        vi.stubGlobal('navigator', {
            ...navigator,
            mediaDevices: { getUserMedia },
        });

        const { rerender } = renderWithThemeAndIntlProvider(
            <QrScannerDialog open onClose={vi.fn()} onDetect={vi.fn()} />,
        );
        // the back camera
        expect(getUserMedia).toHaveBeenCalledWith({
            video: { facingMode: 'environment' },
        });
        await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalled());
        // where to turn off the camera's effects, with the live camera
        expect(
            screen.getByText(
                /Turn off your computer's camera effects \(on Windows: Win \+ A/,
            ),
        ).toBeInTheDocument();
        rerender(
            <QrScannerDialog
                open={false}
                onClose={vi.fn()}
                onDetect={vi.fn()}
            />,
        );

        await vi.waitFor(() => expect(stopTrack).toHaveBeenCalled());
    });
});

describe('readQrCode', () => {
    it('finds nothing in an image without a QR code', () => {
        const blank = {
            data: new Uint8ClampedArray(64 * 64 * 4).fill(255),
            width: 64,
            height: 64,
        } as ImageData;

        expect(readQrCode(blank)).toBeNull();
    });
});
