import React from 'react';
import orderBy from 'lodash/orderBy';

import { IconButton as IconButtonComponent } from 'bluesquare-components';

import { baseUrls } from '../../constants/urls';
import { INSTANCE_METAS_FIELDS } from './constants';
import MESSAGES from './messages';
import { userHasPermission } from '../users/utils';

const instancesTableColumns = (formatMessage = () => ({}), user) => {
    const columns = [
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            width: 150,
            Cell: settings => (
                <section>
                    <IconButtonComponent
                        url={`${baseUrls.instanceDetail}/instanceId/${settings.row.original.id}`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.view}
                    />
                    {settings.row.original.org_unit &&
                        userHasPermission('iaso_org_units', user) && (
                            <IconButtonComponent
                                url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.org_unit.id}`}
                                icon="orgUnit"
                                tooltipMessage={MESSAGES.viewOrgUnit}
                            />
                        )}
                </section>
            ),
        },
    ];
    let metaFields = INSTANCE_METAS_FIELDS.filter(f => Boolean(f.tableOrder));
    metaFields = orderBy(metaFields, [f => f.tableOrder], ['asc']);
    metaFields.forEach(f =>
        columns.push({
            Header: formatMessage(MESSAGES[f.key]),
            accessor: f.accessor || f.key,
            sortable: f.sortable !== false,
            Cell:
                f.Cell ||
                (settings =>
                    f.render
                        ? f.render(settings.row.original[f.key])
                        : settings.row.original[f.key]),
        }),
    );
    return columns;
};

export default instancesTableColumns;
