import React, { FunctionComponent } from 'react';
import { Box, Paper } from '@material-ui/core';
import { paperElevation } from '../../../IM/constants';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { LqasAfroMap } from './LqasAfroMap';
import { useOptions } from '../utils';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { Tile } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/tools/TilesSwitchControl';
import MESSAGES from '../../../../constants/messages';
import { Side } from '../types';

type Props = {
    selectedRound: string;
    // eslint-disable-next-line no-unused-vars
    onRoundChange: (value: string, side: Side) => void;
    router: Router;
    currentTile: Tile;
    setCurrentTile: React.Dispatch<React.SetStateAction<Tile>>;
    side: Side;
};

export const LqasAfroMapWithSelector: FunctionComponent<Props> = ({
    selectedRound,
    onRoundChange,
    router,
    currentTile,
    setCurrentTile,
    side,
}) => {
    const options = useOptions();
    return (
        <Paper elevation={paperElevation}>
            <Box mb={2} pt={2} ml={2} style={{ width: '50%' }}>
                <InputComponent
                    type="select"
                    multi={false}
                    keyValue="round"
                    onChange={(_, value) => onRoundChange(value, side)}
                    value={selectedRound}
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
                    side={side}
                />
            </Box>
        </Paper>
    );
};
