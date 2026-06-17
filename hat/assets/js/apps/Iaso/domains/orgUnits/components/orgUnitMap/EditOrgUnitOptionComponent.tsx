import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { innerDrawerStyles } from '../../../../components/nav/InnerDrawer/styles';
import MESSAGES from '../../messages';
import { OrgUnit } from '../../types/orgUnit';
import MarkerInputs from './MarkerInputs';
import ShapesButtons from './ShapesButtons';

//@ts-ignore
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    ...innerDrawerStyles(theme),
    button: {
        width: '100%',
    },
}));

type Props = {
    orgUnit: OrgUnit;
    locationState: Record<string, any>;
    catchmentState: Record<string, any>;
    toggleEditShape: (keyValue: string) => void;
    toggleAddShape: (keyValue: string) => void;
    toggleDeleteShape: (keyValue: string) => void;
    addShape: (shapeType: string) => void;
    toggleAddMarker: () => void;
    onChangeLocation: (latLong: any) => void;
    canEditLocation: boolean;
    canEditCatchment: boolean;
    isCreatingMarker: boolean;
    errorsCoordinates: {
        latitude: [];
        longitude: [];
    };
    setErrorsCoordinates: React.Dispatch<
        React.SetStateAction<{
            latitude: [];
            longitude: [];
        }>
    >;
};
const EditOrgUnitOptionComponent: FunctionComponent<Props> = ({
    orgUnit,
    locationState,
    catchmentState,
    toggleEditShape,
    toggleAddShape,
    toggleDeleteShape,
    onChangeLocation,
    toggleAddMarker,
    addShape,
    canEditLocation,
    canEditCatchment,
    isCreatingMarker,
    errorsCoordinates,
    setErrorsCoordinates,
}) => {
    const classes: Record<string, string> = useStyles();
    const hasMarker = orgUnit.latitude !== null || orgUnit.longitude !== null;
    return (
        <Box
            className={classes.innerDrawerContent}
            sx={{
                display: "flex",
                flexWrap: "wrap",
                flexDirection: "column"
            }}>
            <Box
                component="div"
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    flexDirection: "column"
                }}>
                <Box>
                    <Box
                        component="div"
                        className={classes.marginTop}
                        sx={{
                            px: 0,
                            mb: 2
                        }}>
                        <Typography variant="subtitle1" color="primary">
                            <FormattedMessage {...MESSAGES.location} />
                        </Typography>
                    </Box>
                    <MarkerInputs
                        errorsCoordinates={errorsCoordinates}
                        setErrorsCoordinates={setErrorsCoordinates}
                        orgUnit={orgUnit}
                        onChangeLocation={onChangeLocation}
                        toggleAddMarker={toggleAddMarker}
                        hasMarker={hasMarker}
                        actionBusy={
                            locationState.edit ||
                            locationState.add ||
                            locationState.delete ||
                            catchmentState.edit ||
                            catchmentState.add ||
                            catchmentState.delete
                        }
                        isCreatingMarker={isCreatingMarker}
                    />
                    {!hasMarker && (
                        <>
                            {!canEditLocation && orgUnit.geo_json && (
                                <Box sx={{
                                    mb: 2
                                }}>
                                    <FormattedMessage
                                        {...MESSAGES.editLocationDisabled}
                                    />
                                </Box>
                            )}
                            {canEditLocation && (
                                <ShapesButtons
                                    disabled={
                                        catchmentState.edit ||
                                        catchmentState.delete ||
                                        catchmentState.add ||
                                        isCreatingMarker
                                    }
                                    editEnabled={locationState.edit}
                                    deleteEnabled={locationState.delete}
                                    addEnabled={locationState.add}
                                    toggleEditShape={toggleEditShape}
                                    toggleDeleteShape={toggleDeleteShape}
                                    toggleAddShape={toggleAddShape}
                                    addShape={addShape}
                                    hasShape={Boolean(orgUnit.geo_json)}
                                    shapeKey="location"
                                />
                            )}
                        </>
                    )}
                </Box>
                <Box>
                    <Box
                        component="div"
                        sx={{
                            px: 0,
                            mb: 2
                        }}>
                        <Typography variant="subtitle1" color="secondary">
                            <FormattedMessage {...MESSAGES.catchment} />
                        </Typography>
                    </Box>
                    {!canEditCatchment && (
                        <Box sx={{
                            mb: 2
                        }}>
                            <FormattedMessage
                                {...MESSAGES.editCatchmentDisabled}
                            />
                        </Box>
                    )}
                    {canEditCatchment && (
                        <ShapesButtons
                            disabled={
                                locationState.edit ||
                                locationState.delete ||
                                locationState.add ||
                                isCreatingMarker
                            }
                            editEnabled={catchmentState.edit}
                            deleteEnabled={catchmentState.delete}
                            addEnabled={catchmentState.add}
                            toggleEditShape={toggleEditShape}
                            toggleAddShape={toggleAddShape}
                            toggleDeleteShape={toggleDeleteShape}
                            addShape={addShape}
                            color="secondary"
                            hasShape={Boolean(orgUnit.catchment)}
                            shapeKey="catchment"
                        />
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default EditOrgUnitOptionComponent;
