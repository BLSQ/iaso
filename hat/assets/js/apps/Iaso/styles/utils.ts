import { SxProps, Theme } from '@mui/material';
import { MENU_HEIGHT_WITHOUT_TABS } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';

export const getStickyTableHeadStyles = (maxHeight: string): SxStyles => ({
    '& .MuiTableCell-head': {
        position: 'sticky !important',
    },
    '& .MuiTableContainer-root': {
        maxHeight,
        overflow: 'auto',
    },
});

export const rootStyles: SxProps<Theme> = {
    overflow: 'auto',
    paddingBottom: 4,
    height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
};

export const embeddedRootStyles: SxProps<Theme> = {
    height: '100vh',
};
