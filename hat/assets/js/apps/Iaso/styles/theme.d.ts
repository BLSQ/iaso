import type { Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface TypeBackground {
        blueGrey: string;
        grey: string;
        warning: string;
        error: string;
        success: string;
    }
}

declare module '@mui/private-theming' {
    // MUI theme bridge; no extra fields yet
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface DefaultTheme extends Theme {}
}
