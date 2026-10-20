import React, { FC } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { Button, Stack } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../../contexts/PlanningContext';
import MESSAGES from '../../messages';
import { PlanningStatusChip } from '../shared/PlanningStatusChip';
import { planningPanelStyles } from '../shared/styles';
import { SaveWarningDialog } from './SaveWarningDialog';

const styles = {
    buttonIcon: {
        ...planningPanelStyles.smallIcon,
        mr: 1,
    },
} satisfies SxStyles;

export const PlanningHeaderTitle: FC = () => {
    const { planning } = usePlanningContext();
    return (
        <>
            {planning?.name}
            <PlanningStatusChip status={planning?.status ?? 'draft'} />
        </>
    );
};

export const PlanningHeaderActions: FC = () => {
    const { mode, canSave, savePlanning, duplicatePlanning } =
        usePlanningContext();
    const { formatMessage } = useSafeIntl();
    return (
        <Stack direction="row" gap={1}>
            <Button variant="outlined" size="small">
                <OpenInNewIcon sx={styles.buttonIcon} />
                {formatMessage(MESSAGES.openAssignments)}
            </Button>
            {mode === 'edit' && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={duplicatePlanning}
                >
                    <ContentCopyIcon sx={styles.buttonIcon} />
                    {formatMessage(MESSAGES.duplicatePlanning)}
                </Button>
            )}
            <Button
                variant="contained"
                size="small"
                onClick={savePlanning}
                disabled={!canSave}
            >
                <SaveOutlinedIcon sx={styles.buttonIcon} />
                {formatMessage(MESSAGES.save)}
            </Button>
            <SaveWarningDialog />
        </Stack>
    );
};
