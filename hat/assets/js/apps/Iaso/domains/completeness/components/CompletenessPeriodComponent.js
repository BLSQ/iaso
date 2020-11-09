import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { Paper, withStyles, Typography, Grid } from '@material-ui/core';
import ReactTable, { ReactTableDefaults } from 'react-table';

import { getColumns } from '../config';
import commonStyles from '../../../styles/common';
import customTableTranslations from '../../../constants/customTableTranslations';
import { baseUrls } from '../../../constants/urls';

const styles = theme => ({
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
});

class CompletenessPeriodComponent extends Component {
    componentDidMount() {
        const { formatMessage } = this.props.intl;
        Object.assign(
            ReactTableDefaults,
            customTableTranslations(formatMessage),
        );
    }

    onSelectCell(form, status, period) {
        this.props.redirectTo(baseUrls.instances, {
            formId: form.id,
            periods: period.asPeriodType(form.period_type).periodString,
            status: status.toUpperCase(),
        });
    }

    onClick(form, onGenerateDerivedInstances) {
        const periods = Array.from(
            new Set(Object.values(form.months).map(m => m.period.periodString)),
        );
        const derived = form.generate_derived;
        onGenerateDerivedInstances({ periods, derived });
    }

    render() {
        const {
            period,
            forms,
            activeInstanceStatuses,
            activePeriodType,
            classes,
            intl: { formatMessage },
            onGenerateDerivedInstances,
        } = this.props;

        return (
            <Paper className={classes.root}>
                <Grid container spacing={0}>
                    <Grid
                        xs={6}
                        item
                        container
                        justify="flex-start"
                        alignItems="center"
                    >
                        <Typography variant="h5" gutterBottom>
                            {period.toCode()}
                        </Typography>
                    </Grid>
                </Grid>

                <section className={classes.reactTable}>
                    <ReactTable
                        showPagination={false}
                        multiSort
                        columns={getColumns(
                            formatMessage,
                            period.monthRange,
                            classes,
                            activeInstanceStatuses,
                            (form, status, p) =>
                                this.onSelectCell(form, status, p),
                            arg =>
                                this.onClick(arg, onGenerateDerivedInstances),
                            activePeriodType,
                        )}
                        data={forms}
                        filterable={false}
                        sortable={false}
                        className="-striped -highlight"
                        defaultSorted={[{ id: 'label', desc: false }]}
                        defaultPageSize={forms.length}
                        resizable={false}
                    />
                </section>
            </Paper>
        );
    }
}
CompletenessPeriodComponent.propTypes = {
    period: PropTypes.object.isRequired,
    forms: PropTypes.arrayOf(PropTypes.object).isRequired,
    activeInstanceStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
    activePeriodType: PropTypes.string.isRequired,
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    onGenerateDerivedInstances: PropTypes.func.isRequired,
};
export default injectIntl(withStyles(styles)(CompletenessPeriodComponent));
