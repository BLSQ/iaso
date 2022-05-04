/* eslint-disable react/prop-types */
import React from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import LinkIcon from '@material-ui/icons/Link';
import omit from 'lodash/omit';
import { useDispatch } from 'react-redux';
import { useSaveOrgUnit } from '../../orgUnits/hooks';
import { baseUrls } from '../../../constants/urls';
import { userHasPermission } from '../../users/utils';
import MESSAGES from '../messages';
import { redirectTo as redirectToAction } from '../../../routing/actions';
import { useFormState } from '../../../hooks/form';

// eslint-disable-next-line camelcase
const initialFormState = (orgUnit, instance_defining_id) => {
    return {
        id: orgUnit.id,
        name: orgUnit.name,
        org_unit_type_id: orgUnit?.org_unit_type_id?.toString() ?? undefined,
        groups: orgUnit.groups?.map(g => g.id) ?? [],
        sub_source: orgUnit.sub_source,
        validation_status: orgUnit.validation_status,
        aliases: orgUnit.aliases,
        parent_id: orgUnit.parent_id,
        source_ref: orgUnit.source_ref,
        instance_defining_id,
    };
};

const ActionTableColumnComponent = ({ settings, user }) => {
    const [setFieldErrors] = useFormState(
        initialFormState(
            settings.row.original.org_unit,
            settings.row.original.id,
        ),
    );
    const dispatch = useDispatch();
    const { mutateAsync: saveOu } = useSaveOrgUnit();
    const onError = () => {
        if (onError.status === 400) {
            onError.details.forEach(entry => {
                setFieldErrors(entry.errorKey, [entry.errorMessage]);
            });
        }
    };

    const getUrl = data => {
        const rowOriginal = data.row.original;
        // each instance should have a formId
        let initialUrl = `${baseUrls.orgUnitDetails}/orgUnitId/${rowOriginal.org_unit.id}/formId/${rowOriginal.form_id}`;
        // there are some instances which don't have a form defining Id
        if (rowOriginal.form_defining_id) {
            initialUrl = `${initialUrl}/formDefiningId/${rowOriginal.form_defining_id}`;
        }
        // each instance has an id
        return `${initialUrl}/instanceId/${rowOriginal.id}`;
    };

    const linkOrgUnitToInstanceDefining = () => {
        const currentOrgUnit = settings.row.original.org_unit;
        const newOrgUnit = initialFormState(
            settings.row.original.org_unit,
            settings.row.original.id,
        );
        let orgUnitPayload = omit({ ...currentOrgUnit, ...newOrgUnit });
        orgUnitPayload = {
            ...orgUnitPayload,
            groups:
                orgUnitPayload.groups.length > 0 && !orgUnitPayload.groups[0].id
                    ? orgUnitPayload.groups
                    : orgUnitPayload.groups.map(g => g.id),
        };

        saveOu(orgUnitPayload)
            .then(ou => {
                const url = `${baseUrls.orgUnitDetails}/orgUnitId/${ou.id}`;
                dispatch(redirectToAction(url, {}));
            })
            .catch(onError);
    };

    const showButton =
        settings.row.original.form_defining_id ===
            settings.row.original.form_id &&
        !settings.row.original.org_unit.instance_defining_id &&
        userHasPermission('iaso_org_units', user);

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
            {showButton && (
                <IconButtonComponent
                    onClick={() => linkOrgUnitToInstanceDefining()}
                    overrideIcon={LinkIcon}
                    tooltipMessage={MESSAGES.linkOrgUnitInstanceDefining}
                />
            )}
        </section>
    );
};
export default ActionTableColumnComponent;
