import React from 'react';
import orderBy from 'lodash/orderBy';

import ColumnTextComponent from '../../components/tables/ColumnTextComponent';
import IconButtonComponent from '../../components/buttons/IconButtonComponent';

import { baseUrls } from '../../constants/urls';
import { INSTANCE_METAS_FIELDS } from './constants';
import MESSAGES from './messages';

const instancesTableColumns = (formatMessage = () => ({})) => {
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
                        url={`${baseUrls.instanceDetail}/instanceId/${settings.original.id}`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.view}
                    />
                    <IconButtonComponent
                        onClick={() =>
                            window.open(settings.original.file_url, '_blank')
                        }
                        icon="xml"
                        tooltipMessage={MESSAGES.downloadXml}
                    />
                    {settings.original.org_unit && (
                        <IconButtonComponent
                            url={`${baseUrls.orgUnitDetails}/orgUnitId/${settings.original.org_unit.id}`}
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
            Cell: settings => (
                <ColumnTextComponent
                    title={f.title ? f.title(settings.original[f.key]) : null}
                    text={
                        f.render
                            ? f.render(settings.original[f.key])
                            : settings.original[f.key]
                    }
                />
            ),
        }),
    );
    return columns;
};

export default instancesTableColumns;
