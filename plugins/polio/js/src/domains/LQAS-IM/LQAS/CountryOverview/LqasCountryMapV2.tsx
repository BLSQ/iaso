import React, { FunctionComponent, useMemo } from 'react';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { Campaign, Side } from '../../../../constants/types';
import {
    ConvertedLqasImData,
    LqasImMapLayer,
    MapColorConfig,
} from '../../types';
import { lqasDistrictColors } from '../constants';
import { makeLqasMapLegendItems } from '../utils';
import { Box } from '@mui/material';
import { MapLegendContainer } from '../../../Campaigns/MapComponent/MapLegendContainer';
import { MapLegend } from '../../../Campaigns/MapComponent/MapLegend';
import { MapComponent } from '../../../Campaigns/MapComponent/MapComponent';
import { ScopeAndDNFDisclaimer } from '../../shared/Map/ScopeAndDNFDisclaimer';
import { defaultShapeStyle } from '../../../../utils';
import { HASHED_MAP_PATTERN } from '../../shared/constants';
import { GreyHashedPattern } from 'Iaso/components/maps/HashedPatterns/GreyHashedPattern';
import { makePopup } from '../../shared/Map/LqasImPopUp';
import { findScopeIdsForRound } from './utils';

const getMainLayerStyles = (shape: LqasImMapLayer): MapColorConfig => {
    return lqasDistrictColors[shape.status];
};

const getBackgroundLayerStyle = () => defaultShapeStyle;

type Props = {
    roundNumber?: number;
    campaign?: Campaign;
    countryId?: number;
    data: Record<string, ConvertedLqasImData>;
    isFetchingGeoJson?: boolean;
    mainLayer: LqasImMapLayer[];
    isFetching?: boolean;
    disclaimerData?: Record<string, unknown> | null | undefined;
    regionShapes: any;
    isFetchingRegions: boolean;
    side: Side;
};

export const LqasCountryMapV2: FunctionComponent<Props> = ({
    roundNumber,
    side,
    campaign,
    countryId,
    data,
    isFetching,
    disclaimerData = {},
    isFetchingGeoJson,
    mainLayer,
    regionShapes,
    isFetchingRegions,
}) => {
    const { formatMessage } = useSafeIntl();

    const legendItems = useMemo(() => {
        return makeLqasMapLegendItems(formatMessage)(
            data,
            campaign?.obr_name,
            roundNumber,
        );
    }, [data, campaign?.obr_name, roundNumber, formatMessage]);
    const scopeIds = useMemo(() => {
        if (!campaign) return [];
        return findScopeIdsForRound({
            campaign,
            roundNumber,
        });
    }, [campaign, roundNumber]);
    const title = formatMessage(MESSAGES.lqasResults);
    const name = `LQASIMMap${roundNumber}-LQAS-${countryId}-${side}-${campaign?.obr_name}`;
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
                makePopup={makePopup(
                    data,
                    roundNumber,
                    campaign?.obr_name ?? '',
                )}
                fitBoundsToBackground
                fitToBounds
                height={600}
                shapePatternIds={[HASHED_MAP_PATTERN]}
                shapePatterns={[GreyHashedPattern]}
            />
            {campaign && (
                <ScopeAndDNFDisclaimer
                    campaign={campaign?.obr_name}
                    data={
                        disclaimerData as Record<
                            string,
                            {
                                hasScope: boolean;
                                districtsNotFound: string[];
                            }
                        >
                    }
                    round={roundNumber}
                    scopeIds={scopeIds}
                />
            )}
        </Box>
    );
};
