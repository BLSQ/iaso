import React, { FunctionComponent } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import {
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { ApiAccountFeatureFlagsDropdownListQueryResult } from 'Iaso/api/accountFeatureFlags';
import { ApiAccountsRetrieveQueryResult } from 'Iaso/api/accounts';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { getOverriddenTheme } from 'Iaso/styles';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

type Props = {
    accountId: number;
    accountFeatureFlags?: ApiAccountFeatureFlagsDropdownListQueryResult;
    account: ApiAccountsRetrieveQueryResult;
};

const styles: SxStyles = {
    tableContainer: {
        maxHeight: '31.7vh',
        overscrollBehavior: 'none',
    },
    row: {
        '&:nth-of-type(odd)': (
            theme: ReturnType<typeof getOverriddenTheme>,
        ) => ({
            backgroundColor: theme.palette.gray.background,
        }),
        '&:nth-of-type(even)': {
            backgroundColor: 'transparent',
        },
    },
};

export const AccountFeatureFlagPanel: FunctionComponent<Props> = ({
    accountId,
    accountFeatureFlags,
    account,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.featureFlagsTitle)}
            id={`account-${accountId}-feature-flags`}
            data-testid={`account-feature-flags`}
        >
            {accountFeatureFlags?.length ? (
                <TableContainer sx={styles.tableContainer}>
                    <Table size={'small'} stickyHeader>
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
                                    <TableRow key={value} sx={styles.row}>
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
                </TableContainer>
            ) : (
                <Alert severity={'info'} sx={{ mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </WidgetPaper>
    );
};
