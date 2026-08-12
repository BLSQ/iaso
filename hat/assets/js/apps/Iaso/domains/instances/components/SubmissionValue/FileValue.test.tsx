import React from 'react';
import { screen } from '@testing-library/react';
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

describe('FileValue', () => {
    it('renders the empty placeholder when no matching file exists', () => {
        renderWithThemeAndIntlProvider(
            <FileValue
                field={makeField({
                    kind: 'file',
                    rawValue: 'missing.pdf',
                    empty: true,
                })}
                files={[]}
            />,
        );
        expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('renders an image preview for image files', () => {
        renderWithThemeAndIntlProvider(
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
        expect(screen.getByRole('img', { name: 'attachment' })).toHaveAttribute(
            'src',
            '/media/uploads/scan.png',
        );
    });

    it('renders a video item for video files', () => {
        renderWithThemeAndIntlProvider(
            <FileValue
                field={makeField({
                    kind: 'file',
                    rawValue: 'clip.mp4',
                    empty: false,
                })}
                files={['/media/uploads/clip.mp4']}
            />,
        );
        expect(screen.getByLabelText('video')).toHaveAttribute(
            'src',
            '/media/uploads/clip.mp4',
        );
    });

    it('renders a document item for other files', () => {
        renderWithThemeAndIntlProvider(
            <FileValue
                field={makeField({
                    kind: 'file',
                    rawValue: 'report.pdf',
                    empty: false,
                })}
                files={['/media/uploads/report.pdf']}
            />,
        );
        expect(screen.getByRole('link', { name: 'document' })).toHaveAttribute(
            'href',
            '/media/uploads/report.pdf',
        );
    });
});
