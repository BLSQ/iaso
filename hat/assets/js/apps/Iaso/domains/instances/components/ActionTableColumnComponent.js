/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import LinkIcon from '@material-ui/icons/Link';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import LockIcon from '@material-ui/icons/Lock';
import omit from 'lodash/omit';
import { DialogContentText } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import { useSaveOrgUnit } from '../../orgUnits/hooks';
import { baseUrls } from '../../../constants/urls';
import { userHasPermission } from '../../users/utils';
import { useCurrentUser } from '../../../utils/usersUtils.ts';
import MESSAGES from '../messages';
import { useFormState } from '../../../hooks/form';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import {
    hasFeatureFlag,
    SHOW_LINK_INSTANCE_REFERENCE,
} from '../../../utils/featureFlags';
import * as Permission from '../../../utils/permissions';
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

const ActionTableColumnComponent = ({ settings }) => {
    const user = useCurrentUser();
    // eslint-disable-next-line no-unused-vars
    const [_formState, _setFieldValue, setFieldErrors] = useFormState(
        initialFormState(
            settings.row.original.org_unit,
            settings.row.original.id,
        ),
    );

    const { mutateAsync: saveOu } = useSaveOrgUnit(null, ['instances']);

    const onError = () => {
        if (onError.status === 400) {
            onError.details.forEach(entry => {
                setFieldErrors(entry.errorKey, [entry.errorMessage]);
            });
        }
    };

    const getUrlOrgUnit = data => {
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

    const getUrlInstance = data => {
        const rowOriginal = data.row.original;
        // each instance should have a formId
        let initialUrl = `${baseUrls.instanceDetail}/instanceId/${settings.row.original.id}`;
        // there are some instances which don't have a reference form Id
        if (rowOriginal.reference_form_id) {
            initialUrl = `${initialUrl}/referenceFormId/${rowOriginal.reference_form_id}`;
        }
        return `${initialUrl}`;
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

        saveOu(orgUnitPayload).catch(onError);
    };

    const showButton =
        settings.row.original.reference_form_id ===
            settings.row.original.form_id &&
        hasFeatureFlag(user, SHOW_LINK_INSTANCE_REFERENCE) &&
        userHasPermission(Permission.ORG_UNITS, user);

    const notLinked =
        !settings.row.original?.org_unit?.reference_instance_id &&
        userHasPermission(Permission.ORG_UNITS, user);

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
                url={getUrlInstance(settings)}
                icon="remove-red-eye"
                tooltipMessage={MESSAGES.view}
            />
            {settings.row.original.org_unit &&
                userHasPermission(Permission.ORG_UNITS, user) && (
                    <IconButtonComponent
                        url={getUrlOrgUnit(settings)}
                        icon="orgUnit"
                        tooltipMessage={MESSAGES.viewOrgUnit}
                    />
                )}
            {showButton && (
                <ConfirmCancelDialogComponent
                    titleMessage={confirmCancelTitleMessage(notLinked)}
                    onConfirm={closeDialog => {
                        confirmLinkOrUnlink(notLinked);
                        closeDialog();
                    }}
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

            {settings.row.original.is_locked && (
                <>
                    {settings.row.original.can_user_modify ? (
                        <IconButtonComponent
                            url={getUrlInstance(settings)}
                            overrideIcon={() => <LockIcon color="primary" />}
                            tooltipMessage={MESSAGES.lockedCanModify}
                        />
                    ) : (
                        <IconButtonComponent
                            url={getUrlInstance(settings)}
                            overrideIcon={LockIcon}
                            tooltipMessage={MESSAGES.lockedCannotModify}
                        />
                    )}
                </>
            )}
        </section>
    );
};
export default ActionTableColumnComponent;
