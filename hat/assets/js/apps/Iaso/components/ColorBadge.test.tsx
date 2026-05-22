import React from 'react';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { renderWithTheme } from '../../../tests/helpers';
import { ColorBadge } from './ColorBadge';

describe('ColorBadge', () => {
    it('renders nothing when backgroundColor is not provided', () => {
        const { container } = renderWithTheme(<ColorBadge />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders the badge when backgroundColor is provided', () => {
        renderWithTheme(
            <ColorBadge backgroundColor="red" data-testid="badge" />,
        );

        const badge = screen.getByTestId('badge');
        expect(badge).toBeInTheDocument();
    });

    it('applies the backgroundColor', () => {
        renderWithTheme(
            <ColorBadge backgroundColor="#e256a4" data-testid="badge" />,
        );

        expect(screen.getByTestId('badge')).toHaveStyle({
            backgroundColor: '#e256a4',
        });
    });

    it('forwards additional props to Box', () => {
        renderWithTheme(
            <ColorBadge
                backgroundColor="blue"
                data-testid="badge"
                id="custom-id"
                aria-label="color badge"
            />,
        );

        const badge = screen.getByTestId('badge');

        expect(badge).toHaveAttribute('id', 'custom-id');
        expect(badge).toHaveAttribute('aria-label', 'color badge');
    });

    it('renders as a span element', () => {
        renderWithTheme(
            <ColorBadge backgroundColor="green" data-testid="badge" />,
        );

        const badge = screen.getByTestId('badge');

        expect(badge.tagName.toLowerCase()).toBe('span');
    });

    it('merges custom sx styles', () => {
        renderWithTheme(
            <ColorBadge
                backgroundColor="red"
                data-testid="badge"
                sx={{ borderWidth: '10px' }}
            />,
        );

        const badge = screen.getByTestId('badge');

        expect(badge).toHaveStyle({
            borderWidth: '10px',
        });
    });
});

describe('ColorBadge accessibility', () => {
    it('has no accessibility violations', async () => {
        const { container } = renderWithTheme(
            <ColorBadge backgroundColor="red" data-testid="badge" />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
    it('has no accessibility violations when not rendered', async () => {
        const { container } = renderWithTheme(<ColorBadge />);

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
