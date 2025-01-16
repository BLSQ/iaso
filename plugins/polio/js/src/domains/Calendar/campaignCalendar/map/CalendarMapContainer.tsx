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

import { ColorsHashedPattern } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/HashedPatterns/ColorsHashedPattern';
import { PaneWithPattern } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/PaneWithPattern/PaneWithPattern';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { HASHED_MAP_PATTERN_N_OPV2_B_OPV } from '../../../../constants/virus';
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
const ScopeHashedPattern = () => (
    <ColorsHashedPattern
        id={HASHED_MAP_PATTERN_N_OPV2_B_OPV}
        strokeColor="#00b0f0"
        fillColor="#ffff00"
    />
);
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

            <PaneWithPattern
                name="CalendarMap"
                patterns={[ScopeHashedPattern]}
                patternIds={[HASHED_MAP_PATTERN_N_OPV2_B_OPV]}
            >
                <>
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
            </PaneWithPattern>
        </>
    );
};
