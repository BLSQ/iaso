import React, { FunctionComponent } from 'react';

import BlockIcon from '@mui/icons-material/Block';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { IconButton as IconButtonComponent } from 'bluesquare-components';

import DeleteDialog from '../../../../components/dialogs/DeleteDialogComponent';
import { baseUrls } from '../../../../constants/urls';

import { useCopyWorkflowVersion } from '../../hooks/requests/useCopyWorkflowVersion';
import { useDeleteWorkflowVersion } from '../../hooks/requests/useDeleteWorkflowVersion';
import { useUpdateWorkflowVersion } from '../../hooks/requests/useUpdateWorkflowVersion';
import MESSAGES from '../../messages';
import { WorkflowVersion } from '../../types';
import { PublishVersionIconModal } from './PublishVersionModal';

type Props = {
    workflowVersion: WorkflowVersion;
    entityTypeId: number;
};

const useStyles = makeStyles(theme => ({
    publishIcon: {
        display: 'inline-block',
        '& svg': {
            color: theme.palette.success.main,
        },
    },
}));

export const VersionsActionCell: FunctionComponent<Props> = ({
    workflowVersion,
    entityTypeId,
}) => {
    const classes = useStyles();
    const { version_id: versionId, status } = workflowVersion;
    const { mutate: copyWorkflowVersion } = useCopyWorkflowVersion();
    const { mutate: deleteWorkflowVersion } = useDeleteWorkflowVersion();
    const { mutate: updateWorkflowVersion } = useUpdateWorkflowVersion(
        'workflowVersions',
        versionId,
        false,
    );
    const icon = status === 'DRAFT' ? 'edit' : 'remove-red-eye';
    const tooltipMessage = status === 'DRAFT' ? MESSAGES.edit : MESSAGES.see;
    return (
        <>
            <IconButtonComponent
                url={`/${baseUrls.workflowDetail}/entityTypeId/${entityTypeId}/versionId/${versionId}`}
                icon={icon}
                tooltipMessage={tooltipMessage}
            />
            {status !== 'DRAFT' && (
                <IconButtonComponent
                    onClick={() => copyWorkflowVersion(versionId)}
                    overrideIcon={FileCopyIcon}
                    tooltipMessage={MESSAGES.copy}
                    dataTestId={`copy-button-${workflowVersion.version_id}`}
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
            {status !== 'PUBLISHED' && (
                <Box className={classes.publishIcon}>
                    <PublishVersionIconModal
                        workflowVersion={workflowVersion}
                        invalidateQueryKey="workflowVersions"
                        iconProps={{
                            dataTestId: `publish-button-${workflowVersion.version_id}`,
                        }}
                    />
                </Box>
            )}
            {status === 'PUBLISHED' && (
                <IconButtonComponent
                    onClick={() =>
                        updateWorkflowVersion({ status: 'UNPUBLISHED' })
                    }
                    overrideIcon={BlockIcon}
                    tooltipMessage={MESSAGES.unpublish}
                    color="error"
                />
            )}
        </>
    );
};
