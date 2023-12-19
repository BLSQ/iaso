import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { push } from 'react-router-redux';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { LqasAfroMapFilters } from './Filters/LqasAfroMapFilters';
import { useStyles } from '../../../../styles/theme';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { AfroMapParams } from './types';
import { genUrl } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/routing';
import MESSAGES from '../../../../constants/messages';
import { LqasAfroMapWithSelector } from './Map/LqasAfroMapWithSelector';
import { redirectToReplace } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { LQAS_AFRO_MAP_URL } from '../../../../constants/routes';

type Props = {
    router: Router;
};
export const LqasAfroOverview: FunctionComponent<Props> = ({ router }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [selectedRounds, setSelectedRounds] = useState(
        router.params?.rounds?.split(',') ?? ['penultimate', 'latest'],
    );

    const onRoundChange = useCallback(
        (value, side) => {
            const updatedSelection = [...selectedRounds];
            if (side === 'left') {
                updatedSelection[0] = value;
            } else {
                updatedSelection[1] = value;
            }
            setSelectedRounds(updatedSelection);
            const url = genUrl(router, {
                rounds: updatedSelection,
            });
            dispatch(push(url));
        },
        [dispatch, router, selectedRounds],
    );
    const onDisplayedShapeChange = useCallback(
        (value, side) => {
            const tempParams = {
                ...router.params,
            };
            if (side === 'left') {
                tempParams.displayedShapesLeft = value;
            }
            if (side === 'right') {
                tempParams.displayedShapesRight = value;
            }
            dispatch(
                redirectToReplace(
                    LQAS_AFRO_MAP_URL,
                    tempParams as AfroMapParams,
                ),
            );
        },
        [dispatch, router],
    );

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqasMap)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <LqasAfroMapFilters params={router.params as AfroMapParams} />

                <Box mt={2}>
                    <Grid container spacing={2} direction="row">
                        <Grid item xs={6}>
                            <LqasAfroMapWithSelector
                                onRoundChange={onRoundChange}
                                side="left"
                                router={router}
                                selectedRound={selectedRounds[0]}
                                params={router.params as AfroMapParams}
                                onDisplayedShapeChange={onDisplayedShapeChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <LqasAfroMapWithSelector
                                onRoundChange={onRoundChange}
                                side="right"
                                router={router}
                                selectedRound={selectedRounds[1]}
                                params={router.params as AfroMapParams}
                                onDisplayedShapeChange={onDisplayedShapeChange}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
};
