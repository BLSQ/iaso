import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { ActivityRow, InfoRow, KvRow } from './InfoRow';

describe('InfoRow', () => {
    it('renders the label and value', () => {
        renderWithThemeAndIntlProvider(
            <InfoRow label="Form">Facility survey</InfoRow>,
        );
        expect(screen.getByText('Form')).toBeInTheDocument();
        expect(screen.getByText('Facility survey')).toBeInTheDocument();
    });
});

describe('ActivityRow', () => {
    it('renders who and when under the label', () => {
        renderWithThemeAndIntlProvider(
            <ActivityRow label="Updated" who="Ada" when="01/01/2024 12:00" />,
        );
        expect(screen.getByText('Updated')).toBeInTheDocument();
        expect(screen.getByText('Ada')).toBeInTheDocument();
        expect(screen.getByText('01/01/2024 12:00')).toBeInTheDocument();
    });

    it('omits missing who/when', () => {
        renderWithThemeAndIntlProvider(
            <ActivityRow label="Created" when="01/01/2024 12:00" />,
        );
        expect(screen.getByText('Created')).toBeInTheDocument();
        expect(screen.getByText('01/01/2024 12:00')).toBeInTheDocument();
    });
});

describe('KvRow', () => {
    it('renders a label and value', () => {
        renderWithThemeAndIntlProvider(
            <KvRow label="District" value="Kinshasa" />,
        );
        expect(screen.getByText('District')).toBeInTheDocument();
        expect(screen.getByText('Kinshasa')).toBeInTheDocument();
    });

    it('renders the placeholder when the value is empty', () => {
        renderWithThemeAndIntlProvider(<KvRow label="District" value="" />);
        expect(screen.getByText('--')).toBeInTheDocument();
    });
});
