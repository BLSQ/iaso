import React, { FunctionComponent } from 'react';
import {
    Box,
    Grid,
    FormControlLabel,
    Radio,
    RadioGroup,
} from '@material-ui/core';
import InputComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { useOptions } from './utils';
import MESSAGES from '../../../../constants/messages';
import { AfroMapParams, Side } from './types';

type Props = {
    selectedRound: string;
    // eslint-disable-next-line no-unused-vars
    onRoundChange: (value: string, side: Side) => void;
    side: Side;
    params: AfroMapParams;
    // eslint-disable-next-line no-unused-vars
    onDisplayedShapeChange: (value: string, side: Side) => void;
};

export const LqasAfroSelector: FunctionComponent<Props> = ({
    selectedRound,
    onRoundChange,
    params,
    onDisplayedShapeChange,
    side,
}) => {
    const options = useOptions();
    const shapeKey =
        side === 'left' ? 'displayedShapesLeft' : 'displayedShapesRight';
    return (
        <>
            <Grid container spacing={4}>
                <Grid item xs={6}>
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
                </Grid>
                <Grid item xs={6}>
                    <Box mt={3} display="flex" justifyContent="center">
                        <RadioGroup
                            row
                            name="displayedShapes"
                            value={params[shapeKey] || 'country'}
                            onChange={(_, value) =>
                                onDisplayedShapeChange(value, side)
                            }
                        >
                            <FormControlLabel
                                value="country"
                                control={<Radio color="primary" />}
                                label="COUNTRY"
                            />
                            <FormControlLabel
                                value="district"
                                control={<Radio color="primary" />}
                                label="DISTRICT"
                            />
                        </RadioGroup>
                    </Box>
                </Grid>
            </Grid>
        </>
    );
};
