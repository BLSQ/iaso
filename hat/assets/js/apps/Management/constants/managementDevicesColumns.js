import React from 'react';
import { FormattedDate } from 'react-intl';
import moment from 'moment';
import { renderCountCell } from '../pages/ManagementDetails/utils';

const managementDevicesColumns = (formatMessage, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'User',
                id: 'main.label.user',
            }),
            accessor: 'last_user',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Equipe',
                id: 'main.label.team',
            }),
            accessor: 'last_team',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Last Sync',
                id: 'teamsdevices.last_sync',
            }),
            accessor: 'last_synced_date',
            className: 'small',
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
                defaultMessage: 'Days passed',
                id: 'teamsdevices.days_ago',
            }),
            accessor: 'days_since_sync',
            className: 'full-div small',
            Cell: settings => renderCountCell(parseInt(settings.original.days_since_sync, 10), formatMessage),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Images',
                id: 'main.label.images',
            }),
            accessor: 'count_captured_pictures',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Uploaded images',
                id: 'teamsdevices.uploaded_images',
            }),
            accessor: 'count_uploaded_pictures',
            className: 'small',
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
                                    defaultMessage: 'missing',
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
                defaultMessage: 'Days passed (img)',
                id: 'teamsdevices.daysImgSync',
            }),
            accessor: 'latest_image_upload',
            className: 'full-div small',
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
                defaultMessage: 'Videos',
                id: 'main.label.videos',
            }),
            className: 'small',
            accessor: 'count_captured_video',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Uploaded videos',
                id: 'teamsdevices.vidéos_uploaded',
            }),
            className: 'small',
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
                                    defaultMessage: 'missing',
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
            className: 'full-div small',
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
        {
            Header: formatMessage({
                defaultMessage: 'Total-Created-Update-Delete',
                id: 'teamsdevices.sync_summary',
            }),
            className: 'small',
            accessor: 'last_synced_log_message',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Action',
                id: 'main.label.action',
            }),
            sortable: false,
            resizable: false,
            width: 100,
            className: 'action-zone',
            Cell: settings => (
                <section>
                    <button
                        className="button--edit--tiny "
                        onClick={() =>
                            component.selectDevice(settings.original)}
                    >
                        <i className="fa fa-info-circle" />
                        {
                            formatMessage({
                                defaultMessage: 'Infos',
                                id: 'main.label.infos',
                            })
                        }
                    </button>
                </section>
            ),
        },
    ]
);
export default managementDevicesColumns;
