import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { LqasAfroMapFilters } from './Filters/LqasAfroMapFilters';
import { useStyles } from '../../../../styles/theme';
import { AfroMapParams } from './types';
import MESSAGES from '../../../../constants/messages';
import { LqasAfroMapWithSelector } from './Map/LqasAfroMapWithSelector';
import { baseUrls } from '../../../../constants/urls';
import { useParamsObject } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { useRedirectToReplace } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/routing';

const baseUrl = baseUrls.lqasAfro;
export const LqasAfroOverview: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as AfroMapParams;
    const redirectToReplace = useRedirectToReplace();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [selectedRounds, setSelectedRounds] = useState(
        params?.rounds?.split(',') ?? ['penultimate', 'latest'],
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
            redirectToReplace(baseUrl, {
                ...params,
                rounds: `${updatedSelection}`,
            });
        },
        [params, redirectToReplace, selectedRounds],
    );
    const onDisplayedShapeChange = useCallback(
        (value, side) => {
            const tempParams = {
                ...params,
            };
            if (side === 'left') {
                tempParams.displayedShapesLeft = value;
            }
            if (side === 'right') {
                tempParams.displayedShapesRight = value;
            }
            redirectToReplace(baseUrl, tempParams as AfroMapParams);
        },
        [params, redirectToReplace],
    );

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqasMap)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <LqasAfroMapFilters params={params} />

                <Box mt={2}>
                    <Grid container spacing={2} direction="row">
                        <Grid item xs={6}>
                            <LqasAfroMapWithSelector
                                onRoundChange={onRoundChange}
                                side="left"
                                selectedRound={selectedRounds[0]}
                                params={params}
                                onDisplayedShapeChange={onDisplayedShapeChange}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <LqasAfroMapWithSelector
                                onRoundChange={onRoundChange}
                                side="right"
                                selectedRound={selectedRounds[1]}
                                params={params}
                                onDisplayedShapeChange={onDisplayedShapeChange}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
};
