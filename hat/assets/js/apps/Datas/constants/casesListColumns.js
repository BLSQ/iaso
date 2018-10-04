import React from 'react';

const casesListColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Année',
                id: 'casesList.label.normalized_year',
            }),
            accessor: 'normalized_year',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'casesList.label.name',
            }),
            accessor: 'lastname',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Postnom',
                id: 'casesList.label.Postnom',
            }),
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Prénom',
                id: 'casesList.label.prename',
            }),
            accessor: 'prename',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Équipe',
                id: 'casesList.label.team',
            }),
            accessor: 'normalized_team_name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'casesList.tooltip.province',
            }),
            accessor: 'normalized_province_name',
        },
        {
            Header: 'ZS',
            accessor: 'normalized_zs_name',
        },
        {
            Header: 'AS',
            accessor: 'normalized_as_name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Village',
                id: 'casesList.tooltip.village',
            }),
            accessor: 'normalized_village_name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Source',
                id: 'main.label.name',
            }),
            accessor: 'source',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Localisation',
                id: 'main.label.localisation',
            }),
            Cell: settings => (
                <section className={`table-row-action ${!settings.original.normalized_village_id ? 'not-located' : ''}`}>
                    {
                        !settings.original.normalized_village_id &&
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
                        settings.original.normalized_village_id &&
                        <i className="fa fa-check green-icon" />
                    }
                </section>
            ),
        },
    ]
);
export default casesListColumns;
