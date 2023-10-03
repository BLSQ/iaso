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
import { REFERENCE_FLAG_CODE, REFERENCE_UNFLAG_CODE } from '../constants';
import { useFormState } from '../../../hooks/form';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import {
    hasFeatureFlag,
    SHOW_LINK_INSTANCE_REFERENCE,
} from '../../../utils/featureFlags';
import * as Permission from '../../../utils/permissions.ts';
// eslint-disable-next-line camelcase
const initialFormState = (
    orgUnit,
    referenceSubmissionId,
    referenceSubmissionAction = null,
) => {
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
        reference_instance_action: referenceSubmissionAction,
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
        if (rowOriginal.is_reference_instance) {
            initialUrl = `${initialUrl}/referenceFormId/${rowOriginal.form_id}`;
        }
        // each instance has an id
        return `${initialUrl}/instanceId/${rowOriginal.id}`;
    };

    const getUrlInstance = data => {
        const rowOriginal = data.row.original;
        // each instance should have a formId
        let initialUrl = `${baseUrls.instanceDetail}/instanceId/${settings.row.original.id}`;
        // there are some instances which don't have a reference form Id
        if (rowOriginal.is_reference_instance) {
            initialUrl = `${initialUrl}/referenceFormId/${rowOriginal.form_id}`;
        }
        return `${initialUrl}`;
    };

    const linkOrgUnitToReferenceSubmission = (
        referenceSubmissionId,
        referenceSubmissionAction,
    ) => {
        const currentOrgUnit = settings.row.original.org_unit;
        const newOrgUnit = initialFormState(
            settings.row.original.org_unit,
            referenceSubmissionId,
            referenceSubmissionAction,
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

    const showLinkOrgUnitInstanceReferenceButton =
        settings.row.original.is_instance_of_reference_form &&
        hasFeatureFlag(user, SHOW_LINK_INSTANCE_REFERENCE) &&
        userHasPermission(Permission.ORG_UNITS, user) &&
        userHasPermission(Permission.SUBMISSIONS_UPDATE, user);

    const notLinked =
        !settings.row.original.is_reference_instance &&
        userHasPermission(Permission.ORG_UNITS, user);

    const showOrgUnitButton =
        settings.row.original.org_unit &&
        userHasPermission('iaso_org_units', user) &&
        userHasPermission(Permission.SUBMISSIONS_UPDATE, user);

    const confirmCancelTitleMessage = isItLinked => {
        return !isItLinked
            ? MESSAGES.linkOffOrgUnitToInstanceReferenceTitle
            : MESSAGES.linkOrgUnitToInstanceReferenceTitle;
    };

    const confirmLinkOrUnlink = isItLinked => {
        return !isItLinked
            ? linkOrgUnitToReferenceSubmission(
                  settings.row.original.id,
                  REFERENCE_UNFLAG_CODE,
              )
            : linkOrgUnitToReferenceSubmission(
                  settings.row.original.id,
                  REFERENCE_FLAG_CODE,
              );
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
            {showOrgUnitButton && (
                <IconButtonComponent
                    url={getUrlOrgUnit(settings)}
                    icon="orgUnit"
                    tooltipMessage={MESSAGES.viewOrgUnit}
                />
            )}
            {showLinkOrgUnitInstanceReferenceButton && (
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

            {settings.row.original.is_locked &&
                userHasPermission(Permission.SUBMISSIONS_UPDATE, user) && (
                    <>
                        {settings.row.original.can_user_modify ? (
                            <IconButtonComponent
                                url={getUrlInstance(settings)}
                                overrideIcon={() => (
                                    <LockIcon color="primary" />
                                )}
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
