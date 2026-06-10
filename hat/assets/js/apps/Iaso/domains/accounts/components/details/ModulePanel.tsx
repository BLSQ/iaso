import React, { FunctionComponent } from 'react';
import CheckedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import NotCheckedIcon from '@mui/icons-material/HighlightOffOutlined';
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
    TableContainer,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useSafeIntl } from 'bluesquare-components';
import { ApiAccountsRetrieveQueryResult } from 'Iaso/api/accounts';
import { ApiModulesDropdownListQueryResult } from 'Iaso/api/modules';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { getOverriddenTheme } from 'Iaso/styles';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

type Props = {
    accountId: number;
    account?: ApiAccountsRetrieveQueryResult;
    modules?: ApiModulesDropdownListQueryResult;
};

const styles: SxStyles = {
    tableContainer: {
        maxHeight: '60vh',
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
export const ModulePanel: FunctionComponent<Props> = ({
    accountId,
    modules,
    account,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.modulesTitle)}
            id={`account-${accountId}-modules`}
            data-testid={'account-module-panel'}
        >
            {modules?.length ? (
                <TableContainer sx={styles.tableContainer}>
                    <Table size={'small'} stickyHeader>
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
                                    <TableRow key={value} sx={styles.row}>
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
                                            {account?.modules?.includes(
                                                value,
                                            ) ? (
                                                <CheckedIcon
                                                    color={'success'}
                                                    aria-label={formatMessage(
                                                        MESSAGES.selected,
                                                    )}
                                                />
                                            ) : (
                                                <NotCheckedIcon
                                                    color={'disabled'}
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
