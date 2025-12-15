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
            <Grid item xs={labelSize} className={classes.popupListItemLabel}>
                <Box mr={1}>{label}:</Box>
            </Grid>
            <Grid item xs={valueSize} className={classes.popuplistItem}>
                {value || textPlaceholder}
            </Grid>
        </Grid>
    );
};

export default PopupItemComponent;
