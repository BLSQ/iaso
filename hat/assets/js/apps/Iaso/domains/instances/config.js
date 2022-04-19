import React, { useCallback, useState } from 'react';
import orderBy from 'lodash/orderBy';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
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
        instance_defining_id: instance_defining_id,
    };
};
export const actionTableColumn = (formatMessage = () => ({}), user, dispatchd) => {

    return {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        width: 150,
        Cell: settings => {
            const { mutateAsync: saveOu, isLoading: savingOu } = useSaveOrgUnit();
            const onError = () =>  {
              if (onError.status === 400) {
                onError.details.forEach(entry => {
                  setFieldErrors(entry.errorKey, [entry.errorMessage]);
                });
              }
            }

            const getUrl = (settings) => {
              const rowOriginal = settings.row.original;
              // each instance should have a formId
              let initialUrl = `${baseUrls.orgUnitDetails}/orgUnitId/${rowOriginal.org_unit.id}/formId/${rowOriginal.form_id}`;
              // there are some instances which don't have a form defining Id
              if(rowOriginal.form_defining_id) {
                initialUrl = `${initialUrl}/formDefiningId/${rowOriginal.form_defining_id}`;
              }
              // each instance has an id
              return `${initialUrl}/instanceId/${rowOriginal.id}`;
            }

            const linkOrgUnitToInstanceDefining = () => {
              const currentOrgUnit = settings.row.original.org_unit;
              const newOrgUnit = initialFormState(settings.row.original.org_unit, settings.row.original.id);
              let orgUnitPayload = omit({ ...currentOrgUnit, ...newOrgUnit });
              orgUnitPayload = {
                  ...orgUnitPayload,
                  groups:
                      orgUnitPayload.groups.length > 0 &&
                      !orgUnitPayload.groups[0].id
                          ? orgUnitPayload.groups
                          : orgUnitPayload.groups.map(g => g.id),
              };

              saveOu(orgUnitPayload)
                  .then(ou => {
                      const url = `${baseUrls.orgUnitDetails}/orgUnitId/${ou.id}`;
                      dispatch(redirectToAction(url, {}));
                  })
                  .catch(onError);
            }

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
                                url={getUrl(settings)}
                                icon="orgUnit"
                                tooltipMessage={MESSAGES.viewOrgUnit}
                            />
                        )}
                    {(settings.row.original.form_defining_id ==
                        settings.row.original.form_id &&  !settings.row.original.org_unit.instance_defining_id) &&
                        userHasPermission('iaso_org_units', user) && (
                            <IconButtonComponent
                                onClick={() =>
                                    linkOrgUnitToInstanceDefining()
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
