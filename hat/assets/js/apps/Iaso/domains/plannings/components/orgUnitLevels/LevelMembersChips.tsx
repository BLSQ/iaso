import React, { FC } from 'react';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { Chip, Stack } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { LevelMembers } from './types';

type Props = {
    members: LevelMembers;
};

const styles = {
    chipStyles: { pl: 0.5 },
} satisfies SxStyles;

export const LevelMembersChips: FC<Props> = ({
    members: { teamsCount, usersCount },
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Stack direction="row" gap={1} flexWrap="wrap">
            {teamsCount > 0 && (
                <Chip
                    size="small"
                    icon={<GroupsOutlinedIcon />}
                    sx={styles.chipStyles}
                    label={formatMessage(
                        MESSAGES.teamsCount,
                        numericValues({ count: teamsCount }),
                    )}
                />
            )}
            {usersCount > 0 && (
                <Chip
                    size="small"
                    icon={<PersonOutlineIcon />}
                    sx={styles.chipStyles}
                    label={formatMessage(
                        MESSAGES.usersCount,
                        numericValues({ count: usersCount }),
                    )}
                />
            )}
        </Stack>
    );
};
