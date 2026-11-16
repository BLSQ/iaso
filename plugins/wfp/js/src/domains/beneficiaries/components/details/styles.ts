import { Theme } from '@mui/material/styles';
import { SxStyles } from 'Iaso/types/general';

export const details: SxStyles = {
    root: (theme: Theme) => ({
        fontSize: 13,
        '& h3': {
            fontSize: 16,
            fontWeight: 500,
            color: theme.palette.primary.main,
            m: '20px 0 8px',
        },
        '& details': {
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            mb: 1,
        },
        '& details[open]': { boxShadow: theme.shadows[1] },
        '& summary': {
            cursor: 'pointer',
            p: '10px 16px',
            '&:hover': { background: 'rgba(0, 0, 0, 0.04)' },
        },
        '& details p': { m: 0, p: '0 16px 8px', color: 'text.secondary' },
        '& .muted': { color: 'text.secondary' },
        '& .submission-header': {
            position: 'sticky',
            top: 0,
            background: theme.palette.primary.main,
            color: '#fff',
            p: '10px 16px',
            mb: 0.5,
            lineHeight: 1.5,
        },
    }),
};

export const keyValue: SxStyles = {
    table: {
        '& .MuiTableCell-root': {
            fontSize: 13,
            verticalAlign: 'top',
            p: '6px 16px',
            wordBreak: 'break-word',
        },
    },
    cell: {
        width: '40%',
        fontWeight: 400,
        color: 'text.secondary',
    },
    emptyCell: {
        color: 'text.secondary',
    },
};
