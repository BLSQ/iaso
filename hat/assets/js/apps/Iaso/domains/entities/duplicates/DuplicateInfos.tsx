import React, { FunctionComponent, useCallback } from 'react';
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
import { useDispatch } from 'react-redux';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import MESSAGES from './messages';
import { StarsComponent } from '../../../components/stars/StarsComponent';
import { useMergeDuplicate } from './hooks/useMergeDuplicate';
import { useIgnoreDuplicate } from './hooks/useIgnoreDuplicate';
import {
    formSuccessFullMessageKey,
    succesfullSnackBar,
    // successfullSnackBarWithButtons,
} from '../../../constants/snackBars';
import { baseUrls } from '../../../constants/urls';
import { redirectTo } from '../../../routing/actions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { userHasPermission } from '../../users/utils';

type Props = {
    isLoading: boolean;
    similarityScore: number;
    algorithmsUsed: string[];
    algorithmRuns: number;
    unmatchedRemaining: number;
    formName: string;
    entityIds: [number, number];
    query: Record<string, any>;
    disableMerge: boolean;
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
    successSnackBar: {
        '& .MuiButton-label': {
            color: '#fff',
        },
    },
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
    disableMerge = true,
}) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();
    const successSnackBar = (msg, data) => {
        return succesfullSnackBar(formSuccessFullMessageKey, msg);
        // return successfullSnackBar({
        // messageObject: msg,
        // persist: true,
        // buttonMessageKey: 'goToEntity',
        // buttonAction: () =>
        //     dispatch(
        //         redirectTo(baseUrls.entityDetails, { entityId: data.id }),
        //     ),
        // });
    };
    const onSuccess = useCallback(() => {
        dispatch(redirectTo(baseUrls.entityDuplicates, {}));
    }, [dispatch]);
    const { mutate: mergeEntities } = useMergeDuplicate(
        successSnackBar,
        onSuccess,
    );
    const { mutateAsync: ignoreDuplicate } = useIgnoreDuplicate(onSuccess);
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
                                <TableCell>{entityIds.join(',')}</TableCell>
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
                {userHasPermission(
                    'iaso_entity_duplicates_write',
                    currentUser,
                ) && (
                    <Grid
                        container
                        item
                        xs={12}
                        md={8}
                        justifyContent="flex-end"
                        alignItems="flex-end"
                    >
                        <Box pb={2}>
                            <Button
                                color="primary"
                                variant="outlined"
                                onClick={() => {
                                    ignoreDuplicate({
                                        entity1_id: entityIds[0],
                                        entity2_id: entityIds[1],
                                    });
                                }}
                            >
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
                                disabled={disableMerge}
                            >
                                {formatMessage(MESSAGES.merge)}
                            </Button>
                        </Box>
                    </Grid>
                )}
            </Grid>
        </WidgetPaper>
    );
};
