import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography, Grid, makeStyles } from '@material-ui/core';

import { useSafeIntl, commonStyles, Table } from 'bluesquare-components';
import { getColumns } from '../config';
import { baseUrls } from '../../../constants/urls';

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
    onGenerateDerivedInstances,
    redirectTo,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const onSelectCell = (form, status, selectedPeriod) => {
        redirectTo(baseUrls.instances, {
            formId: form.id,
            periods: selectedPeriod.asPeriodType(form.period_type).periodString,
            status: status.toUpperCase(),
        });
    };

    const onClick = form => {
        const periods = Array.from(
            new Set(Object.values(form.months).map(m => m.period.periodString)),
        );
        const derived = form.generate_derived;
        onGenerateDerivedInstances({ periods, derived });
    };
    const columns = getColumns(
        formatMessage,
        period.monthRange,
        classes,
        activeInstanceStatuses,
        (form, status, p) => onSelectCell(form, status, p),
        arg => onClick(arg, onGenerateDerivedInstances),
        activePeriodType,
    );

    return (
        <Paper className={classes.root}>
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
    redirectTo: PropTypes.func.isRequired,
    onGenerateDerivedInstances: PropTypes.func.isRequired,
};
export default CompletenessPeriodComponent;
