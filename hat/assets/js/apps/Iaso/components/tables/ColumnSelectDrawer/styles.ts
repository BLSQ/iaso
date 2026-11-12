import { Theme } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

export const styles = {
    root: {
        width: 400,
        maxWidth: '90vw',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 2,
    },
    content: {
        flexGrow: 1,
        overflow: 'auto',
        px: 3,
        py: 2,
    },
    search: {
        display: 'flex',
        alignItems: 'center',
        mb: 2,
        px: 1.5,
        py: 0.5,
        border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
    },
    listItem: {
        height: (theme: Theme) => theme.spacing(6),
        px: 0,
    },
    switch: {
        marginRight: (theme: Theme) => theme.spacing(1),
    },
    input: {
        width: '100%',
        padding: 0,
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1,
        px: 3,
        py: 2,
    },
} satisfies SxStyles;
