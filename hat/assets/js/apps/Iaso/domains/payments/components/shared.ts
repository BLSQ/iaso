import { SxStyles } from '../../../types/general';

export const styles: SxStyles = {
    table: {
        mx: -3,
        mt: 2,
        '& .MuiSpeedDial-root': {
            display: 'none',
        },
    },
    infos: {
        p: theme => `28px ${theme.spacing()}`,
        '& span': {
            fontWeight: 'bold',
            display: 'inline-block',
            mr: 1,
        },
    },
};
