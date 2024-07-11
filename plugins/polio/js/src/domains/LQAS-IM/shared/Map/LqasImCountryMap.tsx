import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { GreyHashedPattern } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/HashedPatterns/GreyHashedPattern';
import { LegendItem, defaultShapeStyle } from '../../../../utils/index';
import { ScopeAndDNFDisclaimer } from './ScopeAndDNFDisclaimer';
import { HASHED_MAP_PATTERN } from '../constants';
import { makePopup } from './LqasImPopUp';
import { MapLegendContainer } from '../../../Campaigns/MapComponent/MapLegendContainer';
import { MapLegend } from '../../../Campaigns/MapComponent/MapLegend';
import { MapComponent } from '../../../Campaigns/MapComponent/MapComponent';

const getBackgroundLayerStyle = () => defaultShapeStyle;

type Props = {
    round: number;
    campaigns?: any[];
    selectedCampaign?: string;
    countryId?: number;
    data?: any;
    isFetchingGeoJson?: boolean;
    mainLayer: any;
    isFetching?: boolean;
    disclaimerData?: Record<string, unknown> | null | undefined;
    regionShapes: any;
    isFetchingRegions: boolean;
    name: string;
    title: string;
    legendItems: LegendItem[];
    // eslint-disable-next-line no-unused-vars
    getMainLayerStyles: (shape: any) => Record<string, any>;
};

export const LqasImCountryMap: FunctionComponent<Props> = ({
    title,
    name,
    legendItems,
    round,
    selectedCampaign,
    countryId = undefined,
    campaigns = [],
    data,
    isFetching = false,
    disclaimerData = {},
    isFetchingGeoJson = false,
    mainLayer,
    regionShapes,
    isFetchingRegions = false,
    getMainLayerStyles,
}) => {
    return (
        <Box position="relative">
            <MapLegendContainer>
                <MapLegend
                    title={title}
                    legendItems={legendItems}
                    width="lg"
                    name={name}
                />
            </MapLegendContainer>
            {/* Showing spinner on isFetching alone would make the map seem like it's loading before the user has chosen a country and campaign */}
            {(isFetching || isFetchingGeoJson || isFetchingRegions) && (
                <LoadingSpinner fixed={false} absolute />
            )}
            <MapComponent
                key={countryId}
                name={name}
                backgroundLayer={regionShapes}
                mainLayer={mainLayer}
                onSelectShape={() => null}
                getMainLayerStyle={getMainLayerStyles}
                getBackgroundLayerStyle={getBackgroundLayerStyle}
                tooltipLabels={{
                    main: 'District',
                    background: 'Region',
                }}
                makePopup={makePopup(data, round, selectedCampaign)}
                fitBoundsToBackground
                fitToBounds
                height={600}
                shapePatternIds={[HASHED_MAP_PATTERN]}
                shapePatterns={[GreyHashedPattern]}
            />
            {selectedCampaign && (
                <ScopeAndDNFDisclaimer
                    campaign={selectedCampaign}
                    data={
                        disclaimerData as Record<
                            string,
                            {
                                hasScope: boolean;
                                districtsNotFound: string[];
                            }
                        >
                    }
                    campaigns={campaigns}
                    round={round}
                />
            )}
        </Box>
    );
};
