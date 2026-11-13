import React, { FC, MouseEvent, useCallback } from 'react';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { IconButton, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../messages';
import { MemberRowLayout } from './MemberRowLayout';
import { TeamMemberRowData } from './types';

type Props = {
    row: TeamMemberRowData;
    assignedCount: number;
    isCurrentAssignee: boolean;
    isPickable: boolean;
    onPick: (teamId: number, memberKey: string) => void;
    onRemove?: (memberKey: string) => void;
};

export const AssignMemberRow: FC<Props> = ({
    row,
    assignedCount,
    isCurrentAssignee,
    isPickable,
    onPick,
    onRemove,
}) => {
    const { formatMessage } = useSafeIntl();
    const { key, parentTeam } = row;
    const handlePick = useCallback(
        () => onPick(parentTeam.id, key),
        [onPick, parentTeam.id, key],
    );
    const handleRemove = useCallback(
        (event: MouseEvent) => {
            event.stopPropagation();
            onRemove?.(key);
        },
        [onRemove, key],
    );

    return (
        <MemberRowLayout
            row={row}
            assignedCount={assignedCount}
            onClick={isPickable ? handlePick : undefined}
            isHighlighted={isCurrentAssignee}
            isDisabled={!isPickable}
            caption={
                isPickable
                    ? undefined
                    : formatMessage(MESSAGES.assignParentTeamFirst, {
                          team: parentTeam.name,
                      })
            }
            actions={
                onRemove && (
                    <Tooltip
                        title={formatMessage(MESSAGES.removeMemberAssignments)}
                    >
                        <span>
                            <IconButton
                                size="small"
                                disabled={assignedCount === 0}
                                onClick={handleRemove}
                            >
                                <LinkOffIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                )
            }
        />
    );
};
