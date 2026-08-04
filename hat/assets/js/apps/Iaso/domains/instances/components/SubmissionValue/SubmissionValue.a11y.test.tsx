import React from 'react';
import { axe } from 'jest-axe';
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

describe('SubmissionValue a11y', () => {
    it.each([
        makeField({ kind: 'text', value: 'Sweet Wright', empty: false }),
        makeField({
            kind: 'choice',
            value: 'Privé confessionnel',
            empty: false,
        }),
        makeField({ kind: 'multi', value: 'A, B', empty: false }),
        makeField({ kind: 'number', value: '42', empty: false }),
        makeField({ kind: 'note', value: 'Please verify', empty: false }),
        makeField({
            kind: 'date',
            value: '2026-07-18',
            rawValue: '2026-07-18',
            empty: false,
        }),
        makeField({ kind: 'text', value: '', empty: true }),
        makeField({
            kind: 'gps',
            rawValue: '1.23 4.56 100 5',
            empty: false,
        }),
        makeField({
            kind: 'photo',
            id: 'facility_photo',
            rawValue: 'facility.jpg',
            empty: false,
        }),
        makeField({
            kind: 'file',
            rawValue: 'report.pdf',
            empty: false,
        }),
    ])('has no accessibility violations for $kind fields', async field => {
        const files =
            field.kind === 'photo'
                ? ['/media/uploads/facility.jpg']
                : field.kind === 'file'
                  ? ['/media/uploads/report.pdf']
                  : [];
        const { container } = renderWithThemeAndIntlProvider(
            <SubmissionValue field={field} files={files} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
