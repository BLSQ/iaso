import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { defaultShapeStyle } from '../../../../utils/index';
import { LQASIMType } from '../../shared/types/types';
import { ScopeAndDNFDisclaimer } from '../../shared/ScopeAndDNFDisclaimer';
import MESSAGES from '../../../../constants/messages';
import { makeLqasMapLegendItems } from '../utils';
import { lqasDistrictColors } from '../constants';
import { makePopup } from '../../shared/LqasImPopUp';
import { MapLegendContainer } from '../../../Campaigns/MapComponent/MapLegendContainer';
import { MapLegend } from '../../../Campaigns/MapComponent/MapLegend';
import { MapComponent } from '../../../Campaigns/MapComponent/MapComponent';

// eslint-disable-next-line no-unused-vars
const getBackgroundLayerStyle = _shape => defaultShapeStyle;

type Props = {
    round: number;
    campaigns?: any[];
    selectedCampaign?: string;
    type: LQASIMType;
    countryId?: number;
    data?: any;
    isFetchingGeoJson?: boolean;
    mainLayer: any;
    isFetching?: boolean;
    disclaimerData?: Record<string, unknown> | null | undefined;
    regionShapes: any;
    isFetchingRegions: boolean;
};

export const LqasCountryMap: FunctionComponent<Props> = ({
    type,
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
}) => {
    const { formatMessage } = useSafeIntl();

    const legendItems = useMemo(() => {
        return makeLqasMapLegendItems(formatMessage)(
            data,
            selectedCampaign,
            round,
        );
    }, [data, selectedCampaign, round, formatMessage]);

    const getMainLayerStyles = shape => {
        return lqasDistrictColors[shape.status];
    };

    const title = formatMessage(MESSAGES.lqasResults);

    return (
        <>
            <Box position="relative">
                <MapLegendContainer>
                    <MapLegend
                        title={title}
                        legendItems={legendItems}
                        width="lg"
                    />
                </MapLegendContainer>
                {/* Showing spinner on isFetching alone would make the map seem like it's loading before the user has chosen a country and campaign */}
                {(isFetching || isFetchingGeoJson || isFetchingRegions) && (
                    <LoadingSpinner fixed={false} absolute />
                )}
                <MapComponent
                    key={countryId}
                    name={`LQASIMMap${round}-${type}-${countryId}`}
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
        </>
    );
};
