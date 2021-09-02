import React from 'react';
import PropTypes from 'prop-types';
import { Grid, makeStyles, Paper, Typography } from '@material-ui/core';

import {
    commonStyles,
    LoadingSpinner,
    Table,
    useSafeIntl,
} from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { useMutation, useQueryClient } from 'react-query';
import { getColumns } from '../config';
import { baseUrls } from '../../../constants/urls';
import { redirectTo } from '../../../routing/actions';
import { postRequest } from '../../../libs/Api';
import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import {
    errorSnackBar,
    succesfullSnackBar,
} from '../../../constants/snackBars';

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

const CompletenessPeriodComponent = ({
    activeInstanceStatuses,
    period,
    forms,
    activePeriodType,
}) => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    const mutation = useMutation(
        ['completness', 'generate'],
        async derivedrequest => {
            try {
                await postRequest('/api/derivedinstances/', derivedrequest);
                await queryClient.invalidateQueries(['completness']);
                dispatch(
                    enqueueSnackbar(
                        succesfullSnackBar('generateDerivedRequestSuccess'),
                    ),
                );
            } catch (err) {
                dispatch(
                    enqueueSnackbar(
                        errorSnackBar('generateDerivedRequestError', null, err),
                    ),
                );
            }
        },
    );
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const onSelectCell = (form, status, selectedPeriod) => {
        dispatch(
            redirectTo(baseUrls.instances, {
                formId: form.id,
                periods: selectedPeriod.asPeriodType(form.period_type).periodString,
                status: status.toUpperCase(),
            }),
        );
    };

    const onClick = form => {
        const periods = Array.from(
            new Set(Object.values(form.months).map(m => m.period.periodString)),
        );
        const derived = form.generate_derived;
        mutation.mutate({ periods, derived });
    };
    const columns = getColumns(
        formatMessage,
        period.monthRange,
        classes,
        activeInstanceStatuses,
        (form, status, p) => onSelectCell(form, status, p),
        arg => onClick(arg),
        activePeriodType,
    );

    return (
        <Paper className={classes.root}>
            {mutation.isLoading && <LoadingSpinner />}
            <Grid container spacing={0}>
                <Grid
                    xs={6}
                    item
                    container
                    justifyContent="flex-start"
                    alignItems="center"
                >
                    <Typography variant="h5" gutterBottom>
                        {period.toCode()}
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

CompletenessPeriodComponent.propTypes = {
    period: PropTypes.object.isRequired,
    forms: PropTypes.arrayOf(PropTypes.object).isRequired,
    activeInstanceStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
    activePeriodType: PropTypes.string.isRequired,
};

export default CompletenessPeriodComponent;
