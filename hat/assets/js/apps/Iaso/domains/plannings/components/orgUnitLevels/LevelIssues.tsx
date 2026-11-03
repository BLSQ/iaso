import React, { FC } from 'react';
import ErrorIcon from '@mui/icons-material/Error';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Stack, Typography } from '@mui/material';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { LevelIssue } from './types';

const styles = {
    icon: {
        fontSize: 16,
        mt: '1px',
    },
} satisfies SxStyles;

type IssueDisplay = {
    Icon: typeof ErrorIcon;
    color: string;
    message: IntlMessage;
    values?: Record<string, string>;
};

const getIssueDisplay = (
    issue: LevelIssue,
    rootOrgUnitName: string,
): IssueDisplay => {
    switch (issue.type) {
        case 'noOrgUnitOfType':
            return {
                Icon: ErrorIcon,
                color: 'error.main',
                message: MESSAGES.noOrgUnitOfType,
                values: { type: issue.typeName, orgUnit: rootOrgUnitName },
            };
        case 'noOrgUnitInGroups':
            return {
                Icon: ErrorIcon,
                color: 'error.main',
                message: MESSAGES.noOrgUnitInGroups,
            };
        case 'emptyLevelAbove':
            return {
                Icon: WarningAmberIcon,
                color: 'warning.dark',
                message: MESSAGES.emptyLevelAbove,
            };
    }
};

type Props = {
    issues: LevelIssue[];
    rootOrgUnitName: string;
};

export const LevelIssues: FC<Props> = ({ issues, rootOrgUnitName }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Stack gap={0.5}>
            {React.Children.toArray(
                issues.map(issue => {
                    const { Icon, color, message, values } = getIssueDisplay(
                        issue,
                        rootOrgUnitName,
                    );
                    return (
                        <Stack direction="row" gap={0.75} color={color}>
                            <Icon sx={styles.icon} />
                            <Typography variant="caption">
                                {formatMessage(message, values)}
                            </Typography>
                        </Stack>
                    );
                }),
            )}
        </Stack>
    );
};
