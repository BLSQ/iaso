import React from 'react';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { IconButton, Tooltip } from '@material-ui/core';
import MapIcon from '@material-ui/icons/Map';
import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import UnDelete from '@material-ui/icons/DeleteForever';
import Clear from '@material-ui/icons/Clear';

const onLocateCase = caseItem => window.open(`/dashboard/locator/case_id/${caseItem.id}`, '_blank');

const casesListColumns = (formatMessage, canEditPatientInfos, canDeleteForever, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Type',
                id: 'main.label.type',
            }),
            accessor: 'screening_type',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.screening_type === 'active' && formatMessage({
                            defaultMessage: 'Active',
                            id: 'main.label.active',
                        })
                    }
                    {
                        settings.original.screening_type === 'passive' && formatMessage({
                            defaultMessage: 'Passive',
                            id: 'main.label.passive',
                        })
                    }
                    {
                        !settings.original.screening_type && '--'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Date',
                id: 'main.label.date',
            }),
            accessor: 'normalized_date',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.normalized_date
                            ? moment(settings.original.normalized_date).format('YYYY-MM-DD')
                            : '--'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'main.label.name',
            }),
            accessor: 'normalized_patient__last_name',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.patient.last_name
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Post name',
                id: 'main.label.postName',
            }),
            accessor: 'normalized_patient__post_name',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.patient.post_name
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'First name',
                id: 'main.label.firstName',
            }),
            accessor: 'normalized_patient__first_name',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.patient.first_name
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Mother surname',
                id: 'main.label.mothers_surname',
            }),
            accessor: 'normalized_patient__mothers_surname',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.patient.mothers_surname
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'team',
                id: 'main.label.team',
            }),
            accessor: 'normalized_team_name',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'main.label.province',
            }),
            accessor: 'normalized_province_name',
            className: 'small',
        },
        {
            Header: 'ZS',
            accessor: 'normalized_zs_name',
            className: 'small',
        },
        {
            Header: 'AS',
            accessor: 'normalized_as_name',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Village',
                id: 'main.label.village',
            }),
            accessor: 'normalized_village_name',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Source',
                id: 'main.label.source',
            }),
            accessor: 'source',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Actions',
                id: 'main.label.actions',
            }),
            sortable: false,
            width: component.props.currentUser.is_superuser ? 200 : 150,
            className: 'small',
            Cell: settings => (
                <section className={`table-row-action ${!settings.original.location.normalized.village ? 'not-located' : ''}`}>
                    {
                        !settings.original.location.normalized.village
                        && (
                            <Tooltip
                                title={<FormattedMessage id="main.label.locateCase" defaultMessage="Locate" />}
                            >
                                <IconButton
                                    onClick={() => onLocateCase(settings.original)}
                                >
                                    <MapIcon />
                                </IconButton>
                            </Tooltip>
                        )
                    }
                    <Tooltip
                        title={<FormattedMessage id="main.label.see" defaultMessage="See" />}
                    >
                        <IconButton
                            onClick={() => component.onSelectCase(settings.original)}
                        >
                            <VisibilityIcon />
                        </IconButton>
                    </Tooltip>
                    {
                        canEditPatientInfos
                        && !settings.original.mark_for_deletion
                        && (
                            <Tooltip
                                title={<FormattedMessage id="main.label.delete" defaultMessage="Delete" />}
                            >
                                <IconButton
                                    onClick={() => component.onDeleteCase(settings.original)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        )
                    }
                    {
                        canEditPatientInfos
                        && settings.original.mark_for_deletion
                        && (
                            <Tooltip
                                title={<FormattedMessage id="main.label.cancelDelete" defaultMessage="Cancel delete" />}
                            >
                                <IconButton
                                    onClick={() => component.onDeleteCase(settings.original)}
                                >
                                    <UnDelete />
                                </IconButton>
                            </Tooltip>
                        )
                    }
                    {
                        canDeleteForever
                        && settings.original.mark_for_deletion
                        && (
                            <Tooltip
                                title={<FormattedMessage id="main.label.deleteForever" defaultMessage="Delete permanently" />}
                            >
                                <IconButton
                                    onClick={() => component.toggleDeleteModale(settings.original)}
                                >
                                    <Clear />
                                </IconButton>
                            </Tooltip>
                        )
                    }
                </section>
            ),
        },
    ]
);
export default casesListColumns;
