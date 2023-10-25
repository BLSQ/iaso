import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Box } from '@mui/material';
import { makeStyles } from '@mui/styles';

import AddLocation from '@mui/icons-material/AddLocation';
import DeleteIcon from '@mui/icons-material/Delete';

import PropTypes from 'prop-types';

import { commonStyles } from 'bluesquare-components';

import InputComponent from '../../../../components/forms/InputComponent';

import MESSAGES from '../../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
    },
}));
const MarkerInputs = ({
    orgUnit,
    onChangeLocation,
    toggleAddMarker,
    hasMarker,
    actionBusy,
    isCreatingMarker,
}) => {
    const classes = useStyles();
    const { latitude, longitude, altitude } = orgUnit;
    return (
        <>
            <Box>
                {!orgUnit.geo_json && !hasMarker && (
                    <Box mb={2} mt={2}>
                        <Button
                            variant="outlined"
                            disabled={actionBusy}
                            onClick={() => toggleAddMarker()}
                            className={classes.button}
                            color="primary"
                        >
                            <AddLocation className={classes.buttonIcon} />
                            {!isCreatingMarker && (
                                <FormattedMessage {...MESSAGES.addLocation} />
                            )}
                            {isCreatingMarker && (
                                <FormattedMessage {...MESSAGES.done} />
                            )}
                        </Button>
                    </Box>
                )}
                {hasMarker && (
                    <>
                        <InputComponent
                            disabled={actionBusy}
                            keyValue="latitude"
                            onChange={(_, newlatitude) =>
                                onChangeLocation({
                                    latitude:
                                        newlatitude === undefined
                                            ? null
                                            : newlatitude,
                                    longitude,
                                    altitude,
                                })
                            }
                            value={latitude}
                            type="number"
                            label={MESSAGES.latitude}
                            numberInputOptions={{
                                min: -90,
                                max: 90,
                                decimalScale: 4,
                            }}
                        />
                        <InputComponent
                            disabled={actionBusy}
                            keyValue="longitude"
                            onChange={(_, newLongitude) =>
                                onChangeLocation({
                                    latitude,
                                    longitude:
                                        newLongitude === undefined
                                            ? null
                                            : newLongitude,
                                    altitude,
                                })
                            }
                            value={longitude}
                            type="number"
                            label={MESSAGES.longitude}
                            numberInputOptions={{
                                min: -180,
                                max: 180,
                                decimalScale: 4,
                            }}
                        />
                        <InputComponent
                            disabled={actionBusy}
                            keyValue="altitude"
                            value={altitude}
                            type="number"
                            label={MESSAGES.altitude}
                            numberInputOptions={{
                                decimalScale: 4,
                            }}
                            onChange={(_, newAltitude) =>
                                onChangeLocation({
                                    altitude:
                                        newAltitude === undefined
                                            ? null
                                            : newAltitude,
                                    longitude,
                                    latitude,
                                })
                            }
                        />
                        <Box mb={2} mt={2}>
                            <Button
                                disabled={actionBusy}
                                variant="outlined"
                                color="primary"
                                className={classes.button}
                                onClick={() =>
                                    onChangeLocation({
                                        latitude: null,
                                        longitude: null,
                                        altitude: null,
                                    })
                                }
                            >
                                <DeleteIcon className={classes.buttonIcon} />
                                <FormattedMessage {...MESSAGES.deleteMarker} />
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </>
    );
};
MarkerInputs.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    toggleAddMarker: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
    hasMarker: PropTypes.bool.isRequired,
    actionBusy: PropTypes.bool.isRequired,
    isCreatingMarker: PropTypes.bool.isRequired,
};

export default MarkerInputs;
