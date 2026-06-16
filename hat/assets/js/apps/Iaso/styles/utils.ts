import { SxProps, Theme } from '@mui/material';
import { SxStyles } from '../types/general';

export const getStickyTableHeadStyles = (maxHeight: string): SxStyles => ({
    '& .MuiTableCell-head': {
        position: 'sticky !important',
    },
    '& .MuiTableContainer-root': {
        maxHeight,
        overflow: 'auto',
    },
});

export const stickyTableContainerStyles: SxProps<Theme> = {
    borderTop: theme =>
        // @ts-ignore
        `1px solid ${theme.palette.ligthGray.border}`,
    '& .MuiSpeedDial-root': {
        display: 'none',
    },
    '& .MuiTableContainer-root': {
        maxHeight: '65vh',
        overflowY: 'auto',
        overflowX: 'auto',
        '& .MuiTableHead-root th': {
            top: 0,
            position: 'sticky !important',
        },
    },
};
