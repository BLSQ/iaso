import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { MapComponent } from '../../../Campaigns/MapComponent/MapComponent.js';
import { MapLegend } from '../../../Campaigns/MapComponent/MapLegend.js';
import { MapLegendContainer } from '../../../Campaigns/MapComponent/MapLegendContainer.js';
import { makePopup } from '../../shared/LqasImPopUp.js';
import { makeImMapLegendItems } from '../utils';
import { defaultShapeStyle } from '../../../../utils/index';
import MESSAGES from '../../../../constants/messages';
import { ScopeAndDNFDisclaimer } from '../../shared/ScopeAndDNFDisclaimer';
import { IMType } from '../../../../constants/types';
import { imDistrictColors } from '../constants';
import { GreyHashedPattern } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/HashedPatterns/GreyHashedPattern';
import { HASHED_MAP_PATTERN } from '../../shared/constants';

// eslint-disable-next-line no-unused-vars
const getBackgroundLayerStyle = _shape => defaultShapeStyle;

const getMainLayerStyles = shape => {
    return imDistrictColors[shape.status];
};

type Props = {
    round: number;
    campaigns?: any[];
    selectedCampaign?: string;
    type: IMType;
    countryId?: number;
    data?: any;
    isFetchingGeoJson?: boolean;
    mainLayer: any;
    isFetching?: boolean;
    disclaimerData?: Record<string, unknown> | null | undefined;
    regionShapes: any;
    isFetchingRegions?: boolean;
};

export const ImCountryMap: FunctionComponent<Props> = ({
    type,
    round,
    selectedCampaign,
    countryId = undefined,
    campaigns,
    data,
    isFetching = false,
    disclaimerData = {},
    mainLayer,
    regionShapes,
    isFetchingGeoJson = false,
    isFetchingRegions = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const legendItems = useMemo(() => {
        return makeImMapLegendItems(formatMessage)(
            data,
            selectedCampaign,
            round,
        );
    }, [data, selectedCampaign, round, formatMessage]);

    const title = formatMessage(MESSAGES.imResults);
    return (
        <Box position="relative">
            <MapLegendContainer>
                <MapLegend title={title} legendItems={legendItems} width="lg" />
            </MapLegendContainer>
            {/* Showing spinner on isFetching alone would make the map seem like it's loading before the user has chosen a country and campaign */}
            {(isFetching || isFetchingGeoJson || isFetchingRegions) && (
                <LoadingSpinner fixed={false} absolute />
            )}
            <MapComponent
                key={countryId}
                name={`IMMap${round}-${type}-${countryId}`}
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
