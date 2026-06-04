import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import {
    Alert,
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
            data-testid={`account-feature-flags`}
        >
            {accountFeatureFlags?.length ? (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                {formatMessage(MESSAGES.name)}
                            </TableCell>
                            <TableCell>
                                {formatMessage(MESSAGES.status)}
                            </TableCell>
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
