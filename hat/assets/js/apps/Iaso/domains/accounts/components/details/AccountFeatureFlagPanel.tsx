import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { ApiAccountFeatureFlagsDropdownListQueryResult } from 'Iaso/api/accountFeatureFlags';
import { ApiAccountsRetrieveQueryResult } from 'Iaso/api/accounts';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../messages';

type Props = {
    accountId: number;
    accountFeatureFlags?: ApiAccountFeatureFlagsDropdownListQueryResult;
    account: ApiAccountsRetrieveQueryResult;
};
export const AccountFeatureFlagPanel = ({
    accountId,
    accountFeatureFlags,
    account,
}: Props) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.featureFlagsTitle)}
            expandable={true}
            id={`account-${accountId}-feature-flags`}
        >
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {accountFeatureFlags?.map(({ value, label }) => {
                        return (
                            <TableRow key={value}>
                                <TableCell>{label}</TableCell>
                                <TableCell>
                                    {account?.feature_flags
                                        ?.map(({ code }) => code)
                                        ?.includes(value) ? (
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
