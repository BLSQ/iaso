import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import InfoIcon from '@mui/icons-material/Info';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { ApiAccountsRetrieveQueryResult } from 'Iaso/api/accounts';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../messages';
// todo : modules type inference

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
        >
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: 75 }}></TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {modules?.map(({ value, label }) => {
                        return (
                            <TableRow key={value}>
                                <TableCell align={'center'}>
                                    {value === 'FORM_AI' && (
                                        <Tooltip
                                            title={
                                                'Make sure to provide an AI api key'
                                            }
                                        >
                                            <InfoIcon color="action" />
                                        </Tooltip>
                                    )}
                                </TableCell>
                                <TableCell>{label}</TableCell>
                                <TableCell>
                                    {account?.modules?.includes(value) ? (
                                        <CheckIcon color={'success'} />
                                    ) : (
                                        <ClearIcon color={'error'} />
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </WidgetPaper>
    );
};
