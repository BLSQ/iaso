import React, { FunctionComponent } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { Paper } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';
import { getInstancesFilesList } from '../../utils';
import { numericValues } from '../../utils/intl';
import InstanceDetailsChangeRequests from '../InstanceDetailsChangeRequests';
import { InstanceDetailsExportRequestsContent } from '../InstanceDetailsExportRequests';
import InstanceDetailsLocation from '../InstanceDetailsLocation';
import { InstanceDetailsLocksHistoryContent } from '../InstanceDetailsLocksHistory';
import InstancesFilesList from '../InstancesFilesListComponent';
import {
    InstanceValidationContent,
    useValidationAvailability,
} from '../ValidationWorkflow/InstanceValidationWidgetPaper';
import { GeneralCard } from './GeneralCard';
import { RailRow } from './RailRow';

type Props = {
    currentInstance: Instance;
    showHistoryLink: boolean;
    onLightBoxToggled: (open: boolean) => void;
};

/**
 * Left rail of the submission detail page. Everything but the general card is
 * collapsed by default, each row showing enough of a summary that the user can
 * tell whether it is worth opening.
 */
export const SubmissionRail: FunctionComponent<Props> = ({
    currentInstance,
    showHistoryLink,
    onLightBoxToggled,
}) => {
    const { formatMessage } = useSafeIntl();
    const validationAvailability = useValidationAvailability();

    const fileCount = currentInstance.files?.length ?? 0;
    const changeRequestCount = currentInstance.change_requests?.length ?? 0;
    const exportStatusCount = currentInstance.export_statuses?.length ?? 0;
    const isLocked = currentInstance.is_locked;

    // the collapsed row only has room for a couple of words; the full
    // explanation lives in the body of the row
    const validationState = {
        moduleDisabled: formatMessage(MESSAGES.notActivated),
        missingPermissions: formatMessage(MESSAGES.restricted),
        available: undefined,
    }[validationAvailability];

    return (
        <>
            <GeneralCard
                currentInstance={currentInstance}
                showHistoryLink={showHistoryLink}
            />

            <Paper elevation={0} variant="outlined">
                <RailRow
                    icon={<PlaceOutlinedIcon fontSize="small" />}
                    tone="info"
                    label={formatMessage(MESSAGES.location)}
                    state={currentInstance.org_unit?.name}
                    defaultExpanded
                >
                    <InstanceDetailsLocation
                        currentInstance={currentInstance}
                    />
                </RailRow>

                {fileCount > 0 && (
                    <RailRow
                        icon={<ImageOutlinedIcon fontSize="small" />}
                        tone="info"
                        label={formatMessage(MESSAGES.files)}
                        state={formatMessage(
                            MESSAGES.filesCount,
                            numericValues({ count: fileCount }),
                        )}
                    >
                        <InstancesFilesList
                            fetchDetails={false}
                            instanceDetail={currentInstance}
                            files={getInstancesFilesList([currentInstance])}
                            onLightBoxToggled={onLightBoxToggled}
                        />
                    </RailRow>
                )}

                <RailRow
                    icon={<ShieldOutlinedIcon fontSize="small" />}
                    tone={
                        validationAvailability === 'available'
                            ? 'info'
                            : 'muted'
                    }
                    label={formatMessage(MESSAGES.validation)}
                    state={validationState}
                >
                    <InstanceValidationContent
                        currentInstanceId={currentInstance.id}
                    />
                </RailRow>

                {changeRequestCount > 0 && (
                    <RailRow
                        icon={<EditOutlinedIcon fontSize="small" />}
                        tone="warning"
                        label={formatMessage(MESSAGES.changeRequests)}
                        state={`${changeRequestCount}`}
                    >
                        <InstanceDetailsChangeRequests
                            currentInstance={currentInstance}
                            disabled={currentInstance.deleted}
                        />
                    </RailRow>
                )}

                <RailRow
                    icon={<FileDownloadOutlinedIcon fontSize="small" />}
                    label={formatMessage(MESSAGES.exportRequests)}
                    state={
                        exportStatusCount > 0
                            ? `${exportStatusCount}`
                            : formatMessage(MESSAGES.none)
                    }
                >
                    <InstanceDetailsExportRequestsContent
                        currentInstance={currentInstance}
                    />
                </RailRow>

                <RailRow
                    icon={
                        isLocked ? (
                            <LockOutlinedIcon fontSize="small" />
                        ) : (
                            <LockOpenOutlinedIcon fontSize="small" />
                        )
                    }
                    tone={isLocked ? 'warning' : 'success'}
                    label={formatMessage(MESSAGES.locks)}
                    state={formatMessage(
                        isLocked
                            ? MESSAGES.lockedState
                            : MESSAGES.unlockedState,
                    )}
                >
                    <InstanceDetailsLocksHistoryContent
                        currentInstance={currentInstance}
                    />
                </RailRow>
            </Paper>
        </>
    );
};
