import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import InfoIcon from '@mui/icons-material/Info';
import {
    Alert,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useSafeIntl } from 'bluesquare-components';
import { ApiAccountsRetrieveQueryResult } from 'Iaso/api/accounts';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../messages';

// todo : modules type inference once generated through orval

type Props = {
    accountId: number;
    account?: ApiAccountsRetrieveQueryResult;
    // modules: string[]
};

export const ModulePanel = ({ accountId, modules, account }: Props) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.modulesTitle)}
            expandable={true}
            id={`account-${accountId}-modules`}
            data-testid={'account-module-panel'}
        >
            {modules?.length ? (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 75 }}>
                                <Typography
                                    sx={visuallyHidden}
                                    component={'span'}
                                >
                                    {formatMessage(MESSAGES.additionalInfo)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                {formatMessage(MESSAGES.name)}
                            </TableCell>
                            <TableCell>
                                {formatMessage(MESSAGES.status)}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {modules?.map(({ value, label }) => {
                            return (
                                <TableRow key={value}>
                                    <TableCell align={'center'}>
                                        {value === 'FORM_AI' && (
                                            <Tooltip
                                                title={formatMessage(
                                                    MESSAGES.formAIModuleTooltipTitle,
                                                )}
                                            >
                                                <InfoIcon color="action" />
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                    <TableCell>{label}</TableCell>
                                    <TableCell>
                                        {account?.modules?.includes(value) ? (
                                            <CheckIcon
                                                color={'success'}
                                                aria-label={formatMessage(
                                                    MESSAGES.selected,
                                                )}
                                            />
                                        ) : (
                                            <ClearIcon
                                                color={'error'}
                                                aria-label={formatMessage(
                                                    MESSAGES.notSelected,
                                                )}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            ) : (
                <Alert severity={'info'} sx={{ mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </WidgetPaper>
    );
};
