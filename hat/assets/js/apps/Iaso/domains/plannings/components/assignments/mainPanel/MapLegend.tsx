import React, { FC, useCallback, useState } from 'react';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import {
    Box,
    ButtonBase,
    Paper,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../../contexts/AssignmentsContext';
import MESSAGES from '../../../messages';
import { getTeamMembers } from '../utils';
import { FILL_OPACITY, getUnassignedColor } from './AssignableOrgUnitsLayer';

// Placed above the map's scale control.
const styles = {
    legend: {
        position: 'absolute',
        bottom: 36,
        left: 10,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        minWidth: 180,
        maxWidth: 260,
        py: 0.5,
        pl: 1.5,
        pr: 0.5,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        py: 0.5,
        typography: 'caption',
        fontWeight: 500,
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        pr: 1,
        pb: 1,
    },
    members: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        maxHeight: 160,
        overflowY: 'auto',
    },
    item: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
    },
    swatch: {
        width: 14,
        height: 14,
        borderRadius: '3px',
        border: '1px solid rgba(0,0,0,0.15)',
        flexShrink: 0,
    },
    areaSwatch: {
        width: 14,
        height: 14,
        borderRadius: '3px',
        border: 2,
        borderColor: 'primary.main',
        flexShrink: 0,
    },
    label: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    offMap: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        pt: 0.75,
        borderTop: 1,
        borderColor: 'divider',
        color: 'text.secondary',
    },
    offMapIcon: {
        fontSize: 15,
        color: 'mediumGray.main',
    },
} satisfies SxStyles;

type ItemProps = {
    color: string;
    label: string;
};

const LegendItem: FC<ItemProps> = ({ color, label }) => (
    <Box sx={styles.item}>
        <Box sx={{ ...styles.swatch, bgcolor: alpha(color, FILL_OPACITY) }} />
        <Typography variant="caption" sx={styles.label}>
            {label}
        </Typography>
    </Box>
);

type Props = {
    offMapCount: number;
};

export const MapLegend: FC<Props> = ({ offMapCount }) => {
    const { formatMessage } = useSafeIntl();
    const { selectedTeam } = useAssignmentsContext();
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(true);
    const toggle = useCallback(() => setIsOpen(previous => !previous), []);
    return (
        <Paper sx={styles.legend}>
            <ButtonBase
                sx={styles.header}
                onClick={toggle}
                aria-expanded={isOpen}
            >
                {formatMessage(MESSAGES.legend)}
                {isOpen ? (
                    <ExpandMoreIcon fontSize="small" color="action" />
                ) : (
                    <ExpandLessIcon fontSize="small" color="action" />
                )}
            </ButtonBase>
            {isOpen && (
                <Box sx={styles.content}>
                    <Typography variant="caption" color="text.secondary">
                        {formatMessage(MESSAGES.assignedTo)}
                    </Typography>
                    <Box sx={styles.members}>
                        {getTeamMembers(selectedTeam).map(member => (
                            <LegendItem
                                key={member.key}
                                color={member.color}
                                label={member.name}
                            />
                        ))}
                    </Box>
                    <LegendItem
                        color={getUnassignedColor(theme)}
                        label={formatMessage(MESSAGES.unassigned)}
                    />
                    <Box sx={styles.item}>
                        <Box sx={styles.areaSwatch} />
                        <Typography variant="caption" sx={styles.label}>
                            {formatMessage(MESSAGES.areaOf, {
                                name: selectedTeam.name,
                            })}
                        </Typography>
                    </Box>
                    {offMapCount > 0 && (
                        <Box sx={styles.offMap}>
                            <LocationOffIcon sx={styles.offMapIcon} />
                            <Typography variant="caption">
                                {formatMessage(
                                    MESSAGES.orgUnitsOffMap,
                                    numericValues({ count: offMapCount }),
                                )}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}
        </Paper>
    );
};
