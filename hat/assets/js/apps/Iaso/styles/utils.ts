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

export const useGetRootStyles = (embedded = false): SxProps<Theme> => ({
    overflow: 'auto',
    paddingBottom: 4,
    height: embedded ? '100vh' : `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
});
