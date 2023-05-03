/* eslint-disable camelcase */
import React from 'react';

import { useSafeIntl } from 'bluesquare-components';
import { DialogContentText } from '@material-ui/core';

import LinkIcon from '@material-ui/icons/Link';
import LinkOffIcon from '@material-ui/icons/LinkOff';

import MESSAGES from '../messages';
import EnketoIcon from '../../instances/components/EnketoIcon';
import { userHasPermission } from '../../users/utils';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { useCurrentUser } from '../../../utils/usersUtils';
import {
    hasFeatureFlag,
    SHOW_LINK_INSTANCE_REFERENCE,
} from '../../../utils/featureFlags';
import { OrgUnit, OrgUnitState, ActionsType } from '../types/orgUnit';
import { Instance } from '../../instances/types/instance';

type SaveOuType = {
    id: number;
    reference_instance_id?: number;
};

type Params = {
    orgUnitState: OrgUnitState;
    formId: string;
    referenceFormId?: string;
    instanceId?: string;
    // eslint-disable-next-line no-unused-vars
    saveOu: (ou: SaveOuType) => Promise<OrgUnit>;
    // eslint-disable-next-line no-unused-vars
    setFieldErrors: (errors: string) => void;
    referenceInstance: Instance;
};

const linkOrLinkOffOrgUnitToReferenceSubmission = (
    orgUnitState: OrgUnitState,
    // eslint-disable-next-line no-unused-vars
    saveOu: (ou: SaveOuType) => Promise<OrgUnit>,
    // eslint-disable-next-line no-unused-vars
    setFieldErrors: (errors: string) => void,
    referenceSubmissionId?: number,
) => {
    saveOu({
        id: orgUnitState.id.value,
        reference_instance_id: referenceSubmissionId,
    }).then(() => {
        window.location.reload();
    });
};

export const Actions = ({
    orgUnitState,
    formId,
    referenceFormId,
    instanceId,
    saveOu,
    setFieldErrors,
    referenceInstance,
}: Params): ActionsType => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const referenceSubmission = referenceInstance;
    const linkOrgUnit =
        formId !== referenceFormId || referenceSubmission !== null;
    const hasSubmissionPermission = userHasPermission(
        'iaso_submissions',
        currentUser,
    );

    const hasfeatureFlag = hasFeatureFlag(
        currentUser,
        SHOW_LINK_INSTANCE_REFERENCE,
    );

    const actions = [
        {
            id: 'instanceEditAction',
            icon: <EnketoIcon />,
            disabled: !referenceSubmission,
        },
    ];

    const orgUnitToReferenceSubmission = instance => {
        return linkOrLinkOffOrgUnitToReferenceSubmission(
            orgUnitState,
            saveOu,
            setFieldErrors,
            instance,
        );
    };

    const confirmCancelTitleMessage = isItLinked => {
        return isItLinked
            ? MESSAGES.linkOffOrgUnitToInstanceReferenceTitle
            : MESSAGES.linkOrgUnitToInstanceReferenceTitle;
    };

    const renderTrigger = (isLinked, openDialog) => {
        return isLinked ? (
            <LinkOffIcon onClick={openDialog} />
        ) : (
            <LinkIcon onClick={openDialog} />
        );
    };
    if (!hasSubmissionPermission || !hasfeatureFlag) return actions;
    return [
        ...actions,
        {
            id: linkOrgUnit
                ? 'linkOffOrgUnitReferenceSubmission'
                : 'linkOrgUnitReferenceSubmission',
            icon: (
                // @ts-ignore
                <ConfirmCancelDialogComponent
                    titleMessage={confirmCancelTitleMessage(linkOrgUnit)}
                    onConfirm={() =>
                        linkOrgUnit
                            ? orgUnitToReferenceSubmission(null)
                            : orgUnitToReferenceSubmission(instanceId)
                    }
                    renderTrigger={({ openDialog }) =>
                        renderTrigger(linkOrgUnit, openDialog)
                    }
                >
                    <DialogContentText id="alert-dialog-description">
                        {formatMessage(
                            MESSAGES.linkOrgUnitToInstanceReferenceWarning,
                        )}
                    </DialogContentText>
                </ConfirmCancelDialogComponent>
            ),
        },
    ];
};
