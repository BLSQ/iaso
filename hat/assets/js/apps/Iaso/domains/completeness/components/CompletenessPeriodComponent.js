import React, { Component } from 'react';
import moment from 'moment';

import {
    Paper, withStyles, Typography, Grid,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import { injectIntl } from 'react-intl';

import { getPrettyPeriod, getPeriodType } from '../../../utils/periodsUtils';
import { getColumns } from '../utils';
import commonStyles from '../../../styles/common';
import customTableTranslations from '../../../../../utils/constants/customTableTranslations';
import DatePeriods from '../../../libs/DatePeriods';

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
    },
    ready: {
        color: theme.palette.success.main,
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
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    onSelectCell(form, status, monthId, period) {
        // need to check if selected cell has the same period type as the displayed period type, if not it's a monthly period type with selected month
        const { redirectTo } = this.props;
        const params = {
            status,
            periods: period,
        };
        const currentPeriodType = getPeriodType(period);
        const year = period.substring(0, 4);
        if (form) {
            if (currentPeriodType !== form.period_type) {
                const currentDate = `${year}-${monthId}`;
                switch (form.period_type) {
                    case 'MONTH':
                        params.periods = `${year}${monthId < 10 ? `0${monthId}` : monthId}`;
                        break;
                    case 'QUARTER':
                        params.periods = DatePeriods.currentQuarter(moment(currentDate).toDate());
                        break;
                    case 'SIX_MONTH':
                        params.periods = DatePeriods.currentSemester(moment(currentDate).toDate());
                        break;

                    default:
                        params.periods = year;
                }
            }
            params.formId = form.id;

            redirectTo('instances', params);
        }
    }

    render() {
        const {
            data, activeInstanceStatuses, classes, intl: {
                formatMessage,
            },
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
                            {getPrettyPeriod(data.period.periodString)}
                        </Typography>
                    </Grid>
                </Grid>

                <section className={classes.reactTable}>
                    <ReactTable
                        showPagination={false}
                        multiSort
                        columns={getColumns(
                            formatMessage,
                            data.period.monthRange,
                            classes,
                            activeInstanceStatuses,
                            (form, status, month) => this.onSelectCell(form, status, month, data.period.periodString),
                        )}
                        data={Object.values(data.forms)}
                        filterable={false}
                        sortable
                        className="-striped -highlight"
                        defaultSorted={[{ id: 'label', desc: false }]}
                        defaultPageSize={Object.keys(data.forms).length}
                    />
                </section>
            </Paper>
        );
    }
}
CompletenessPeriodComponent.propTypes = {
    data: PropTypes.object.isRequired,
    activeInstanceStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
};
export default withStyles(styles)(injectIntl(CompletenessPeriodComponent));
