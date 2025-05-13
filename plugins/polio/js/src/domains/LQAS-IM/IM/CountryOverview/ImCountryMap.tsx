import React, { FunctionComponent, useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { IMType } from '../../../../constants/types';
import { LqasImCountryMap } from '../../shared/Map/LqasImCountryMap';
import { imDistrictColors } from '../constants';
import { makeImMapLegendItems } from '../utils';

const getMainLayerStyles = shape => {
    return imDistrictColors[shape.status];
};

type Props = {
    round?: number;
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
        <LqasImCountryMap
            key={countryId}
            name={`IMMap${round}-${type}-${countryId}`}
            regionShapes={regionShapes}
            mainLayer={mainLayer}
            round={round}
            data={data}
            selectedCampaign={selectedCampaign}
            isFetchingRegions={isFetchingRegions}
            title={title}
            legendItems={legendItems}
            campaigns={campaigns}
            isFetching={isFetching}
            isFetchingGeoJson={isFetchingGeoJson}
            disclaimerData={disclaimerData}
            getMainLayerStyles={getMainLayerStyles}
        />
    );
};
