import React, { FC } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { Button, Stack, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../contexts/PlanningContext';
import MESSAGES from '../messages';
import { PlanningStatusChip } from './PlanningStatusChip';
import { planningPanelStyles } from './styles';

const styles = {
    header: {
        position: 'sticky',
        top: 0,
        zIndex: 2,
        pb: 2,
        backgroundColor: 'white',
    },
    statusChip: {
        ml: 2,
    },
    buttonIcon: {
        ...planningPanelStyles.smallIcon,
        mr: 1,
    },
} satisfies SxStyles;

export const PlanningHeader: FC = () => {
    const { planning, mode, canSave, savePlanning, duplicatePlanning } =
        usePlanningContext();
    const { formatMessage } = useSafeIntl();
    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={styles.header}
        >
            <Typography variant="h6">
                {planning.name}
                <PlanningStatusChip
                    status={planning.status ?? 'draft'}
                    sx={styles.statusChip}
                />
            </Typography>
            <Stack direction="row" gap={1}>
                <Button variant="outlined" size="small">
                    <OpenInNewIcon sx={styles.buttonIcon} />
                    Open assignments
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
            </Stack>
        </Stack>
    );
};
