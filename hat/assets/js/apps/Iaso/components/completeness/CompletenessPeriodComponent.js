import React, { Component } from 'react';

import {
    Paper, withStyles, Typography, Grid,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import { injectIntl } from 'react-intl';

import { getPrettyPeriod } from '../../utils/periodsUtils';
import commonStyles from '../../styles/common';
import customTableTranslations from '../../../../utils/constants/customTableTranslations';

const placeholder = '-';

const getBaseColumns = formatMessage => ([
    {
        Header: formatMessage({
            defaultMessage: 'Forms',
            id: 'iaso.forms.title',
        }),
        accessor: 'label',
        width: 300,
    },
]);

const getColumns = (formatMessage, months, classes, fieldKeys) => {
    const columns = getBaseColumns(formatMessage);
    months.forEach((month, index) => {
        const monthColumn = {
            Header: (
                <span className={classes.capitalize}>
                    {formatMessage({
                        defaultMessage: month.label,
                        id: `main.label.months.${month.label}`,
                    })}
                </span>
            ),
            accessor: month.label,
            columns: fieldKeys.map(fk => ({
                Header: (
                    <span className={classes.capitalize}>
                        {formatMessage({
                            defaultMessage: fk,
                            id: `iaso.completeness.${fk}`,
                        })}
                    </span>
                ),
                key: fk,
                accessor: `months[${index}].fields.${fk}`,
                Cell: (settings) => {
                    const value = settings.original.months[index].fields[fk];
                    return (
                        <span className={value ? classes[fk] : ''}>
                            {value || placeholder }
                        </span>
                    );
                },
            })),
        };
        columns.push(monthColumn);
    });
    return columns;
};


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
    errors: {
        color: theme.palette.error.main,
    },
    exported: {
        color: theme.palette.success.main,
    },
});

class CompletenessPeriodComponent extends Component {
    componentWillMount() {
        const { formatMessage } = this.props.intl;
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    render() {
        const {
            period, forms, fieldKeys, classes, intl: {
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
                            {getPrettyPeriod(period)}
                        </Typography>
                    </Grid>
                </Grid>

                <section className={classes.reactTable}>
                    <ReactTable
                        showPagination={false}
                        multiSort
                        columns={getColumns(formatMessage, forms[0].months, classes, fieldKeys)}
                        data={forms}
                        filterable={false}
                        sortable
                        className="-striped -highlight"
                        defaultSorted={[{ id: 'label', desc: false }]}
                        defaultPageSize={forms.length}
                    />
                </section>
            </Paper>
        );
    }
}


CompletenessPeriodComponent.propTypes = {
    period: PropTypes.string.isRequired,
    forms: PropTypes.array.isRequired,
    fieldKeys: PropTypes.array.isRequired,
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(injectIntl(CompletenessPeriodComponent));
