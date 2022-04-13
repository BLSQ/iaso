import React, { useCallback } from 'react';
import orderBy from 'lodash/orderBy';
import mapValues from 'lodash/mapValues';
import { useDispatch } from 'react-redux';

import { IconButton as IconButtonComponent } from 'bluesquare-components';
import LinkIcon from '@material-ui/icons/Link';
import { baseUrls } from '../../constants/urls';
import { INSTANCE_METAS_FIELDS } from './constants';
import MESSAGES from './messages';
import { userHasPermission } from '../users/utils';
import { useFormState } from '../../hooks/form';
import { useSaveOrgUnit } from '../orgUnits/hooks';
import { redirectTo as redirectToAction } from '../../routing/actions';

const updateOrgUnit = (orgUnit, instance_defining_id) => {
    const newOrgUnit = initialFormState(orgUnit, instance_defining_id);
    useSaveOrgUnit();
};

const updateFormID = (settings, dispatch, setFormId, setFormDefiningId) => {
  const form_id = settings.row.original.form_id;
  const form_defining_id = settings.row.original.form_defining_id;
  setFormId(form_id);
  setFormDefiningId(form_defining_id)
  const url = `${baseUrls.orgUnitDetails}/orgUnitId/${settings.row.original.org_unit.id}`;
  dispatch(redirectToAction(url, {}));
};

const initialFormState = (orgUnit, instance_defining_id) => {
    return {
        id: orgUnit.id,
        name: orgUnit.name,
        org_unit_type_id: orgUnit.org_unit_type_id
            ? `${orgUnit.org_unit_type_id}`
            : null,
        groups: orgUnit.groups?.map(g => g.id) ?? [],
        sub_source: orgUnit.sub_source,
        validation_status: orgUnit.validation_status,
        aliases: orgUnit.aliases,
        parent_id: orgUnit.parent_id,
        source_ref: orgUnit.source_ref,
        instance_defining_id,
    };
};
export const actionTableColumn = (formatMessage = () => ({}), user, dispatch, setFormId, setFormDefiningId) => {
    return {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        width: 150,
        Cell: settings => {
            console.log('settings', settings);
            return (
                <section>
                    <IconButtonComponent
                        url={`${baseUrls.instanceDetail}/instanceId/${settings.row.original.id}`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.view}
                    />
                    {settings.row.original.org_unit &&
                        userHasPermission('iaso_org_units', user) && (
                            <IconButtonComponent
                                icon="orgUnit"
                                tooltipMessage={MESSAGES.viewOrgUnit}
                                onClick={() =>
                                    updateFormID(
                                        settings,
                                        dispatch,
                                        setFormId,
                                        setFormDefiningId
                                    )
                                }
                            />
                        )}
                    {settings.row.original.form_defining_id ==
                        settings.row.original.form_id &&
                        userHasPermission('iaso_org_units', user) && (
                            <IconButtonComponent
                                onClick={() =>
                                    updateOrgUnit(
                                        settings.row.original.org_unit,
                                        settings.row.original.id,
                                    )
                                }
                                overrideIcon={LinkIcon}
                                tooltipMessage={
                                    MESSAGES.linkOrgUnitInstanceDefining
                                }
                            />
                        )}
                </section>
            );
        },
    };
};

const instancesTableColumns = (formatMessage = () => ({})) => {
    const columns = [];
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
