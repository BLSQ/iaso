import React, { FunctionComponent } from 'react';
import {
    Box,
    Grid,
    Paper,
    FormControlLabel,
    Radio,
    RadioGroup,
    makeStyles,
} from '@material-ui/core';
import { paperElevation } from '../../../shared/constants';
import InputComponent from '../../../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { LqasAfroMap } from './LqasAfroMap';
import { useOptions } from '../utils';
import { Router } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../../constants/messages';
import { AfroMapParams, Side } from '../types';

const useStyles = makeStyles(theme => ({
    mapContainer: {
        '& .tile-switch-control': {
            top: 'auto',
            bottom: theme.spacing(1),
            left: theme.spacing(1),
            right: 'auto',
        },
    },
}));

type Props = {
    selectedRound: string;
    // eslint-disable-next-line no-unused-vars
    onRoundChange: (value: string, side: Side) => void;
    router: Router;
    side: Side;
    params: AfroMapParams;
    // eslint-disable-next-line no-unused-vars
    onDisplayedShapeChange: (value: string, side: Side) => void;
};

export const LqasAfroMapWithSelector: FunctionComponent<Props> = ({
    selectedRound,
    onRoundChange,
    router,
    side,
    params,
    onDisplayedShapeChange,
}) => {
    const options = useOptions();
    const shapeKey =
        side === 'left' ? 'displayedShapesLeft' : 'displayedShapesRight';
    const classes = useStyles();
    return (
        <Paper elevation={paperElevation}>
            <Box px={2}>
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
            </Box>
            <Box m={2} pb={2} className={classes.mapContainer}>
                <LqasAfroMap router={router} side={side} />
            </Box>
        </Paper>
    );
};
