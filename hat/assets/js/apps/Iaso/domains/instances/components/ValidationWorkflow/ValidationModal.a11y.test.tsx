import React from 'react';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { IntlProvider } from 'react-intl';
import { describe, it, vi, expect } from 'vitest';
import { renderWithTheme } from '../../../../../../tests/helpers';
import { ValidationModal } from './ValidationModal';

vi.mock('./useNodeValidationSchema', () => ({
    useNodeValidationSchema: () => null,
}));

vi.mock('./useSaveNode', () => ({
    useSaveNode: () => ({ mutateAsync: vi.fn() }),
}));

describe('ValidationModal accessibility', () => {
    const closeDialog = vi.fn();

    it('renders modal fields without accessibility violations', async () => {
        const { container } = renderWithTheme(
            <IntlProvider locale={'en'} messages={{}}>
                <ValidationModal
                    instanceId={1}
                    isOpen
                    closeDialog={closeDialog}
                />
            </IntlProvider>,
        );

        expect(screen.getByText('Comment')).toBeInTheDocument();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
