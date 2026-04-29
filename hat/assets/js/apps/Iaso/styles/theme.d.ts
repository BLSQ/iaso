import type { Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    /** Iaso theme adds these on top of MUI `PaletteColor`. */
    interface PaletteColor {
        background?: string;
        backgroundHard?: string;
    }
    interface Palette {
        gray: { main: string; border: string; background: string };
        mediumGray: { main: string; border: string };
        lightGray: { main: string; border: string; background: string };
        border: { main: string; hover: string };
        yellow: { main: string };
    }
    interface PaletteOptions {
        gray?: Palette['gray'];
        mediumGray?: Palette['mediumGray'];
        lightGray?: Palette['lightGray'];
        border?: Palette['border'];
        yellow?: Palette['yellow'];
    }
}

declare module '@mui/private-theming' {
    // MUI module augmentation; interface must stay empty for declaration merging.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface DefaultTheme extends Theme {}
}
