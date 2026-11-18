import React, { FunctionComponent, ReactNode } from 'react';
import { Theme, ThemeProvider } from '@mui/material/styles';
// types of the date pickers in the theme (components.MuiDatePicker)
import type {} from '@mui/x-date-pickers/themeAugmentation';

// The theme of the page, with no date after today selectable in the date pickers (unless they set disableFuture)
const withoutFutureDates = (theme: Theme): Theme => ({
    ...theme,
    components: {
        ...theme.components,
        MuiDatePicker: {
            ...theme.components?.MuiDatePicker,
            defaultProps: {
                ...theme.components?.MuiDatePicker?.defaultProps,
                disableFuture: true,
            },
        },
    },
});

type Props = {
    children: ReactNode;
};

/** No future date can be picked in the date pickers inside, e.g. the ones of a DatesRange (which has no prop for it). */
export const NoFutureDates: FunctionComponent<Props> = ({ children }) => (
    <ThemeProvider theme={withoutFutureDates}>{children}</ThemeProvider>
);
