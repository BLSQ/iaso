import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorsPopper } from './ErrorsPopper';
import { act } from '@testing-library/react';

// we mock Popper to avoid heavy computation and layout simulation
vi.mock('@mui/material', async () => {
    const actual = await vi.importActual<typeof import('@mui/material')>(
        '@mui/material',
    );

    return {
        ...actual,
        Popper: ({ open, children }: any) =>
            open ? <div data-testid="mock-popper">{children}</div> : null,
    };
});


describe('ErrorsPopper', () => {
    it('returns null when there are no errors', () => {
        const { container } = render(
            <ErrorsPopper errors={[]} errorCountMessage="0 errors" />,
        );

        expect(container.firstChild).toBeNull();
    });

    it('renders error count message when errors exist', () => {
        render(
            <ErrorsPopper
                errors={['first error']}
                errorCountMessage="1 error"
            />,
        );

        expect(screen.getByText('1 error')).toBeInTheDocument();
    });

    it('does not show errors initially', () => {
        render(
            <ErrorsPopper
                errors={['first error']}
                errorCountMessage="1 error"
            />,
        );

        // Popper closed by default
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });

    it('shows errors when icon is clicked', async () => {
        const user = userEvent.setup();

        render(
            <ErrorsPopper
                errors={['first error', 'second error']}
                errorCountMessage="2 errors"
            />,
        );

        const button = screen.getByRole('button');

        await act(async () => {
            await user.click(button);
        });


        expect(screen.getByText('First error')).toBeInTheDocument();
        expect(screen.getByText('Second error')).toBeInTheDocument();
    });

    it('toggles popper visibility when clicked twice', async () => {
        const user = userEvent.setup();

        render(
            <ErrorsPopper
                errors={['first error']}
                errorCountMessage="1 error"
            />,
        );

        const button = screen.getByRole('button');

        // Open
        await act(async () => {
            await user.click(button);
        });
        expect(screen.getByText('First error')).toBeInTheDocument();

        // Close
        await act(async () => {
            await user.click(button);
        });
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });

    it('capitalizes the first letter of each error', async () => {
        const user = userEvent.setup();

        render(
            <ErrorsPopper
                errors={['lowercase error']}
                errorCountMessage="1 error"
            />,
        );
        await act(async () => {
            await user.click(screen.getByRole('button'));
        })


        expect(screen.getByText('Lowercase error')).toBeInTheDocument();
    });
});
