import React, { useCallback, ReactNode } from 'react';
// @ts-ignore
import { AddButton, IconButton } from 'bluesquare-components';
import { makeStyles } from '@material-ui/core';
import MESSAGES from '../../../constants/messages';
import { IntlMessage } from '../../../../../../../hat/assets/js/apps/Iaso/types/intl';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { BudgetEventType } from '../../../constants/types';

const style = theme => {
    return {
        addButton: {
            [theme.breakpoints.down('md')]: {
                marginLeft: theme.spacing(1),
            },
        },
    };
};

const useButtonStyles = makeStyles(style);

export const useRenderTrigger = (
    type: 'create' | 'edit' | 'retry' = 'create',
    isMobileLayout: boolean,
    color = 'action',
): ReactNode => {
    const classes = useButtonStyles();
    return useCallback(
        ({ openDialog }) => {
            if (type === 'edit') {
                return (
                    <IconButton
                        color={color}
                        onClick={openDialog}
                        icon="edit"
                        tooltipMessage={MESSAGES.resendFiles}
                    />
                );
            }
            return (
                // The div prevents the Button from being too big on small screens
                <div className={classes.addButton}>
                    <AddButton
                        onClick={openDialog}
                        dataTestId="create-budgetStep-button"
                        message={
                            isMobileLayout ? MESSAGES.add : MESSAGES.addStep
                        }
                    />
                </div>
            );
        },
        [classes.addButton, color, type, isMobileLayout],
    );
};

export const getTitleMessage = (
    type: 'create' | 'edit' | 'retry',
): IntlMessage => {
    if (type === 'create') return MESSAGES.newBudgetStep;
    if (type === 'edit') return MESSAGES.resendFiles;
    if (type === 'retry') return MESSAGES.tryUpdateStep;
    throw new Error(
        `expected type to be one of: create, edit,retry, got ${type}`,
    );
};

export const makeEventsDropdown = (
    user,
    approvalTeams,
    formatMessage,
): DropdownOptions<BudgetEventType>[] => {
    const isUserApprover = Boolean(
        approvalTeams
            ?.map(validationTeam => validationTeam.users)
            .flat()
            .find(userId => userId === user.user_id),
    );
    const baseOptions: DropdownOptions<BudgetEventType>[] = [
        {
            label: formatMessage(MESSAGES.submission) as string,
            value: 'submission',
        },
        {
            label: formatMessage(MESSAGES.comments) as string,
            value: 'comments',
        },
    ];
    if (isUserApprover) {
        return [
            ...baseOptions,
            {
                value: 'validation',
                label: formatMessage(MESSAGES.validation),
            },
        ];
    }
    return baseOptions;
};
