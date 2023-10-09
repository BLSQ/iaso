import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Box, makeStyles } from '@material-ui/core';

import AddLocation from '@material-ui/icons/AddLocation';
import DeleteIcon from '@material-ui/icons/Delete';

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
                            onChange={(_, lat) => {
                                if (lat) {
                                    onChangeLocation({
                                        lat,
                                    });
                                }
                            }}
                            value={orgUnit.latitude}
                            type="number"
                            label={MESSAGES.latitude}
                            min={-90}
                            max={90}
                            step={0.00000001}
                        />
                        <InputComponent
                            disabled={actionBusy}
                            keyValue="longitude"
                            onChange={(_, lng) => {
                                if (lng) {
                                    onChangeLocation({
                                        lng,
                                    });
                                }
                            }}
                            value={orgUnit.longitude}
                            type="number"
                            label={MESSAGES.longitude}
                            min={-180}
                            max={180}
                        />
                        <InputComponent
                            disabled={actionBusy}
                            keyValue="altitude"
                            value={orgUnit.altitude}
                            type="number"
                            label={MESSAGES.altitude}
                            onChange={(_, alt) => {
                                if (alt) {
                                    onChangeLocation({
                                        alt,
                                    });
                                }
                            }}
                        />
                        <Box mb={2} mt={2}>
                            <Button
                                disabled={actionBusy}
                                variant="outlined"
                                color="primary"
                                className={classes.button}
                                onClick={() =>
                                    onChangeLocation({
                                        lat: null,
                                        lng: null,
                                        alt: null,
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
