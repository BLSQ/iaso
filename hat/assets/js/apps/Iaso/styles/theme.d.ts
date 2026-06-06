import type { Theme } from '@mui/material/styles';

declare module '@mui/private-theming' {
    interface DefaultTheme extends Theme {}
}
