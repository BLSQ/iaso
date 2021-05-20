import { Grid, Typography, Button } from '@material-ui/core';
import { Field } from 'formik';
import { DateInput, Select, TextInput } from '../components/Inputs';
import { polioVacines, polioViruses } from '../constants/virus';
import { OrgUnitsLevels } from '../components/Inputs/OrgUnitsSelect';
import { useStyles } from '../styles/theme';

export const PreparednessForm = () => {
    const classes = useStyles();

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            label="Google Sheet URL"
                            name={'spreadsheet_url'}
                            component={TextInput}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid xs={6} md={3} item>
                        <Button color="primary">Access data</Button>
                    </Grid>
                    <Grid xs={6} md={3} item>
                        <Button variant="contained" color="primary">
                            Refresh Data
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
