import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { FileValue } from './FileValue';
import { makeField } from './testUtils';

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

describe('FileValue a11y', () => {
    it('empty state has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <FileValue
                field={makeField({
                    kind: 'file',
                    rawValue: 'missing.pdf',
                    empty: true,
                })}
                files={[]}
            />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('image state has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <FileValue
                field={makeField({
                    kind: 'file',
                    id: 'attachment',
                    rawValue: 'scan.png',
                    empty: false,
                })}
                files={['/media/uploads/scan.png']}
            />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('document state has no accessibility violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <FileValue
                field={makeField({
                    kind: 'file',
                    rawValue: 'report.pdf',
                    empty: false,
                })}
                files={['/media/uploads/report.pdf']}
            />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
