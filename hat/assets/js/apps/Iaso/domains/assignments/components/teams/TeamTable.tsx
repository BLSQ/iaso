import React, { FunctionComponent } from 'react';
import {
    Table,
    Paper,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Box,
} from '@mui/material';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import MESSAGES from 'Iaso/domains/assignments/messages';
import { Team } from 'Iaso/domains/teams/types/team';
import { SxStyles } from 'Iaso/types/general';
import { TeamTableBody } from './TeamTableBody';

const defaultHeight = '80vh';

const styles: SxStyles = {
    paper: {
        height: defaultHeight,
    },
    title: {
        pt: theme => theme.spacing(2),
        pl: theme => theme.spacing(2),
    },
    tableContainer: {
        maxHeight: '75vh',
        overflow: 'auto',
        scrollbarWidth: 'thin',
    },
};

type Props = {
    rootTeam?: Team;
    isLoadingRootTeam: boolean;
};

export const TeamTable: FunctionComponent<Props> = ({
    rootTeam,
    isLoadingRootTeam,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Paper sx={styles.paper}>
                {isLoadingRootTeam && (
                    <LoadingSpinner fixed={false} transparent absolute />
                )}
                {rootTeam && (
                    <>
                        <Typography sx={styles.title} variant="h6">
                            {rootTeam?.name}
                        </Typography>
                        <Box sx={styles.tableContainer}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                width: 50,
                                            }}
                                        >
                                            {formatMessage(MESSAGES.selection)}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                width: 50,
                                            }}
                                        >
                                            {formatMessage(MESSAGES.color)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMessage(MESSAGES.name)}
                                        </TableCell>
                                        <TableCell>
                                            {formatMessage(
                                                MESSAGES.assignationsCount,
                                            )}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableHead>
                                <TeamTableBody rootTeam={rootTeam} />
                            </Table>
                        </Box>
                    </>
                )}
            </Paper>
        </>
    );
};
