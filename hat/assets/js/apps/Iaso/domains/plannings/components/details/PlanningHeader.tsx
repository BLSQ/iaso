import React, { FC } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { Button, Stack } from '@mui/material';
import { LinkWithLocation, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../../contexts/PlanningContext';
import MESSAGES from '../../messages';
import { getAssignmentsUrl } from '../../utils';
import { DeprecatedPlanningChip } from '../shared/DeprecatedPlanningChip';
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
    const { planning, isReadOnly, formik } = usePlanningContext();
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {formik.values.name?.trim() || formatMessage(MESSAGES.newPlanning)}
            <PlanningStatusChip status={planning?.status ?? 'draft'} />
            {isReadOnly && <DeprecatedPlanningChip />}
        </>
    );
};

export const PlanningHeaderActions: FC = () => {
    const {
        planning,
        mode,
        isReadOnly,
        canSave,
        savePlanning,
        duplicatePlanning,
    } = usePlanningContext();
    const { formatMessage } = useSafeIntl();
    if (isReadOnly) {
        return null;
    }
    return (
        <Stack direction="row" gap={1}>
            <Button
                variant="outlined"
                size="small"
                component={LinkWithLocation}
                to={planning ? getAssignmentsUrl(planning.id) : ''}
                disabled={!planning}
            >
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
