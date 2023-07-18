import React, { useCallback, useMemo } from 'react';
import { oneOf, string, array, number, bool, object } from 'prop-types';
import { Box } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { isEqual } from 'lodash';
import { any } from 'lodash/fp';
import { MapComponent } from '../MapComponent/MapComponent';
import { MapLegend } from '../MapComponent/MapLegend';
import { MapLegendContainer } from '../MapComponent/MapLegendContainer';
import { makePopup } from './LqasImPopUp';
import {
    determineStatusForDistrict as imDistrictStatus,
    makeImMapLegendItems,
} from '../../pages/IM/utils.ts';
import {
    determineStatusForDistrict as lqasDistrictStatus,
    makeLqasMapLegendItems,
} from '../../pages/LQAS/utils.ts';
import {
    imDistrictColors,
    lqasDistrictColors,
    IN_SCOPE,
} from '../../pages/IM/constants.ts';
import {
    findDataForShape,
    findScopeIds,
    defaultShapeStyle,
} from '../../utils/index';
import MESSAGES from '../../constants/messages';
import { useGetGeoJson } from '../../hooks/useGetGeoJson.ts';
import { ScopeAndDNFDisclaimer } from './ScopeAndDNFDisclaimer.tsx';

const defaultShapes = [];

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
        if (isEqual(data, {})) return [];
        if (!selectedCampaign) return [];
        const determineStatusForDistrict =
            type === 'lqas' ? lqasDistrictStatus : imDistrictStatus;
        const scopeIds = findScopeIds(selectedCampaign, campaigns, round);
        const hasScope = scopeIds.length > 0;
        const shapesInScope = hasScope
            ? shapes.filter(shape => scopeIds.includes(shape.id))
            : shapes;
        const shapesWithData = shapesInScope.map(shape => ({
            ...shape,
            data: findDataForShape({
                shape,
                data,
                round,
                campaign: selectedCampaign,
            }),
        }));
        if (hasScope) {
            return shapesWithData.map(shape => ({
                ...shape,
                status: shape.data
                    ? determineStatusForDistrict(shape.data)
                    : IN_SCOPE,
            }));
        }
        return shapesWithData
            .filter(shape => Boolean(shape.data))
            .map(shape => ({
                ...shape,
                status: determineStatusForDistrict(shape.data),
            }));
    }, [shapes, data, selectedCampaign, type, round, campaigns]);

    const getMainLayerStyles = useCallback(
        shape => {
            const districtColors =
                type === 'lqas' ? lqasDistrictColors : imDistrictColors;
            return districtColors[shape.status];
        },
        [type],
    );

    // eslint-disable-next-line no-unused-vars
    const getBackgroundLayerStyle = _shape => defaultShapeStyle;

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
                    name={`LQASIMMap${round}-${type}`}
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
                    height={600}
                />
                {selectedCampaign && (
                    <ScopeAndDNFDisclaimer
                        type={type}
                        campaign={selectedCampaign}
                        countryId={countryId}
                        data={disclaimerData}
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
