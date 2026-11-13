import React, { FC, useCallback } from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../../messages';
import { MemberRowLayout } from './MemberRowLayout';
import { TeamMemberRowData } from './types';

const styles = {
    openIcon: {
        color: 'primary.main',
    },
} satisfies SxStyles;

type Props = {
    row: TeamMemberRowData;
    assignedCount: number;
    onOpen: (teamId: number) => void;
};

// Sub-teams open on click; users have nothing to open.
export const ExploreMemberRow: FC<Props> = ({ row, assignedCount, onOpen }) => {
    const { formatMessage } = useSafeIntl();
    const { team, name } = row;
    const handleOpen = useCallback(() => {
        if (team) onOpen(team.id);
    }, [onOpen, team]);

    if (!team) {
        return <MemberRowLayout row={row} assignedCount={assignedCount} />;
    }
    return (
        <Tooltip
            title={formatMessage(MESSAGES.openTeam, { name })}
            placement="right"
        >
            <MemberRowLayout
                row={row}
                assignedCount={assignedCount}
                onClick={handleOpen}
                actions={<ChevronRightIcon sx={styles.openIcon} />}
            />
        </Tooltip>
    );
};
