import { Grid, Button } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { CircularProgress } from '@material-ui/core';
import { TextInput } from '../components/Inputs';
import { useStyles } from '../styles/theme';
import { useGetPreparednessData } from '../hooks/useGetPreparednessData';

export const PreparednessForm = () => {
    const classes = useStyles();
    const { values } = useFormikContext();
    const { mutate, isLoading, isError, error } = useGetPreparednessData();

    const refreshData = () => {
        mutate(values.spreadsheet_url);
    };

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={8} item>
                        <Field
                            label="Google Sheet URL"
                            name={'spreadsheet_url'}
                            component={TextInput}
                            disabled={isLoading}
                            className={classes.input}
                        />
                    </Grid>
                    <Grid xs={6} md={2} item>
                        <Button target="_blank" href={values.spreadsheet_url} color="primary">Access data</Button>
                    </Grid>
                    <Grid xs={6} md={2} item>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={isLoading}
                            onClick={refreshData}
                        >
                            Refresh Data
                        </Button>
                    </Grid>

                    <Grid xd={12} item>
                        {isLoading && <CircularProgress />}
                        {isError && (
                            <div>An error occurred: {error.non_field_errors}</div>
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};
