import React, { FunctionComponent, useCallback } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import { PlaylistAdd } from '@material-ui/icons';
import { Tooltip } from '@material-ui/core';
import { useDeleteRestoreBudgetStep } from '../hooks/api/useGetBudgetDetails';
import MESSAGES from '../../../constants/messages';

type Props = {
    stepId: number;
    isStepDeleted: boolean;
    className: string;
};

export const DeleteRestoreButton: FunctionComponent<Props> = ({
    isStepDeleted,
    stepId,
    className,
}) => {
    const { mutateAsync: toggleStatus } =
        useDeleteRestoreBudgetStep(isStepDeleted);
    const { formatMessage } = useSafeIntl();
    const toggleStepStatus = useCallback(() => {
        return toggleStatus(stepId);
    }, [stepId, toggleStatus]);

    return (
        <>
            {!isStepDeleted && (
                <Tooltip title={formatMessage(MESSAGES.clickToHide)}>
                    <RemoveCircleIcon
                        color="action"
                        onClick={toggleStepStatus}
                    />
                </Tooltip>
            )}
            {isStepDeleted && (
                <Tooltip title={formatMessage(MESSAGES.clickToShow)}>
                    <PlaylistAdd
                        className={className}
                        onClick={toggleStepStatus}
                    />
                </Tooltip>
            )}
        </>
    );
};
