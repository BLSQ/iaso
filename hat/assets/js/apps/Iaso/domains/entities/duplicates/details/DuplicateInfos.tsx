import React, { FunctionComponent, useCallback } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useRedirectTo, useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import WidgetPaper from '../../../../components/papers/WidgetPaperComponent';
import {
    formSuccessFullMessageKey,
    succesfullSnackBar,
} from '../../../../constants/snackBars';
import { baseUrls } from '../../../../constants/urls';
import {
    ENTITY_DUPLICATES_SOFT_DELETE,
    hasFeatureFlag,
} from '../../../../utils/featureFlags';
import * as Permission from '../../../../utils/permissions';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { userHasPermission } from '../../../users/utils';
import { useSoftDeleteEntity } from '../../hooks/requests';
import { useIgnoreDuplicate } from '../hooks/api/useIgnoreDuplicate';
import { useMergeDuplicate } from '../hooks/api/useMergeDuplicate';
import MESSAGES from '../messages';
import { DuplicateInfosTable } from './DuplicateInfosTable';

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
    const redirectTo = useRedirectTo();

    const successSnackBar = (msg, _data) => {
        return succesfullSnackBar(formSuccessFullMessageKey, msg);
        // TODO uncomment when we figured out how to style the button
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
        redirectTo(baseUrls.entityDuplicates);
    }, [redirectTo]);
    const { mutate: mergeEntities } = useMergeDuplicate(
        successSnackBar,
        onSuccess,
    );
    const { mutate: softDeleteEntity } = useSoftDeleteEntity(onSuccess);
    const { mutateAsync: ignoreDuplicate } = useIgnoreDuplicate(onSuccess);
    return (
        <Box data-test="duplicate-infos">
            <Grid container>
                <Grid item xs={12} md={4}>
                    <WidgetPaper
                        className={classnames(classes.table)}
                        title={formName}
                    >
                        <DuplicateInfosTable
                            isLoading={isLoading}
                            entityIds={entityIds}
                            algorithmsUsed={algorithmsUsed}
                            algorithmRuns={algorithmRuns}
                            unmatchedRemaining={unmatchedRemaining}
                            similarityScore={similarityScore}
                        />
                    </WidgetPaper>
                </Grid>
                {userHasPermission(
                    Permission.ENTITIES_DUPLICATE_WRITE,
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
                        <Box>
                            <Button
                                color="primary"
                                variant="outlined"
                                data-test="ignore-button"
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
                        {hasFeatureFlag(
                            currentUser,
                            ENTITY_DUPLICATES_SOFT_DELETE,
                        ) && (
                            <Box
                                ml={2}
                                mr={2}
                                style={{
                                    display: 'inline-flex',
                                }}
                            >
                                <Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        data-test="soft-delete-A-button"
                                        onClick={() =>
                                            softDeleteEntity(entityIds[0])
                                        }
                                    >
                                        {formatMessage(MESSAGES.softDeleteA)}
                                    </Button>
                                </Box>
                                <Box ml={2}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        data-test="soft-delete-B-button"
                                        onClick={() =>
                                            softDeleteEntity(entityIds[1])
                                        }
                                    >
                                        {formatMessage(MESSAGES.softDeleteB)}
                                    </Button>
                                </Box>
                            </Box>
                        )}
                        {!hasFeatureFlag(
                            currentUser,
                            ENTITY_DUPLICATES_SOFT_DELETE,
                        ) && (
                            <Box ml={2} mr={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    data-test="merge-button"
                                    onClick={() => {
                                        mergeEntities({
                                            entity1_id: entityIds[0],
                                            entity2_id: entityIds[1],
                                            merge: query,
                                        });
                                    }}
                                    disabled={disableMerge}
                                >
                                    {formatMessage(MESSAGES.merge)}
                                </Button>
                            </Box>
                        )}
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};
