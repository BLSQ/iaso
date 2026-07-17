import { SxStyles } from 'Iaso/types/general';

export const missionTypeChipStyles: SxStyles = {
    chip: {
        backgroundColor: theme => theme.palette.background.blueGrey,
        border: `1px solid #cfd8dc`,
        color: theme => theme.palette.primary.main,
        fontWeight: 700,
        '& .MuiChip-icon': {
            color: theme => theme.palette.primary.main,
        },
    },
};
