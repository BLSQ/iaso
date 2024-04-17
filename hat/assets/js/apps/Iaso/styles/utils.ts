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
