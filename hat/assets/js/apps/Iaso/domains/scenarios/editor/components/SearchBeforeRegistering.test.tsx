import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { SearchBeforeRegistering } from './SearchBeforeRegistering';

// the camera: a scan that reads CARD-0042 at once
vi.mock('./QrScannerDialog', () => ({
    QrScannerDialog: ({
        open,
        onDetect,
    }: {
        open: boolean;
        onDetect: (text: string) => void;
    }) =>
        open ? (
            <button type="button" onClick={() => onDetect('CARD-0042')}>
                fake camera
            </button>
        ) : null,
}));

const questions = [{ name: 'qr_code', label: 'Code QR' }];

const renderSearch = (
    props: Partial<React.ComponentProps<typeof SearchBeforeRegistering>>,
) => {
    const onSearch = vi.fn();
    renderWithThemeAndIntlProvider(
        <SearchBeforeRegistering
            questions={questions}
            preventAdd
            search={undefined}
            onSearch={onSearch}
            showTechnicalNames={false}
            {...props}
        />,
    );
    return onSearch;
};

describe('SearchBeforeRegistering', () => {
    it('searches on what is typed, a QR code on several lines too', async () => {
        const onSearch = renderSearch({});

        await userEvent.type(
            screen.getByRole('textbox', { name: /Code QR/ }),
            'CPS-2026{Enter}ABC',
        );
        await userEvent.click(screen.getByRole('button', { name: 'Search' }));

        expect(onSearch).toHaveBeenCalledWith({ qr_code: 'CPS-2026\nABC' });
        // nothing said before searching
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('says the app registers once every question is searched', () => {
        renderSearch({ search: { qr_code: 'CARD-0001' } });

        expect(screen.getByRole('textbox', { name: /Code QR/ })).toHaveValue(
            'CARD-0001',
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'Nothing found: the app lets you register',
        );
    });

    it('says the app keeps adding disabled while a question is empty', () => {
        renderSearch({ search: {} });

        expect(screen.getByRole('alert')).toHaveTextContent(
            'The app keeps “Add an entity” disabled until every question is filled.',
        );
    });

    it('shows the technical names on demand', () => {
        renderSearch({ showTechnicalNames: true });

        expect(
            screen.getByRole('textbox', { name: /Code QR \(qr_code\)/ }),
        ).toBeInTheDocument();
    });

    it('fills the field with the QR code scanned', async () => {
        const onSearch = renderSearch({});

        await userEvent.click(
            screen.getByRole('button', { name: 'Scan a QR code' }),
        );
        await userEvent.click(
            screen.getByRole('button', { name: 'fake camera' }),
        );

        expect(screen.getByRole('textbox', { name: /Code QR/ })).toHaveValue(
            'CARD-0042',
        );
        // scanned, not searched yet: the person checks it, then searches
        expect(onSearch).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole('button', { name: 'Search' }));
        expect(onSearch).toHaveBeenCalledWith({ qr_code: 'CARD-0042' });
    });
});
