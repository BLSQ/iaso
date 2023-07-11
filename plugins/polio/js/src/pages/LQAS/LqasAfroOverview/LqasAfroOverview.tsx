import React, { FunctionComponent, useState } from 'react';
import { Box, Grid } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import TILES from '../../../../../../../hat/assets/js/apps/Iaso/constants/mapTiles';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { Tile } from '../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/TilesSwitchControl';
import { LqasAfroMapFilters } from './Filters/LqasAfroMapFilters';
import { useStyles } from '../../../styles/theme';
import { Router } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { AfroMapParams } from './types';
import { LqasAfroMap } from './Map/LqasAfroMap';

type Props = {
    router: Router;
};
export const LqasAfroOverview: FunctionComponent<Props> = ({ router }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [currentTile, setCurrentTile] = useState<Tile>(TILES.osm);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqasMap)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <LqasAfroMapFilters params={router.params as AfroMapParams} />
                <Box position="relative" mt={2}>
                    <Grid container spacing={2} direction="row">
                        <Grid item xs={6}>
                            <LqasAfroMap
                                router={router}
                                currentTile={currentTile}
                                setCurrentTile={setCurrentTile}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <LqasAfroMap
                                router={router}
                                currentTile={currentTile}
                                setCurrentTile={setCurrentTile}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </>
    );
};
