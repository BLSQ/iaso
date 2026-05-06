import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { DropdownSampleDownload } from './DropdownSampleDownload';

describe('DropdownSampleDownload accessibility', () => {
    const options = [{ text: 'Download CSV' }, { text: 'Download PDF' }];

    it('does not have accessibility violation', async () => {
        const { container } = render(
            <DropdownSampleDownload buttonText="Download" options={options} />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('does not have accessibility violation when menu is opened', async () => {
        const { container } = render(
            <DropdownSampleDownload buttonText="Download" options={options} />,
        );

        fireEvent.click(
            screen.getAllByRole('button', { name: /download/i })[0],
        );

        await waitFor(() => {
            expect(screen.getByText('Download CSV')).toBeInTheDocument();
            expect(screen.getByText('Download PDF')).toBeInTheDocument();
        });

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
