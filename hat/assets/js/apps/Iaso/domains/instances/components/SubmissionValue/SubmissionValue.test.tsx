import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { makeField } from './testUtils';
import { SubmissionValue } from './index';

vi.mock('Iaso/components/maps/MarkerMapComponent', () => ({
    MarkerMap: () => <div data-testid="marker-map" />,
}));

vi.mock('Iaso/components/files/DocumentsItemComponent', () => ({
    default: ({ filePath }: { filePath: string }) => (
        <a href={filePath}>document</a>
    ),
}));

vi.mock('Iaso/components/files/VideoItemComponent', () => ({
    default: ({ videoPath }: { videoPath: string }) => (
        <video src={videoPath} aria-label="video" />
    ),
}));

describe('SubmissionValue', () => {
    it('renders the empty placeholder for empty non-media fields', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'text',
                    value: '',
                    empty: true,
                })}
                files={[]}
            />,
        );
        expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('renders a choice as a chip', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'choice',
                    value: 'Privé confessionnel',
                    empty: false,
                })}
                files={[]}
            />,
        );
        expect(screen.getByText('Privé confessionnel')).toBeInTheDocument();
    });

    it('renders multi values as separate chips', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'multi',
                    value: 'A, B, C',
                    empty: false,
                })}
                files={[]}
            />,
        );
        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();
        expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('renders a number value', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'number',
                    value: '42',
                    empty: false,
                })}
                files={[]}
            />,
        );
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders a note value', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'note',
                    value: 'Please verify',
                    empty: false,
                })}
                files={[]}
            />,
        );
        expect(screen.getByText('Please verify')).toBeInTheDocument();
    });

    it('renders a default text value', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'text',
                    value: 'Sweet Wright',
                    empty: false,
                })}
                files={[]}
            />,
        );
        expect(screen.getByText('Sweet Wright')).toBeInTheDocument();
    });

    it('renders a formatted date value', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'date',
                    value: '2026-07-18',
                    rawValue: '2026-07-18',
                    empty: false,
                })}
                files={[]}
            />,
        );
        expect(screen.queryByText('2026-07-18')).not.toBeInTheDocument();
        expect(screen.getByText(/18/)).toBeInTheDocument();
    });

    it('renders EmptyValue for an invalid gps point', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'gps',
                    rawValue: 'not-a-point',
                    empty: false,
                })}
                files={[]}
            />,
        );
        expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('renders GpsField for a valid gps point', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'gps',
                    rawValue: '1.23 4.56 100 5',
                    empty: false,
                })}
                files={[]}
            />,
        );
        expect(screen.getByTestId('marker-map')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Show exact values' }),
        ).toBeInTheDocument();
    });

    it('still renders photo fields when empty so they can show their own empty state', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'photo',
                    rawValue: '',
                    empty: true,
                })}
                files={[]}
            />,
        );
        expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('renders a photo when a matching file exists', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'photo',
                    id: 'facility_photo',
                    rawValue: 'facility.jpg',
                    empty: false,
                })}
                files={['/media/uploads/facility.jpg']}
            />,
        );
        expect(
            screen.getByRole('img', { name: 'facility_photo' }),
        ).toBeInTheDocument();
    });

    it('renders a file document when a matching file exists', () => {
        renderWithThemeAndIntlProvider(
            <SubmissionValue
                field={makeField({
                    kind: 'file',
                    rawValue: 'report.pdf',
                    empty: false,
                })}
                files={['/media/uploads/report.pdf']}
            />,
        );
        expect(
            screen.getByRole('link', { name: 'document' }),
        ).toBeInTheDocument();
    });
});
