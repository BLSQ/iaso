import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../tests/helpers';
import { SearchButton } from './SearchButton';

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

describe('SearchButton', () => {
    it('renders correctly with label', () => {
        renderWithThemeAndIntlProvider(
            <SearchButton disabled={false} onSearch={vi.fn()} />,
        );

        const button = screen.getByTestId('search-button');

        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent('Search');
    });

    it('calls onSearch when clicked', () => {
        const onSearch = vi.fn();

        renderWithThemeAndIntlProvider(
            <SearchButton disabled={false} onSearch={onSearch} />,
        );

        fireEvent.click(screen.getByTestId('search-button'));

        expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled=true', () => {
        renderWithThemeAndIntlProvider(
            <SearchButton disabled onSearch={vi.fn()} />,
        );

        const button = screen.getByTestId('search-button');

        expect(button).toBeDisabled();
    });
});
