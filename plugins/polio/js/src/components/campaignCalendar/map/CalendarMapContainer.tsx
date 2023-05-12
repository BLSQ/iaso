import React, {
    FunctionComponent,
    Dispatch,
    SetStateAction,
    useState,
} from 'react';
import { useMapEvent } from 'react-leaflet';
import { LoadingSpinner } from 'bluesquare-components';
import { Box } from '@material-ui/core';

import { useStyles } from '../Styles';
import 'leaflet/dist/leaflet.css';
import { CalendarMapPanesRegular } from './CalendarMapPanesRegular';
import { CalendarMapPanesMerged } from './CalendarMapPanesMerged';
import { CampaignsLegend } from './CampaignsLegend';
import { MappedCampaign, MergedShapeWithColor } from '../types';
import { boundariesZoomLimit } from './constants';
import { VaccinesLegend } from './VaccinesLegend';

import { MapRoundSelector } from './MapRoundSelector';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';

type Props = {
    campaignsShapes: any[];
    mergedShapes: MergedShapeWithColor[];
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
