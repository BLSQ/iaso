import React from 'react';

const casesListColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Année',
                id: 'casesList.label.normalized_year',
            }),
            accessor: 'normalized_year',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'casesList.label.name',
            }),
            accessor: 'name',
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
                defaultMessage: 'Postnom',
                id: 'casesList.label.Postnom',
            }),
            accessor: 'lastname',
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
                defaultMessage: 'Prénom',
                id: 'casesList.label.prename',
            }),
            accessor: 'prename',
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
                defaultMessage: 'Équipe',
                id: 'casesList.label.team',
            }),
            accessor: 'normalized_team_name',
            className: 'small',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'casesList.tooltip.province',
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
                id: 'casesList.tooltip.village',
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
                defaultMessage: 'Localisation',
                id: 'main.label.localisation',
            }),
            className: 'small',
            Cell: settings => (
                <section className={`table-row-action ${!settings.original.location.normalized.village ? 'not-located' : ''}`}>
                    {
                        !settings.original.location.normalized.village &&
                        <button
                            className="button--tiny margin-right"
                        >
                            <i className="fa fa-thumb-tack" />
                            {formatMessage({
                                defaultMessage: 'Localiser',
                                id: 'main.label.locateCase',
                            })}
                        </button>
                    }
                    {
                        settings.original.location.normalized.village &&
                        <i className="fa fa-check green-icon" />
                    }
                </section>
            ),
        },
    ]
);
export default casesListColumns;
