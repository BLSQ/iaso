import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Grid, Paper } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { push } from 'react-router-redux';
import MESSAGES from '../../../constants/messages';
import TILES from '../../../../../../../hat/assets/js/apps/Iaso/constants/mapTiles';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { Tile } from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/TilesSwitchControl';
import { LqasAfroMapFilters } from './Filters/LqasAfroMapFilters';
import { useStyles } from '../../../styles/theme';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { AfroMapParams } from './types';
import { LqasAfroMap } from './Map/LqasAfroMap';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useOptions } from './utils';
import { genUrl } from '../../../utils/routing';
import { paperElevation } from '../../IM/constants';

type Props = {
    router: Router;
};
export const LqasAfroOverview: FunctionComponent<Props> = ({ router }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
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

    const options = useOptions();
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
                            <Paper elevation={paperElevation}>
                                <Box
                                    mb={2}
                                    pt={2}
                                    ml={2}
                                    style={{ width: '50%' }}
                                >
                                    <InputComponent
                                        type="select"
                                        multi={false}
                                        keyValue="round"
                                        onChange={(_, value) =>
                                            onRoundChange(value, 'left')
                                        }
                                        value={selectedRounds[0]}
                                        options={options}
                                        clearable={false}
                                        label={MESSAGES.round}
                                    />
                                </Box>
                                <Box m={2} pb={2}>
                                    <LqasAfroMap
                                        router={router}
                                        currentTile={currentTile}
                                        setCurrentTile={setCurrentTile}
                                        side="left"
                                    />
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={6}>
                            <Paper elevation={2}>
                                <Box
                                    mb={2}
                                    pt={2}
                                    ml={2}
                                    style={{ width: '50%' }}
                                >
                                    <InputComponent
                                        type="select"
                                        multi={false}
                                        keyValue="round"
                                        onChange={(_, value) =>
                                            onRoundChange(value, 'right')
                                        }
                                        value={selectedRounds[1]}
                                        options={options}
                                        clearable={false}
                                        label={MESSAGES.round}
                                    />
                                </Box>
                                <Box m={2} pb={2}>
                                    <LqasAfroMap
                                        router={router}
                                        currentTile={currentTile}
                                        setCurrentTile={setCurrentTile}
                                        side="right"
                                    />
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
};
