import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { oneOf, string, array, number } from 'prop-types';
import { Box } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { MapComponent } from '../../components/MapComponent/MapComponent';
import { MapLegend } from '../../components/MapComponent/MapLegend';
import { MapLegendContainer } from '../../components/MapComponent/MapLegendContainer';
import { makePopup } from '../../utils/LqasIm.tsx';
import { LqasImMapHeader } from '../../components/LQAS-IM/LqasImMapHeader.tsx';
import { determineStatusForDistrict, makeImMapLegendItems } from './utils.ts';
import { districtColors } from './constants';
import { getScopeStyle, findDataForShape, findScope } from '../../utils/index';
import MESSAGES from '../../constants/messages';
import { useConvertedIMData } from './requests';
import { useGetGeoJson } from '../../hooks/useGetGeoJson';

export const ImMap = ({
    imType,
    round,
    selectedCampaign,
    countryId,
    campaigns,
}) => {
    const { formatMessage } = useSafeIntl();
    const [renderCount, setRenderCount] = useState(0);
    // HERE
    const { data: imData, isLoading } = useConvertedIMData(imType);
    const { data: shapes = [] } = useGetGeoJson(countryId, 'DISTRICT');

    const scope = findScope(selectedCampaign, campaigns, shapes);

    const legendItems = useMemo(
        () =>
            // HERE
            makeImMapLegendItems(formatMessage)(
                imData,
                selectedCampaign,
                round,
            ),
        [imData, selectedCampaign, round, formatMessage],
    );

    const getShapeStyles = useCallback(
        shape => {
            // HERE
            const status = determineStatusForDistrict(
                findDataForShape({
                    shape,
                    data: imData,
                    round,
                    campaign: selectedCampaign,
                }),
            );
            if (status) return districtColors[status];
            return getScopeStyle(shape, scope);
        },
        [scope, selectedCampaign, round, imData],
    );

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
                                // HERE
                                title={formatMessage(MESSAGES.imResults)}
                                legendItems={legendItems}
                                width="lg"
                            />
                        </MapLegendContainer>
                        <MapComponent
                            // Use the key to force render
                            key={`IMMapRound${round}${renderCount}`}
                            name={`IMMapRound${round}`}
                            mainLayer={shapes}
                            onSelectShape={() => null}
                            getMainLayerStyle={getShapeStyles}
                            tooltipLabels={{
                                main: 'District',
                                background: 'Region',
                            }}
                            makePopup={makePopup(
                                imData,
                                round,
                                selectedCampaign,
                            )}
                            height={600}
                        />
                    </Box>
                </>
            )}
        </>
    );
};

ImMap.propTypes = {
    round: oneOf(['round_1', 'round_2']).isRequired,
    campaigns: array,
    selectedCampaign: string,
    imType: oneOf(['imGlobal', 'imOHH', 'imIHH']).isRequired,
    countryId: number,
};
ImMap.defaultProps = {
    campaigns: [],
    selectedCampaign: '',
    countryId: null,
};
