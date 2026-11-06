import type { Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    // `getOverriddenTheme` (styles/index.ts) adds a `background` shade to
    // palette colors (used as `theme.palette.primary.background`), which
    // MUI's PaletteColor does not know about by default.
    interface PaletteColor {
        background: string;
    }

    interface SimplePaletteColorOptions {
        background?: string;
    }

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
