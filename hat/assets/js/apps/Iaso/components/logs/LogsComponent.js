import React, { Component } from 'react';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import CustomTableComponent from '../CustomTableComponent';
import LoadingSpinner from '../LoadingSpinnerComponent';

import { orgUnitsLogsColumns } from '../../domains/orgUnits/config';
import LogsDetails from './LogsDetailsComponent';
import commonStyles from '../../styles/common';

import getTableUrl from '../../utils/tableUtils';
import { baseUrls } from '../../constants/urls';
import injectIntl from '../../libs/intl/injectIntl';
import MESSAGES from './messages';

const baseUrl = baseUrls.orgUnitDetails;

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginBottom: theme.spacing(2),
    },
});

class Logs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: orgUnitsLogsColumns(
                props.intl.formatMessage,
                props.classes,
            ),
            tableUrl: this.getEndpointUrl(),
        };
    }

    getEndpointUrl() {
        const { params, logObjectId } = this.props;
        const urlParams = {
            ...params,
            objectId: logObjectId,
            source: 'org_unit_api',
        };

        return getTableUrl('logs', urlParams);
    }

    goToRevision(revision) {
        this.props.goToRevision(revision).then(() => {
            this.setState({
                tableUrl: null,
            });
            this.setState({
                tableUrl: this.getEndpointUrl(),
            });
        });
    }

    render() {
        const {
            intl: { formatMessage },
            load,
            params,
            classes,
        } = this.props;
        const { tableUrl, tableColumns } = this.state;
        return (
            <section className={classes.reactTable}>
                {load.loading && (
                    <LoadingSpinner message={formatMessage(MESSAGES.loading)} />
                )}
                {tableUrl && (
                    <CustomTableComponent
                        disableHeaderFixed
                        pageSize={10}
                        isSortable
                        showPagination
                        endPointUrl={tableUrl}
                        columns={tableColumns}
                        defaultSorted={[{ id: 'created_at', desc: true }]}
                        params={params}
                        defaultPath={baseUrl}
                        dataKey="list"
                        multiSort
                        canSelect={false}
                        SubComponent={({ original }) =>
                            original ? (
                                <LogsDetails
                                    logId={original.id}
                                    goToRevision={revision =>
                                        this.goToRevision(revision)
                                    }
                                />
                            ) : null
                        }
                    />
                )}
            </section>
        );
    }
}

Logs.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    logObjectId: PropTypes.number.isRequired,
    goToRevision: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

const LogsWithIntl = injectIntl(Logs);

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(LogsWithIntl),
);
