import React from 'react';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import DescriptionIcon from '@mui/icons-material/Description';
import {
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Box,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionPolymorphicRetrieve } from 'Iaso/api/missions';
import MESSAGES from 'Iaso/domains/missions/messages';
import { getOverriddenTheme } from 'Iaso/styles';
import { SxStyles } from 'Iaso/types/general';

type FormWidgetPaperProps = {
    mission: MissionPolymorphicRetrieve;
};

const styles: SxStyles = {
    root: {
        mb: 2,
    },
    tableContainer: {
        maxHeight: 'calc(95vh - 260px)',
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

export const FormWidgetPaper: React.FunctionComponent<FormWidgetPaperProps> = ({
    mission,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Box
            title={formatMessage(MESSAGES.forms)}
            id={`mission-${mission.id}-forms`}
            data-testid={'missions-forms'}
            sx={styles.root}
        >
            <Typography
                variant="body1"
                sx={{ textTransform: 'uppercase', mb: 2, fontSize: '15px' }}
            >
                <DescriptionIcon
                    color="primary"
                    sx={{
                        mr: 1,
                        fontSize: '15px',
                        position: 'relative',
                        top: '2px',
                    }}
                />
                {formatMessage(MESSAGES.forms)}
            </Typography>
            {mission?.forms?.length ? (
                <TableContainer sx={styles.tableContainer}>
                    <Table
                        size={'small'}
                        stickyHeader
                        sx={{
                            border: theme =>
                                // @ts-ignore
                                `1px solid ${theme.palette.ligthGray.border}`,
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    {formatMessage(MESSAGES.form)}
                                </TableCell>
                                <TableCell>
                                    {formatMessage(MESSAGES.min)}
                                </TableCell>

                                <TableCell>
                                    {formatMessage(MESSAGES.max)}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {mission?.forms?.map(
                                ({
                                    form,
                                    form_name,
                                    min_cardinality,
                                    max_cardinality,
                                }) => {
                                    return (
                                        <TableRow key={form} sx={styles.row}>
                                            <TableCell>{form_name}</TableCell>
                                            <TableCell>
                                                {min_cardinality.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {max_cardinality?.toLocaleString() ?? (
                                                    <AllInclusiveIcon
                                                        fontSize="small"
                                                        color="primary"
                                                        aria-label={formatMessage(
                                                            MESSAGES.infinity,
                                                        )}
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                },
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Alert severity={'info'} sx={{ mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </Box>
    );
};
