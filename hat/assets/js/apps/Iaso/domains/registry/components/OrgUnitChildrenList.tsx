import React, {
    FunctionComponent,
    useState,
    useRef,
    useCallback,
    useMemo,
    useEffect,
} from 'react';
import {
    Map,
    TileLayer,
    GeoJSON,
    Pane,
    ScaleControl,
    Tooltip,
} from 'react-leaflet';
import { useSafeIntl } from 'bluesquare-components';
import { Box, useTheme } from '@material-ui/core';

import { TilesSwitch, Tile } from '../../../components/maps/tools/TileSwitch';
import { MapLegend, Legend } from '../../../components/maps/MapLegend';
import CircleMarkerComponent from '../../../components/maps/markers/CircleMarkerComponent';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
    childrenOrgUnits: OrgUnit[];
};

export const OrgUnitChildrenList: FunctionComponent<Props> = ({
    orgUnit,
    subOrgUnitTypes,
    childrenOrgUnits,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Box position="relative" height={500}>
            TABLE HERE
        </Box>
    );
};
