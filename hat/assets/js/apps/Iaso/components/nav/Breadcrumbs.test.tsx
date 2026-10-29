import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithTheme } from '../../../../tests/helpers';
import { Breadcrumbs } from './Breadcrumbs';

const renderBreadcrumbs = (ui: React.ReactElement) =>
    renderWithTheme(<MemoryRouter>{ui}</MemoryRouter>);

describe('Breadcrumbs', () => {
    it('renders items with a url as links and the last item as plain text', () => {
        renderBreadcrumbs(
            <Breadcrumbs
                items={[
                    { key: 1, label: 'Country', url: '/country' },
                    { key: 2, label: 'Province', url: '/province' },
                ]}
            />,
        );

        expect(screen.getByRole('link', { name: 'Country' })).toHaveAttribute(
            'href',
            '/country',
        );
        expect(
            screen.queryByRole('link', { name: 'Province' }),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Province')).toBeInTheDocument();
    });

    it('renders the last item as a link when showCurrent is false', () => {
        renderBreadcrumbs(
            <Breadcrumbs
                showCurrent={false}
                items={[{ key: 1, label: 'Country', url: '/country' }]}
            />,
        );

        expect(
            screen.getByRole('link', { name: 'Country' }),
        ).toBeInTheDocument();
    });

    it('calls onClick when clicking an item with a click handler', () => {
        const onClick = vi.fn();
        renderBreadcrumbs(
            <Breadcrumbs
                items={[
                    { key: 1, label: 'Root team', onClick },
                    { key: 2, label: 'Sub team' },
                ]}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Root team' }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders items without url nor click handler as plain text', () => {
        renderBreadcrumbs(
            <Breadcrumbs
                items={[
                    { key: 1, label: 'Country' },
                    { key: 2, label: 'Province' },
                ]}
            />,
        );

        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.getByText('Country')).toBeInTheDocument();
    });
});
