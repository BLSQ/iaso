import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { mapPopupStyles, textPlaceholder } from 'bluesquare-components';

//@ts-ignore
const useStyles = makeStyles(theme => ({
    ...mapPopupStyles(theme),
}));

type Props = {
    label: string;
    value?: any;
    labelSize?: number;
    valueSize?: number;
};

const PopupItemComponent: FunctionComponent<Props> = ({
    label,
    value,
    labelSize = 4,
    valueSize = 8,
}) => {
    const classes: Record<string, string> = useStyles();

    return (
        <Grid container spacing={0}>
            <Grid className={classes.popupListItemLabel} size={labelSize}>
                <Box sx={{
                    mr: 1
                }}>{label}:</Box>
            </Grid>
            <Grid className={classes.popuplistItem} size={valueSize}>
                {value || textPlaceholder}
            </Grid>
        </Grid>
    );
};

export default PopupItemComponent;
