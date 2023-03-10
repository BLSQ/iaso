import React, { FunctionComponent } from 'react';
import {
    Box,
    Button,
    Grid,
    makeStyles,
    Table,
    TableBody,
    TableCell,
    TableRow,
} from '@material-ui/core';
import classnames from 'classnames';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import MESSAGES from './messages';
import { StarsComponent } from '../../../components/stars/StarsComponent';
import { useMergeDuplicate } from './hooks/useMergeDuplicate';

type Props = {
    isLoading: boolean;
    similarityScore: number;
    algorithmsUsed: string[];
    algorithmRuns: number;
    unmatchedRemaining: number;
    formName: string;
    entityIds: string;
    query: Record<string, any>;
};

const useStyles = makeStyles({
    table: {
        '& .MuiTable-root': {
            borderLeft: `1px solid rgb(224, 224, 224)`,
            borderRight: `1px solid rgb(224, 224, 224)`,
            borderBottom: `1px solid rgb(224, 224, 224)`,
            width: '100%',
        },
    },
    fullWidth: { width: '100%' },
});

export const DuplicateInfos: FunctionComponent<Props> = ({
    unmatchedRemaining,
    formName,
    algorithmRuns,
    algorithmsUsed,
    similarityScore,
    isLoading,
    entityIds,
    query,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { mutate: mergeEntities } = useMergeDuplicate();
    return (
        <WidgetPaper className={classnames(classes.table)} title={formName}>
            <Grid container>
                <Grid item xs={12} md={4}>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    {formatMessage(MESSAGES.similarityScore)}
                                </TableCell>
                                <TableCell>
                                    {isLoading && <LoadingSpinner />}
                                    <StarsComponent
                                        starCount={5}
                                        fullStars={similarityScore}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {formatMessage(MESSAGES.entities)}
                                </TableCell>
                                <TableCell>{entityIds}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {formatMessage(MESSAGES.algorithmRuns)}
                                </TableCell>
                                <TableCell>{algorithmRuns}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {' '}
                                    {formatMessage(MESSAGES.algorithmsUsed)}
                                </TableCell>
                                <TableCell>{algorithmsUsed}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>
                                    {formatMessage(MESSAGES.unmatchedRemaining)}
                                </TableCell>
                                <TableCell>{unmatchedRemaining}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Grid>
                <Grid
                    container
                    item
                    xs={12}
                    md={8}
                    justifyContent="flex-end"
                    alignItems="flex-end"
                >
                    <Box pb={2}>
                        <Button color="primary" variant="outlined">
                            {formatMessage(MESSAGES.ignore)}
                        </Button>
                    </Box>
                    <Box ml={2} pb={2} mr={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                mergeEntities(query);
                            }}
                        >
                            {formatMessage(MESSAGES.merge)}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </WidgetPaper>
    );
};
