import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import moment from 'moment';
import {
    FormattedMessage,
    injectIntl,
    FormattedDate,
    defineMessages,
} from 'react-intl';

import CustomTableComponent from '../../../components/CustomTableComponent';
import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import { detailsActions } from '../redux/details';


const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'teamsdevices.labels.all',
    },
    loading: {
        defaultMessage: 'Chargement en cours',
        id: 'teamsdevices.labels.loading',
    },
});

const renderCountCell = (count, formatMessage) => {
    let daysClass = 'ok';
    let daysString = count;
    if (!count || count < 0) {
        daysString = formatMessage({
            defaultMessage: 'N/A',
            id: 'teamsdevices.last_sync.none',
        });
    }
    if (!count || count < 0 || count > 40) {
        daysClass = 'error';
    }
    if (count && count > 20 && count < 40) {
        daysClass = 'warning';
    }
    return (
        <span className={daysClass}>
            {daysString}
        </span>
    );
};

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
                        Cell: settings => renderCountCell(parseInt(settings.original.days_since_sync, 10), formatMessage),
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Images',
                            id: 'teamsdevices.images',
                        }),
                        accessor: 'count_captured_pictures',
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Images importées',
                            id: 'teamsdevices.uploaded_images',
                        }),
                        accessor: 'count_uploaded_pictures',
                        Cell: (settings) => {
                            const missingCount = (settings.original.count_captured_pictures - settings.original.count_uploaded_pictures);
                            return (
                                <span className={missingCount > 0 ? 'error-text' : ''} >
                                    {settings.original.count_uploaded_pictures}
                                    {
                                        missingCount > 0 &&
                                        <span>
                                            <br />
                                            {missingCount} {formatMessage({
                                                defaultMessage: 'manquantes',
                                                id: 'teamsdevices.missing',
                                            })}
                                        </span>
                                    }
                                </span>
                            );
                        },
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Jours passés (img)',
                            id: 'teamsdevices.daysImgSync',
                        }),
                        accessor: 'latest_image_upload',
                        className: 'full-div',
                        Cell: (settings) => {
                            let daysCount = -1;
                            if (settings.original.latest_image_upload) {
                                daysCount = moment().diff(settings.original.latest_image_upload, 'days');
                            }
                            return (
                                renderCountCell(daysCount, formatMessage)
                            );
                        },
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Vidéos',
                            id: 'teamsdevices.vidéos',
                        }),
                        accessor: 'count_captured_video',
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Vidéos importées',
                            id: 'teamsdevices.vidéos_uploaded',
                        }),
                        accessor: 'count_uploaded_video',
                        Cell: (settings) => {
                            const missingCount = (settings.original.count_captured_video - settings.original.count_uploaded_video);
                            return (
                                <span className={missingCount > 0 ? 'error-text' : ''} >
                                    {settings.original.count_uploaded_video}
                                    {
                                        missingCount > 0 &&
                                        <span>
                                            <br />
                                            {missingCount} {formatMessage({
                                                defaultMessage: 'manquantes',
                                                id: 'teamsdevices.missing',
                                            })}
                                        </span>
                                    }
                                </span>
                            );
                        },
                    },
                    {
                        Header: formatMessage({
                            defaultMessage: 'Jours passés (vidéo)',
                            id: 'teamsdevices.daysVideoSync',
                        }),
                        accessor: 'latest_video_upload',
                        className: 'full-div',
                        Cell: (settings) => {
                            let daysCount = -1;
                            if (settings.original.latest_video_upload) {
                                daysCount = moment().diff(settings.original.latest_video_upload, 'days');
                            }
                            return (
                                renderCountCell(daysCount, formatMessage)
                            );
                        },
                    },
                    // {
                    //     Header: formatMessage({
                    //         defaultMessage: 'Total-Créé-Màj-Effacé',
                    //         id: 'teamsdevices.sync_summary',
                    //     }),
                    //     accessor: 'last_synced_log_message',
                    // },
                ],
        };
    }

    selectDevice(deviceItem) {
        const { dispatch } = this.props;
        const from = moment().startOf('year').format('YYYY-MM-DD');
        const to = moment().format('YYYY-MM-DD');
        dispatch(detailsActions.loadCurrentDetail(deviceItem));
        const { order } = this.props.params;
        const tempParams = this.props.params;
        delete tempParams.order;
        this.props.redirectTo('detail', {
            ...tempParams,
            deviceOrder: order,
            deviceId: deviceItem.id,
            from,
            to,
        });
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
                        selectable
                        isSortable
                        showPagination={false}
                        endPointUrl="/api/devices/?"
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'last_synced_date', desc: false }]}
                        params={this.props.params}
                        defaultPath="devices"
                        onRowClicked={deviceItem => this.selectDevice(deviceItem)}
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
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};
const MapStateToProps = state => ({
    config: state.config,
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default connect(MapStateToProps, MapDispatchToProps)(ManagementDevicesWithIntl);
