import React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithTheme } from '../../../../../../tests/helpers';
import { ValidateButton } from './ValidateButton';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: any) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? 'msg'),
        }),
    };
});

describe('ValidateButton', () => {
    it('renders with default size and variant', () => {
        renderWithTheme(<ValidateButton buttonText={'buttonText'} />);
        const button = screen.getByRole('button');

        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('MuiButton-root'); // styles.button
        expect(button).toHaveTextContent('buttonText');

        // defaults for variant and size
        expect(button).toHaveClass('MuiButton-contained');
        expect(button).toHaveClass('MuiButton-sizeSmall');
    });

    it('renders custom buttonText', () => {
        renderWithTheme(<ValidateButton buttonText="Click Me" />);
        const button = screen.getByRole('button');

        expect(button).toHaveTextContent('Click Me');
    });

    it('renders custom size and variant', () => {
        renderWithTheme(
            <ValidateButton
                size="large"
                variant="outlined"
                buttonText={'buttonText'}
            />,
        );
        const button = screen.getByRole('button');

        expect(button).toHaveClass('MuiButton-outlined');
        expect(button).toHaveClass('MuiButton-sizeLarge');
    });

    it('passes additional props', () => {
        renderWithTheme(
            <ValidateButton
                id="my-button"
                disabled
                buttonText={'buttonText'}
            />,
        );
        const button = screen.getByRole('button');

        expect(button).toHaveAttribute('id', 'my-button');
        expect(button).toBeDisabled();
    });
});
