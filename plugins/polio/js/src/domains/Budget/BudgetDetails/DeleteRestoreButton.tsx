import React, { FunctionComponent, useCallback } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { PlaylistAdd } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import classNames from 'classnames';
import { useDeleteRestoreBudgetStep } from '../hooks/api/useGetBudgetDetails';
import MESSAGES from '../../../constants/messages';

type Props = {
    stepId: number;
    isStepDeleted: boolean;
    className: string;
};
const style = () => {
    return {
        icon: {
            cursor: 'pointer',
        },
    };
};
export const useButtonStyles = makeStyles(style);
export const DeleteRestoreButton: FunctionComponent<Props> = ({
    isStepDeleted,
    stepId,
    className,
}) => {
    const classes = useButtonStyles();
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
                        className={classes.icon}
                        color="action"
                        onClick={toggleStepStatus}
                    />
                </Tooltip>
            )}
            {isStepDeleted && (
                <Tooltip title={formatMessage(MESSAGES.clickToShow)}>
                    <PlaylistAdd
                        className={classNames(className, classes.icon)}
                        onClick={toggleStepStatus}
                    />
                </Tooltip>
            )}
        </>
    );
};
