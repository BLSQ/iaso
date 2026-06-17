import React, { FunctionComponent } from 'react';
import { Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(theme => ({
    label: {
        marginRight: theme.spacing(1),
    },
}));
type Props = {
    label: string;
    value: string;
};
const OrgUnitsSmallInfosRow: FunctionComponent<Props> = ({ label, value }) => {
    const classes: Record<string, string> = useStyles();
    return (
        <Grid container spacing={0}>
            <Grid
                container
                size={5}
                sx={{
                    justifyContent: "flex-end",
                    alignContent: "flex-start"
                }}>
                <span className={classes.label}>{`${label} :`}</span>
            </Grid>
            <Grid
                container
                size={7}
                sx={{
                    justifyContent: "flex-start",
                    alignContent: "flex-start"
                }}>
                {value}
            </Grid>
        </Grid>
    );
};

export default OrgUnitsSmallInfosRow;
