/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import LinkIcon from '@material-ui/icons/Link';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import omit from 'lodash/omit';
import { useDispatch } from 'react-redux';
import { DialogContentText } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import { useSaveOrgUnit } from '../../orgUnits/hooks';
import { baseUrls } from '../../../constants/urls';
import { userHasPermission } from '../../users/utils';
import MESSAGES from '../messages';
import { redirectTo as redirectToAction } from '../../../routing/actions';
import { useFormState } from '../../../hooks/form';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
// eslint-disable-next-line camelcase
const initialFormState = (orgUnit, referenceSubmissionId) => {
    return {
        id: orgUnit?.id,
        name: orgUnit?.name,
        org_unit_type_id: orgUnit?.org_unit_type_id?.toString() ?? undefined,
        groups: orgUnit?.groups?.map(g => g.id) ?? [],
        sub_source: orgUnit?.sub_source,
        validation_status: orgUnit?.validation_status,
        aliases: orgUnit?.aliases,
        parent_id: orgUnit?.parent_id,
        source_ref: orgUnit?.source_ref,
        reference_instance_id: referenceSubmissionId,
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
        // there are some instances which don't have a reference form Id
        if (rowOriginal.reference_form_id) {
            initialUrl = `${initialUrl}/referenceFormId/${rowOriginal.reference_form_id}`;
        }
        // each instance has an id
        return `${initialUrl}/instanceId/${rowOriginal.id}`;
    };

    const linkOrgUnitToReferenceSubmission = referenceSubmissionId => {
        const currentOrgUnit = settings.row.original.org_unit;
        const newOrgUnit = initialFormState(
            settings.row.original.org_unit,
            referenceSubmissionId,
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
        settings.row.original.reference_form_id ===
            settings.row.original.form_id &&
        userHasPermission('iaso_org_units', user);
    const notLinked =
        !settings.row.original?.org_unit?.reference_instance_id &&
        userHasPermission('iaso_org_units', user);

    const confirmCancelTitleMessage = isItLinked => {
        return !isItLinked
            ? MESSAGES.linkOffOrgUnitToInstanceReferenceTitle
            : MESSAGES.linkOrgUnitToInstanceReferenceTitle;
    };

    const confirmLinkOrUnlink = isItLinked => {
        return !isItLinked
            ? linkOrgUnitToReferenceSubmission(null)
            : linkOrgUnitToReferenceSubmission(settings.row.original.id);
    };

    const confirmCancelToolTipMessage = isItLinked => {
        return !isItLinked
            ? MESSAGES.linkOffOrgUnitReferenceSubmission
            : MESSAGES.linkOrgUnitReferenceSubmission;
    };

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
                <ConfirmCancelDialogComponent
                    titleMessage={confirmCancelTitleMessage(notLinked)}
                    onConfirm={() => confirmLinkOrUnlink(notLinked)}
                    renderTrigger={({ openDialog }) => (
                        <IconButtonComponent
                            onClick={openDialog}
                            overrideIcon={notLinked ? LinkIcon : LinkOffIcon}
                            tooltipMessage={confirmCancelToolTipMessage(
                                notLinked,
                            )}
                            color={notLinked ? 'inherit' : 'primary'}
                        />
                    )}
                >
                    <DialogContentText id="alert-dialog-description">
                        <FormattedMessage
                            id="iaso.instance.linkOrgUnitToInstanceReferenceWarning"
                            defaultMessage="This operation can still be undone"
                            {...MESSAGES.linkOrgUnitToInstanceReferenceWarning}
                        />
                    </DialogContentText>
                </ConfirmCancelDialogComponent>
            )}
        </section>
    );
};
export default ActionTableColumnComponent;
