import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { oneOf, string, array, number } from 'prop-types';
import { Box } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { MapComponent } from '../MapComponent/MapComponent';
import { MapLegend } from '../MapComponent/MapLegend';
import { MapLegendContainer } from '../MapComponent/MapLegendContainer';
import { makePopup, makeAccordionData } from '../../utils/LqasIm.tsx';
import { LqasImMapHeader } from './LqasImMapHeader.tsx';
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
} from '../../pages/IM/constants.ts';
import { getScopeStyle, findDataForShape, findScope } from '../../utils/index';
import MESSAGES from '../../constants/messages';
import { useConvertedLqasImData } from '../../pages/IM/requests';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';
import { AccordionMapLegend } from '../MapComponent/AccordionMapLegend.tsx';

export const LqasImMap = ({
    type,
    round,
    selectedCampaign,
    countryId,
    campaigns,
}) => {
    const { formatMessage } = useSafeIntl();
    const [renderCount, setRenderCount] = useState(0);
    const { data, isLoading } = useConvertedLqasImData(type);
    const { data: shapes = [] } = useGetGeoJson(countryId, 'DISTRICT');

    const scope = findScope(selectedCampaign, campaigns, shapes);

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

    const accordionItems = useMemo(() => {
        return makeAccordionData({
            type,
            data,
            round,
            campaign: selectedCampaign,
        });
    }, [data, type, round, selectedCampaign]);

    const getShapeStyles = useCallback(
        shape => {
            const determineStatusForDistrict =
                type === 'lqas' ? lqasDistrictStatus : imDistrictStatus;
            const status = determineStatusForDistrict(
                findDataForShape({
                    shape,
                    data,
                    round,
                    campaign: selectedCampaign,
                }),
            );
            const districtColors =
                type === 'lqas' ? lqasDistrictColors : imDistrictColors;
            if (status) return districtColors[status];
            return getScopeStyle(shape, scope);
        },
        [type, scope, selectedCampaign, round, data],
    );
    const title =
        type === 'lqas'
            ? formatMessage(MESSAGES.lqasResults)
            : formatMessage(MESSAGES.imResults);

    // force Map render when campaign changes, otherwise, shape colors are off
    useEffect(() => {
        setRenderCount(count => count + 1);
    }, [selectedCampaign]);

    return (
        <>
            {isLoading && <LoadingSpinner />}
            {!isLoading && (
                <>
                    <LqasImMapHeader round={round} />
                    <Box position="relative">
                        <MapLegendContainer>
                            <MapLegend
                                title={title}
                                legendItems={legendItems}
                                width="lg"
                            />
                            {type !== 'lqas' && (
                                <AccordionMapLegend
                                    title={MESSAGES.collectionStats}
                                    noDataMsg={MESSAGES.noDataFound}
                                    data={accordionItems}
                                    defaultExpanded
                                    width="lg"
                                />
                            )}
                        </MapLegendContainer>
                        <MapComponent
                            // Use the key to force render
                            key={`LQASIMMap${round}${renderCount}-${type}`}
                            name={`LQASIMMap${round}-${type}`}
                            mainLayer={shapes}
                            onSelectShape={() => null}
                            getMainLayerStyle={getShapeStyles}
                            tooltipLabels={{
                                main: 'District',
                                background: 'Region',
                            }}
                            makePopup={makePopup(data, round, selectedCampaign)}
                            height={600}
                        />
                    </Box>
                </>
            )}
        </>
    );
};

LqasImMap.propTypes = {
    round: oneOf(['round_1', 'round_2']).isRequired,
    campaigns: array,
    selectedCampaign: string,
    type: oneOf(['imGlobal', 'imOHH', 'imIHH', 'lqas']).isRequired,
    countryId: number,
};
LqasImMap.defaultProps = {
    campaigns: [],
    selectedCampaign: '',
    countryId: null,
};
