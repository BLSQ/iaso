import moment from 'moment';
import React from 'react';
import { FormattedMessage } from 'react-intl';

const catchesColumns = (formatMessage, getDetail) => (
    [
        {
            Header: 'UUID',
            className: 'small',
            accessor: 'uuid',
            width: 250,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Set up',
                id: 'vector.catchs.setup_date',
            }),
            accessor: 'setup_date',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        moment(settings.original.setup_date).format('DD/MM/YYYY HH:mm')
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Collected',
                id: 'vector.catchs.collect_date',
            }),
            accessor: 'collect_date',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        moment(settings.original.collect_date).format('DD/MM/YYYY HH:mm')
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Male',
                id: 'vector.catchs.male',
            }),
            className: 'small',
            accessor: 'male_count',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Female',
                id: 'vector.catchs.female',
            }),
            className: 'small',
            accessor: 'female_count',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Inconnu',
                id: 'main.label.unknown',
            }),
            className: 'small',
            accessor: 'unknown_count',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Remarks',
                id: 'main.label.remarks',
            }),
            className: 'small',
            accessor: 'remarks',
        },
        {
            Header: formatMessage({
                defaultMessage: 'User',
                id: 'main.label.user',
            }),
            className: 'small',
            accessor: 'username',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Actions',
                id: 'main.label.actions',
            }),
            sortable: false,
            resizable: false,
            Cell: settings => (
                <section>
                    <button
                        className="button--edit--tiny"
                        onClick={() => getDetail(settings.original.id, 'catches', 'showEditCatchesModale')}
                    >
                        <i className="fa fa-info-circle" />
                        <FormattedMessage id="main.label.details" defaultMessage="Détails" />
                    </button>
                </section>
            ),
        },
    ]
);
export default catchesColumns;

