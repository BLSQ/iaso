import React, { FC } from 'react';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { LevelOrgUnitCounts, LevelOrgUnitType } from './types';

const styles = {
    header: {
        display: 'block',
        mb: 0.5,
        fontWeight: 'medium',
    },
    step: {
        display: 'grid',
        gridTemplateColumns: '14px minmax(0, 1fr) auto',
        gap: 0.75,
        alignItems: 'center',
        py: 0.25,
    },
    total: {
        mt: 0.25,
        pt: 0.5,
        borderTop: 1,
        borderColor: 'grey.600',
        fontWeight: 'medium',
    },
    // Tooltips have a dark background, error.main lacks contrast on it.
    empty: {
        color: 'error.light',
    },
    icon: {
        fontSize: 14,
        opacity: 0.7,
    },
    value: {
        textAlign: 'right',
    },
} satisfies SxStyles;

type Step = {
    Icon: typeof DoneAllIcon;
    label: string;
    value: string;
    isEmpty?: boolean;
    isTotal?: boolean;
};

type Props = {
    levelNumber: number;
    selectedTypes: LevelOrgUnitType[];
    counts: LevelOrgUnitCounts;
    hasGroups: boolean;
    rootOrgUnitName: string;
};

export const LevelCountBreakdown: FC<Props> = ({
    levelNumber,
    selectedTypes,
    counts,
    hasGroups,
    rootOrgUnitName,
}) => {
    const { formatMessage } = useSafeIntl();
    const steps: Step[] = selectedTypes.map(type => {
        const count = counts.countByTypeId.get(type.id) ?? 0;
        return {
            Icon: CategoryOutlinedIcon,
            label: formatMessage(MESSAGES.typeUnderOrgUnit, {
                type: type.name,
                orgUnit: rootOrgUnitName,
            }),
            value: `${count}`,
            isEmpty: count === 0,
        };
    });
    if (hasGroups) {
        steps.push({
            Icon: FilterAltOutlinedIcon,
            label: formatMessage(MESSAGES.notInSelectedGroups),
            value: `−${counts.typesTotal - counts.total}`,
        });
    }
    steps.push({
        Icon: DoneAllIcon,
        label: formatMessage(
            MESSAGES.assignableAtLevel,
            numericValues({ number: levelNumber }),
        ),
        value: `${counts.total}`,
        isEmpty: counts.total === 0,
        isTotal: true,
    });

    return (
        <Box>
            <Typography variant="caption" sx={styles.header}>
                {formatMessage(
                    MESSAGES.howCountIsComputed,
                    numericValues({ count: counts.total }),
                )}
            </Typography>
            {React.Children.toArray(
                steps.map(({ Icon, label, value, isEmpty, isTotal }) => (
                    <Typography
                        variant="caption"
                        component="div"
                        sx={[
                            styles.step,
                            Boolean(isTotal) && styles.total,
                            Boolean(isEmpty) && styles.empty,
                        ]}
                    >
                        <Icon sx={styles.icon} />
                        <span>{label}</span>
                        <Box component="span" sx={styles.value}>
                            {value}
                        </Box>
                    </Typography>
                )),
            )}
        </Box>
    );
};
