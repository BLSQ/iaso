import { SxStyles } from 'Iaso/types/general';

export const missionStyles: SxStyles = {
    bordered: {
        border: theme => `1px solid ${theme.palette.lightGray.border}`,
        borderRadius: 1,
    },
    borderedTable: {
        '& tbody tr:last-of-type td': {
            borderBottom: 0,
        },
    },
    greyHeaderTable: {
        '& thead th': {
            backgroundColor: 'grey.50',
        },
    },
    detailsTable: {
        '& tbody td:first-of-type': {
            backgroundColor: 'grey.50',
            color: 'text.secondary',
            fontWeight: 400,
        },
    },
};
