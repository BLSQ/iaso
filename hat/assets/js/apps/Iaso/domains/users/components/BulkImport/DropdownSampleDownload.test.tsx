import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DropdownSampleDownload } from './DropdownSampleDownload';

describe('DropdownSampleDownload', () => {
    const options = [{ text: 'Download CSV' }, { text: 'Download PDF' }];

    it('renders button text', () => {
        render(
            <DropdownSampleDownload buttonText="Download" options={options} />,
        );

        expect(
            screen.getAllByRole('button', { name: /download/i })[0],
        ).toBeInTheDocument();
    });

    it('does not contain null or undefined', () => {
        const { container } = render(
            <DropdownSampleDownload buttonText="Download" options={options} />,
        );

        expect(container.innerHTML).not.toContain('null');
        expect(container.innerHTML).not.toContain('undefined');
    });

    it('opens menu when clicked', async () => {
        render(
            <DropdownSampleDownload buttonText="Download" options={options} />,
        );

        fireEvent.click(
            screen.getAllByRole('button', { name: /download/i })[0],
        );

        await waitFor(() => {
            expect(screen.getByText('Download CSV')).toBeInTheDocument();
            expect(screen.getByText('Download PDF')).toBeInTheDocument();
        });
    });

    it('closes menu after clicking option', async () => {
        render(
            <DropdownSampleDownload buttonText="Download" options={options} />,
        );

        fireEvent.click(
            screen.getAllByRole('button', { name: /download/i })[0],
        );
        await waitFor(() => {
            expect(screen.queryByText('Download CSV')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Download CSV'));

        await waitFor(() => {
            expect(screen.queryByText('Download CSV')).not.toBeInTheDocument();
        });
    });

    it('calls option onClick when item selected', () => {
        const onClick = vi.fn();

        render(
            <DropdownSampleDownload
                buttonText="Download"
                options={[{ text: 'Download CSV', onClick }]}
            />,
        );

        fireEvent.click(
            screen.getAllByRole('button', { name: /download/i })[0],
        );
        fireEvent.click(screen.getByText('Download CSV'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
