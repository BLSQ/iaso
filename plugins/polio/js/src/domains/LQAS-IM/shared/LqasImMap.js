import React, { useCallback, useMemo } from 'react';
import { oneOf, string, array, number, bool, object } from 'prop-types';
import { Box } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { any } from 'lodash/fp';
import { MapComponent } from '../../Campaigns/MapComponent/MapComponent';
import { MapLegend } from '../../Campaigns/MapComponent/MapLegend';
import { MapLegendContainer } from '../../Campaigns/MapComponent/MapLegendContainer';
import { makePopup } from './LqasImPopUp';
import { makeImMapLegendItems, getLqasImMapLayer } from '../IM/utils.ts';
import { makeLqasMapLegendItems } from '../LQAS/utils.ts';
import { imDistrictColors } from './constants.ts';
import { lqasDistrictColors } from '../LQAS/constants.ts';
import { defaultShapeStyle } from '../../../utils/index';
import MESSAGES from '../../../constants/messages';
import { useGetGeoJson } from '../../Campaigns/Scope/hooks/useGetGeoJson.ts';
import { ScopeAndDNFDisclaimer } from './ScopeAndDNFDisclaimer.tsx';

const defaultShapes = [];

// eslint-disable-next-line no-unused-vars
const getBackgroundLayerStyle = _shape => defaultShapeStyle;

export const LqasImMap = ({
    type,
    round,
    selectedCampaign,
    countryId,
    campaigns,
    data,
    isFetching,
    disclaimerData,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: shapes = defaultShapes, isFetching: isFetchingGeoJson } =
        useGetGeoJson(countryId, 'DISTRICT');
    const {
        data: regionShapes = defaultShapes,
        isFetching: isFetchingRegions,
    } = useGetGeoJson(countryId, 'REGION');

    const legendItems = useMemo(() => {
        if (type === 'lqas') {
            return makeLqasMapLegendItems(formatMessage)(
                data,
                selectedCampaign,
                round,
            );
        }
        return makeImMapLegendItems(formatMessage)(
            data,
            selectedCampaign,
            round,
        );
    }, [data, selectedCampaign, round, formatMessage, type]);

    const mainLayer = useMemo(() => {
        return getLqasImMapLayer({
            data,
            selectedCampaign,
            type,
            campaigns,
            round,
            shapes,
        });
    }, [shapes, data, selectedCampaign, type, round, campaigns]);

    const getMainLayerStyles = useCallback(
        shape => {
            const districtColors =
                type === 'lqas' ? lqasDistrictColors : imDistrictColors;
            return districtColors[shape.status];
        },
        [type],
    );

    const title =
        type === 'lqas'
            ? formatMessage(MESSAGES.lqasResults)
            : formatMessage(MESSAGES.imResults);
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
                        type={type}
                        campaign={selectedCampaign}
                        countryId={countryId}
                        data={disclaimerData}
                        campaigns={campaigns}
                        round={round}
                    />
                )}
            </Box>
        </>
    );
};

LqasImMap.propTypes = {
    round: number.isRequired,
    campaigns: array,
    selectedCampaign: string,
    type: oneOf(['imGlobal', 'imOHH', 'imIHH', 'lqas']).isRequired,
    countryId: number,
    data: any,
    isFetching: bool,
    disclaimerData: object,
};
LqasImMap.defaultProps = {
    campaigns: [],
    selectedCampaign: '',
    countryId: null,
    data: undefined,
    isFetching: false,
    disclaimerData: {},
};
