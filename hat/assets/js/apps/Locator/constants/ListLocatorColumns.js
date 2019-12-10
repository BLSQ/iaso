
import React from 'react';

const listLocatorColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Form year',
                id: 'main.label.form_year',
            }),
            accessor: 'normalized_year',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Team',
                id: 'main.label.team',
            }),
            accessor: 'mobile_unit',
            Cell: settings => (
                <span>
                    {
                        settings.original.team.mobile_unit
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Normalized team',
                id: 'main.label.normalized_team',
            }),
            accessor: 'normalized_team_name',
            Cell: settings => (
                <span>
                    {
                        settings.original.team.normalized_team && settings.original.team.normalized_team.name
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Form number',
                id: 'main.label.form_number',
            }),
            accessor: 'form_number',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'main.label.province',
            }),
            accessor: 'normalized_province_name',
            sortable: true,
            Cell: settings => (
                <span>
                    {
                        settings.original.location.province
                    }
                </span>
            ),
        },
        {
            Header: 'ZS',
            accessor: 'normalized_zs_name',
            sortable: true,
            Cell: settings => (
                <span>
                    {
                        settings.original.location.ZS
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Given AS',
                id: 'main.label.givenAS',
            }),
            accessor: 'AS',
            sortable: true,
            Cell: settings => (
                <span>
                    {
                        settings.original.location.AS
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Found AS',
                id: 'main.label.foundAS',
            }),
            accessor: 'normalized_as_name',
            sortable: true,
            Cell: settings => (
                <span
                    className={!settings.original.location.normalized || !settings.original.location.normalized.as ? 'bullet' : ''}
                >
                    {
                        settings.original.location.normalized && settings.original.location.normalized.as &&
                        settings.original.location.normalized.as.name
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Village',
                id: 'main.label.village',
            }),
            accessor: 'location.village',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Source',
                id: 'main.label.source',
            }),
            accessor: 'source',
        },
    ]
);
export default listLocatorColumns;
