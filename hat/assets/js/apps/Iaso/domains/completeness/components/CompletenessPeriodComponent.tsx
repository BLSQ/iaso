import React, { FunctionComponent } from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    Table,
    useSafeIntl,
    useRedirectTo,
} from 'bluesquare-components';
import { postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { getColumns } from '../config';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../../../components/snackBars/messages';
import { usePrettyPeriod } from '../../periods/utils';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        marginBottom: theme.spacing(4),
        padding: theme.spacing(2),
    },
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
    error: {
        color: theme.palette.error.main,
        fontWeight: 'bold',
    },
    ready: {
        color: theme.palette.success.main,
        fontWeight: 'bold',
    },
    cell: {
        outline: 'none',
        boxShadow: 'none',
        cursor: 'pointer',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkButton: {
        textDecoration: 'none',
    },
}));

type Props = {
    period: Record<string, any>;
    forms: Record<string, any>[];
    activeInstanceStatuses: string[];
    activePeriodType: string;
};

const CompletenessPeriodComponent: FunctionComponent<Props> = ({
    activeInstanceStatuses,
    period,
    forms,
    activePeriodType,
}) => {
    const redirectTo = useRedirectTo();
    const formatPeriod = usePrettyPeriod();

    const derivedInstanceMutation = useSnackMutation(
        derivedrequest => postRequest('/api/derivedinstances/', derivedrequest),
        MESSAGES.generateDerivedRequestSuccess,
        MESSAGES.generateDerivedRequestError,
        ['completeness'],
    );

    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    // FIXME: doesn't seem to be actually used
    const onSelectCell = (form, status, selectedPeriod) => {
        redirectTo(baseUrls.instances, {
            formIds: form.id,
            periodType: form.period_type.toUpperCase(),
            startPeriod: selectedPeriod.asPeriodType(form.period_type)
                .periodString,
            status: status.toUpperCase(),
        });
    };

    const onClick = form => {
        const periods = Array.from(
            new Set(Object.values(form.months).map(m => m.period.periodString)),
        );
        const derived = form.generate_derived;
        derivedInstanceMutation.mutate({ periods, derived });
    };
    const columns = getColumns(
        formatMessage,
        period.monthRange,
        classes,
        activeInstanceStatuses,
        // FIXME: this call back is not called
        (form, status, p) => onSelectCell(form, status, p),
        arg => onClick(arg),
        activePeriodType,
    );

    return (
        <Paper className={classes.root}>
            {derivedInstanceMutation.isLoading && <LoadingSpinner />}
            <Grid container spacing={0}>
                <Grid
                    xs={6}
                    item
                    container
                    justifyContent="flex-start"
                    alignItems="center"
                >
                    <Typography variant="h5" gutterBottom>
                        {formatPeriod(period.periodString)}
                    </Typography>
                </Grid>
            </Grid>

            <section className={classes.reactTable}>
                <Table
                    data={forms}
                    pages={1}
                    defaultSorted={[{ id: 'label', desc: false }]}
                    count={forms.length}
                    redirectTo={() => null}
                    columns={columns}
                    showPagination={false}
                    showFooter
                />
            </section>
        </Paper>
    );
};

export default CompletenessPeriodComponent;
