import type { Theme } from '@mui/material/styles';

declare module '@mui/private-theming' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface DefaultTheme extends Theme {}
}
