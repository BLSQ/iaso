import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import { GreyHashedPattern } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/HashedPatterns/GreyHashedPattern';
import { ConvertedLqasImData } from '../../../../constants/types';
import { LegendItem, defaultShapeStyle } from '../../../../utils/index';
import { MapComponent } from '../../../Campaigns/MapComponent/MapComponent';
import { MapLegend } from '../../../Campaigns/MapComponent/MapLegend';
import { MapLegendContainer } from '../../../Campaigns/MapComponent/MapLegendContainer';
import { LqasImMapLayer } from '../../IM/utils';
import { HASHED_MAP_PATTERN } from '../constants';
import { makePopup } from './LqasImPopUp';
import { ScopeAndDNFDisclaimer } from './ScopeAndDNFDisclaimer';

const getBackgroundLayerStyle = () => defaultShapeStyle;

type Props = {
    round: number | undefined;
    campaigns?: any[];
    selectedCampaign?: string;
    countryId?: number;
    data: Record<string, ConvertedLqasImData>;
    isFetchingGeoJson?: boolean;
    mainLayer: LqasImMapLayer[];
    isFetching?: boolean;
    disclaimerData?: Record<string, unknown> | null | undefined;
    regionShapes: any;
    isFetchingRegions: boolean;
    name: string;
    title: string;
    legendItems: LegendItem[];
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
