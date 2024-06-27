import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useState,
} from 'react';
import { useMapEvent } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import { useStyles } from '../Styles';
import {
    MappedCampaign,
    MergedShapeWithCacheDate,
    ShapeForCalendarMap,
} from '../types';
import { CalendarMapPanesMerged } from './CalendarMapPanesMerged';
import { CalendarMapPanesRegular } from './CalendarMapPanesRegular';
import { CampaignsLegend } from './CampaignsLegend';
import { VaccinesLegend } from './VaccinesLegend';
import { boundariesZoomLimit } from './constants';

import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { MapRoundSelector } from './MapRoundSelector';

type Props = {
    campaignsShapes: ShapeForCalendarMap[];
    mergedShapes: MergedShapeWithCacheDate[];
    loadingCampaigns: boolean;
    isLoadingMergedShapes: boolean;
    isLoadingShapes: boolean;
    setSelection: Dispatch<SetStateAction<'all' | 'latest' | string>>;
    selection: 'all' | 'latest' | string;
    options: DropdownOptions<string>[];
    campaigns: MappedCampaign[];
};

export const CalendarMapContainer: FunctionComponent<Props> = ({
    campaignsShapes,
    mergedShapes,
    loadingCampaigns,
    isLoadingMergedShapes,
    isLoadingShapes,
    setSelection,
    selection,
    options,
    campaigns,
}) => {
    const classes = useStyles();
    const map = useMapEvent('zoomend', () => {
        setZoom(map.getZoom());
    });
    const [zoom, setZoom] = useState<number>(map.getZoom());
    const loadingShapes = zoom <= 6 ? isLoadingMergedShapes : isLoadingShapes;
    return (
        <>
            {(loadingCampaigns || loadingShapes) && <LoadingSpinner absolute />}

            <div className={classes.mapLegend}>
                <MapRoundSelector
                    selection={selection}
                    options={options}
                    onChange={value => {
                        setSelection(value);
                    }}
                    iconProps={{ selection, zoom }}
                />
                {zoom > boundariesZoomLimit && (
                    <Box mt={2}>
                        <CampaignsLegend campaigns={campaigns} />
                    </Box>
                )}
                <Box display="flex" justifyContent="flex-end">
                    <VaccinesLegend />
                </Box>
            </div>
            {zoom > 6 && (
                <CalendarMapPanesRegular
                    campaignsShapes={campaignsShapes}
                    zoom={zoom}
                />
            )}
            {zoom <= 6 && (
                <CalendarMapPanesMerged
                    mergedShapes={mergedShapes}
                    zoom={zoom}
                />
            )}
        </>
    );
};
