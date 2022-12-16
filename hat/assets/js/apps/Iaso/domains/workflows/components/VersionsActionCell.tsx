import React, { FunctionComponent } from 'react';

import {
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import FileCopyIcon from '@material-ui/icons/FileCopy';

import { WorkflowVersion } from '../types/workflows';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';

import { useCopyWorkflowVersion } from '../hooks/requests/useCopyWorkflowVersion';
import { useDeleteWorkflowVersion } from '../hooks/requests/useDeleteWorkflowVersion';

type Props = {
    workflowVersion: WorkflowVersion;
    entityTypeId: number;
};

export const VersionsActionCell: FunctionComponent<Props> = ({
    workflowVersion,
    entityTypeId,
}) => {
    const { mutate: copyWorkflowVersion } = useCopyWorkflowVersion();
    const { mutate: deleteWorkflowVersion } = useDeleteWorkflowVersion();
    const { version_id: versionId, status } = workflowVersion;
    const icon = status === 'DRAFT' ? 'edit' : 'remove-red-eye';
    const tooltipMessage = status === 'DRAFT' ? MESSAGES.edit : MESSAGES.see;
    return (
        <>
            <IconButtonComponent
                url={`${baseUrls.workflowDetail}/entityTypeId/${entityTypeId}/versionId/${versionId}`}
                icon={icon}
                tooltipMessage={tooltipMessage}
            />
            {status !== 'DRAFT' && (
                <IconButtonComponent
                    onClick={() => copyWorkflowVersion(versionId)}
                    overrideIcon={FileCopyIcon}
                    tooltipMessage={MESSAGES.copy}
                />
            )}
            {status === 'DRAFT' && (
                <DeleteDialog
                    keyName={`workflow-version-${versionId}`}
                    titleMessage={MESSAGES.deleteTitle}
                    message={MESSAGES.deleteText}
                    onConfirm={() => deleteWorkflowVersion(versionId)}
                />
            )}
        </>
    );
};
