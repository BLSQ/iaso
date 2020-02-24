import React from 'react';
import { IconButton, Tooltip } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import Eye from '@material-ui/icons/RemoveRedEye';
import Check from '@material-ui/icons/Check';
import Close from '@material-ui/icons/Close';


import { formatThousand } from '../../../../utils';

const villageSearchColumns = (formatMessage, assignations, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Assignations',
                id: 'vector.modale.assignation.title',
            }),
            className: 'small',
            accessor: 'selected',
            sortable: false,
            Cell: (settings) => {
                const villageSelected = assignations.find(sv => sv.village_id === settings.original.id);
                return (
                    <section>
                        {
                            villageSelected
                            && <Check className="success-icon" />
                        }
                        {
                            !villageSelected
                            && <Close className="error-icon" />
                        }
                    </section>
                );
            },
        },
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'main.label.name',
            }),
            width: 250,
            className: 'small',
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
        {
            Header: formatMessage({
                defaultMessage: 'Map',
                id: 'main.label.map',
            }),
            className: 'small',
            sortable: false,
            accessor: 'selected_id',
            Cell: settings => (
                <Tooltip
                    title={<FormattedMessage id="main.label.locateCase" defaultMessage="Locate" />}
                >
                    <IconButton
                        onClick={() => component.displayItem(settings.original)}
                    >
                        <Eye />
                    </IconButton>
                </Tooltip>
            ),
        },
    ]
);

export default villageSearchColumns;
