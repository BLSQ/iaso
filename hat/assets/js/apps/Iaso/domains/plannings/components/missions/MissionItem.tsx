import React, { FC, useCallback } from 'react';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import LinkOffOutlinedIcon from '@mui/icons-material/LinkOffOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
    Card,
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionPolymorphicList } from 'Iaso/api/missions';
import { MissionInfoCaption } from 'Iaso/domains/missions/components/chips/MissionInfoCaption';
import { MissionTypeChip } from 'Iaso/domains/missions/components/chips/MissionTypeChip';
import { SxStyles } from 'Iaso/types/general';
import { usePlanningContext } from '../../contexts/PlanningContext';
import MESSAGES from '../../messages';
import { planningPanelStyles } from '../shared/styles';

export type MissionLinkStatus = 'linked' | 'added' | 'unlinked';

type Props = {
    mission: MissionPolymorphicList;
    status: MissionLinkStatus;
};

const styles = {
    card: {
        p: 2,
        flexShrink: 0,
        backgroundColor: '#FAFBFC', // TODO is it wise to use custom colors here?
        borderColor: '#EDF1F4', // TODO is it wise to use custom colors here ?
    },
    unlinkedCard: {
        opacity: 0.6,
    },
    details: {
        mt: 1,
    },
} satisfies SxStyles;

export const MissionItem: FC<Props> = ({ mission, status }) => {
    const { formatMessage } = useSafeIntl();
    const { unlinkMission, relinkMission } = usePlanningContext();
    const isUnlinked = status === 'unlinked';
    const handleUnlink = useCallback(
        () => unlinkMission(mission.id),
        [unlinkMission, mission.id],
    );
    const handleRelink = useCallback(
        () => relinkMission(mission.id),
        [relinkMission, mission.id],
    );
    return (
        <Card
            variant="outlined"
            sx={[styles.card, isUnlinked && styles.unlinkedCard]}
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
            >
                <Stack direction="row" gap={1} alignItems="center">
                    <Typography variant="body2" fontWeight="bold">
                        {mission.name}
                    </Typography>
                    {status === 'added' && (
                        <Chip
                            label={formatMessage(MESSAGES.notSavedYet)}
                            color="warning"
                            size="small"
                            variant="outlined"
                        />
                    )}
                    {isUnlinked && (
                        <Chip
                            label={formatMessage(MESSAGES.willBeUnlinked)}
                            color="error"
                            size="small"
                            variant="outlined"
                        />
                    )}
                </Stack>
                <Stack direction="row" gap={1}>
                    <IconButton size="small">
                        <VisibilityOutlinedIcon
                            sx={planningPanelStyles.smallIcon}
                        />
                    </IconButton>
                    <IconButton size="small">
                        <CreateOutlinedIcon
                            color="primary"
                            sx={planningPanelStyles.smallIcon}
                        />
                    </IconButton>
                    {isUnlinked ? (
                        <Tooltip title={formatMessage(MESSAGES.relinkMission)}>
                            <IconButton size="small" onClick={handleRelink}>
                                <LinkOutlinedIcon
                                    color="primary"
                                    sx={planningPanelStyles.smallIcon}
                                />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title={formatMessage(MESSAGES.unlinkMission)}>
                            <IconButton size="small" onClick={handleUnlink}>
                                <LinkOffOutlinedIcon
                                    sx={planningPanelStyles.smallIcon}
                                />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </Stack>
            <Stack direction="row" gap={1} sx={styles.details}>
                <MissionTypeChip missionType={mission.mission_type} />
                <MissionInfoCaption mission={mission} />
            </Stack>
        </Card>
    );
};
