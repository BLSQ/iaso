import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Box, Typography, makeStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import { commonStyles, useSafeIntl } from 'bluesquare-components';

import MarkerButtons from './MarkerButtons';
import ShapesButtons from './ShapesButtons';

import MESSAGES from '../../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    button: {
        width: '100%',
    },
}));

const EditOrgUnitOptionComponent = ({
    orgUnit,
    locationState,
    catchmentState,
    toggleEditShape,
    toggleAddShape,
    toggleDeleteShape,
    onChangeLocation,
    addMarker,
    addShape,
    canEditLocation,
    canEditCatchment,
}) => {
    const classes = useStyles();
    const intl = useSafeIntl();
    const hasMarker =
        Boolean(orgUnit.latitude !== null) &&
        Boolean(orgUnit.longitude !== null);
    return (
        <Box
            display="flex"
            flexWrap="wrap"
            className={classes.innerDrawerContent}
            flexDirection="column"
        >
            <Box
                component="div"
                display="flex"
                flexWrap="wrap"
                flexDirection="column"
            >
                <Box>
                    <Box
                        px={0}
                        component="div"
                        className={classes.marginTop}
                        mb={2}
                    >
                        <Typography variant="subtitle1" color="primary">
                            <FormattedMessage {...MESSAGES.location} />
                        </Typography>
                    </Box>
                    <MarkerButtons
                        orgUnit={orgUnit}
                        onChangeLocation={onChangeLocation}
                        addMarker={addMarker}
                        hasMarker={hasMarker}
                    />

                    <ShapesButtons
                        disabled={
                            catchmentState.edit ||
                            catchmentState.delete ||
                            catchmentState.add
                        }
                        editEnabled={locationState.edit}
                        deleteEnabled={locationState.delete}
                        addEnabled={locationState.add}
                        hasEditRight={canEditLocation}
                        toggleEditShape={toggleEditShape}
                        toggleDeleteShape={toggleDeleteShape}
                        toggleAddShape={toggleAddShape}
                        addShape={addShape}
                        canAdd={!hasMarker}
                        hasShape={Boolean(orgUnit.geo_json)}
                        shapeKey="location"
                        editDisabledMessage={intl.formatMessage({
                            ...MESSAGES.editLocationDisabled,
                        })}
                    />
                </Box>
                <Box>
                    <Box px={0} component="div" mb={2}>
                        <Typography variant="subtitle1" color="secondary">
                            <FormattedMessage {...MESSAGES.catchment} />
                        </Typography>
                    </Box>
                    <ShapesButtons
                        disabled={
                            locationState.edit ||
                            locationState.delete ||
                            locationState.add
                        }
                        editEnabled={catchmentState.edit}
                        deleteEnabled={catchmentState.delete}
                        addEnabled={catchmentState.add}
                        hasEditRight={canEditCatchment}
                        toggleEditShape={toggleEditShape}
                        toggleAddShape={toggleAddShape}
                        toggleDeleteShape={toggleDeleteShape}
                        addShape={addShape}
                        canAdd
                        color="secondary"
                        hasShape={Boolean(orgUnit.catchment)}
                        shapeKey="catchment"
                        editDisabledMessage={intl.formatMessage({
                            ...MESSAGES.editCatchmentDisabled,
                        })}
                    />
                </Box>
            </Box>
        </Box>
    );
};
EditOrgUnitOptionComponent.propTypes = {
    orgUnit: PropTypes.object.isRequired,
    locationState: PropTypes.object.isRequired,
    catchmentState: PropTypes.object.isRequired,
    toggleEditShape: PropTypes.func.isRequired,
    toggleAddShape: PropTypes.func.isRequired,
    toggleDeleteShape: PropTypes.func.isRequired,
    addMarker: PropTypes.func.isRequired,
    addShape: PropTypes.func.isRequired,
    onChangeLocation: PropTypes.func.isRequired,
    canEditLocation: PropTypes.bool.isRequired,
    canEditCatchment: PropTypes.bool.isRequired,
};

export default EditOrgUnitOptionComponent;
