import React, { FunctionComponent } from 'react';
import {
    createTheme,
    ThemeProvider,
    useTheme,
    useThemeProps,
} from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NoFutureDates } from './NoFutureDates';

// What a DatePicker reads from the theme (as in @mui/x-date-pickers)
const DatePickerProps: FunctionComponent<{
    disableFuture?: boolean;
}> = ({ disableFuture }) => {
    const themeProps = useThemeProps({
        props: { disableFuture },
        name: 'MuiDatePicker',
    });
    return <span>{String(themeProps.disableFuture ?? false)}</span>;
};

describe('NoFutureDates', () => {
    it('disables the future dates of the date pickers inside only', () => {
        render(
            <>
                <DatePickerProps />
                <NoFutureDates>
                    <DatePickerProps />
                </NoFutureDates>
            </>,
        );
        expect(
            screen.getAllByText(/true|false/).map(e => e.textContent),
        ).toEqual(['false', 'true']);
    });

    it('keeps the theme of the page and the props given to the date pickers', () => {
        const theme = createTheme({
            palette: { primary: { main: '#123456' } },
            components: {
                MuiDatePicker: { defaultProps: { format: 'DD/MM/YYYY' } },
            },
        });
        let inner: any;
        let primary: string | undefined;
        const Inner: FunctionComponent = () => {
            inner = useThemeProps({ props: {}, name: 'MuiDatePicker' });
            primary = useTheme().palette.primary.main;
            return null;
        };
        render(
            <ThemeProvider theme={theme}>
                <NoFutureDates>
                    <Inner />
                    <DatePickerProps disableFuture={false} />
                </NoFutureDates>
            </ThemeProvider>,
        );
        expect(inner).toEqual({ format: 'DD/MM/YYYY', disableFuture: true });
        expect(primary).toBe('#123456');
        expect(screen.getByText('false')).toBeInTheDocument();
    });
});
