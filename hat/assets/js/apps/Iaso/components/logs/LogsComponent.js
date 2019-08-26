import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import PropTypes from 'prop-types';

import CustomTableComponent from '../../../../components/CustomTableComponent';
import LoadingSpinner from '../LoadingSpinnerComponent';

import orgUnitsLogsColumns from '../../constants/orgUnitsLogsColumns';
import LogsDetails from './LogsDetailsComponent';

const baseUrl = 'orgunits/detail';

class Logs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: orgUnitsLogsColumns(props.intl.formatMessage, this),
            tableUrl: this.getEndpointUrl(),
        };
    }

    getEndpointUrl() {
        let url = '/api/logs/?';
        const {
            params,
            logObjectId,
        } = this.props;
        const urlParams = {
            ...params,
            objectId: logObjectId,
            source: 'org_unit_api',
        };

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    render() {
        const {
            intl: { formatMessage },
            load,
            params,
        } = this.props;
        const { tableUrl, tableColumns } = this.state;
        return (
            <section className="logs-list-container">
                {
                    load.loading && (
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Loading',
                            id: 'main.label.loading',
                        })}
                        />
                    )
                }
                {
                    tableUrl
                    && (
                        <div className="widget__container  no-border">
                            <CustomTableComponent
                                disableHeaderFixed
                                pageSize={50}
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
                                SubComponent={({ original }) => (original ? <LogsDetails logId={original.id} /> : null)}
                            />
                        </div>
                    )
                }
            </section>
        );
    }
}

Logs.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    logObjectId: PropTypes.number.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

const LogsWithIntl = injectIntl(Logs);

export default connect(MapStateToProps, MapDispatchToProps)(LogsWithIntl);
