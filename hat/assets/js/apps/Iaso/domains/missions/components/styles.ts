import { SxStyles } from 'Iaso/types/general';

export const missionStyles: SxStyles = {
    bordered: {
        border: theme => `1px solid ${theme.palette.lightGray.border}`,
        borderRadius: 1,
    },
    fieldRoot: {
        my: 1,
    },
    fieldLabel: {
        display: 'block',
        mb: 1.5,
        fontWeight: 600,
        color: 'text.primary',
        fontSize: '0.875rem',
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
};
