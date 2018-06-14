import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
    FormattedMessage,
    injectIntl,
    FormattedDate,
    defineMessages,
} from 'react-intl';

import CustomTableComponent from '../../../components/CustomTableComponent';
import LoadingSpinner from '../../../components/loading-spinner';


const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'teamsdevices.labels.all',
    },
    loading: {
        defaultMessage: 'Loading',
        id: 'teamsdevices.labels.loading',
    },
});

export class ManagementDevices extends Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;
        this.state = {
            tableColumns:
                [
                    {
                        Header: formatMessage({
                            defaultMessage: 'Utilisateur',
                            id: 'teamsdevices.label.user',
                        }),
                        accessor: 'last_user',
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Equipe',
                            id: 'teamsdevices.label.team',
                        }),
                        accessor: 'last_team',
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Dernière Sync',
                            id: 'teamsdevices.last_sync',
                        }),
                        accessor: 'last_synced_date',
                        Cell: (settings) => {
                            let res;
                            if (settings.original.last_synced_date) {
                                res = <FormattedDate value={new Date(settings.original.last_synced_date)} />;
                            } else {
                                res = '';
                            }
                            return res;
                        },
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Jours passés',
                            id: 'teamsdevices.days_ago',
                        }),
                        accessor: 'days_since_sync',
                        className: 'full-div',
                        Cell: (settings) => {
                            let daysClass = 'ok';
                            let daysString = settings.original.days_since_sync;
                            if (settings.original.days_since_sync < 0) {
                                daysString = 'Jamais Synchronisé';
                            }

                            if (settings.original.days_since_sync > 40) {
                                daysClass = 'error';
                            }
                            if (settings.original.days_since_sync > 20) {
                                daysClass = 'warning';
                            }
                            return (
                                <span className={daysClass}>
                                    {daysString}
                                </span>
                            );
                        },
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Total-Créé-Màj-Effacé',
                            id: 'teamsdevices.sync_summary',
                        }),
                        accessor: 'last_synced_log_message',
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Identifiant',
                            id: 'teamsdevices.device_id',
                        }),
                        accessor: 'device_id',
                    },
                ],
        };
    }

    render() {
        const { formatMessage } = this.props.intl;
        const { loading, error } = this.props.load;
        return (
            <div>
                {
                    error &&
                    <div className="widget__container">
                        <div className="widget__header">
                            <h2 className="widget__heading text--error"><FormattedMessage id="teamsdevices.header.error" defaultMessage="Error:" /></h2>
                        </div>
                        <div className="widget__content">
                            {error}
                        </div>
                    </div>
                }
                {
                    loading && <LoadingSpinner message={formatMessage(MESSAGES.loading)} />
                }

                <div className="widget__container" data-qa="monthly-report-data-loaded">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage id="teamsdevices.header.results" defaultMessage="Synchronisation des Appareils" />
                        </h2>
                    </div>
                    <CustomTableComponent
                        isSortable
                        showPagination={false}
                        endPointUrl="/api/datasets/device_status/?"
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'last_synced_date', desc: false }]}
                        params={this.props.params}
                        defaultPath="devices"
                        onRowClicked={caseItem => this.selectCase(caseItem)}
                        multiSort
                    />
                </div>
            </div>
        );
    }
}

const ManagementDevicesWithIntl = injectIntl(ManagementDevices);


ManagementDevices.defaultProps = {
};

ManagementDevices.propTypes = {
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
};
const MapStateToProps = state => ({
    config: state.config,
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});


export default connect(MapStateToProps, MapDispatchToProps)(ManagementDevicesWithIntl);
