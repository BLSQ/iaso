import React from 'react';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
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
import { MissionPolymorphicRetrieve } from 'Iaso/api/missions';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
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
        <WidgetPaper
            title={formatMessage(MESSAGES.forms)}
            id={`mission-${mission.id}-forms`}
            data-testid={'missions-forms'}
            sx={styles.root}
        >
            {mission?.forms?.length ? (
                <TableContainer sx={styles.tableContainer}>
                    <Table size={'small'} stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    {formatMessage(MESSAGES.form)}
                                </TableCell>
                                <TableCell>
                                    {formatMessage(MESSAGES.minCardinality)}
                                </TableCell>

                                <TableCell>
                                    {formatMessage(MESSAGES.maxCardinality)}
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
                                                {min_cardinality}
                                            </TableCell>
                                            <TableCell>
                                                {max_cardinality ?? (
                                                    <AllInclusiveIcon
                                                        fontSize="small"
                                                        color="primary"
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
        </WidgetPaper>
    );
};
