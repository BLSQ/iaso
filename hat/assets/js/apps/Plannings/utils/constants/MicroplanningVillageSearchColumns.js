import React from 'react';

import { formatThousand } from '../../../../utils';

const villageSearchColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'main.label.name',
            }),
            width: 250,
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Population',
                id: 'main.label.population',
            }),
            className: 'small',
            accessor: 'population',
            Cell: settings => (
                <section>
                    {formatThousand(settings.original.population)}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Positive cases',
                id: 'main.label.nr_positive_cases',
            }),
            className: 'small',
            accessor: 'nr_positive_cases',
            Cell: settings => (
                <section>
                    {formatThousand(settings.original.nr_positive_cases)}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'main.label.province',
            }),
            className: 'small',
            sortable: true,
            accessor: 'AS__ZS__province__name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Zone',
                id: 'main.label.zone_short',
            }),
            className: 'small',
            sortable: true,
            accessor: 'AS__ZS__name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Area',
                id: 'main.label.area_short',
            }),
            className: 'small',
            sortable: true,
            accessor: 'AS__name',
        },
    ]
);
export default villageSearchColumns;
