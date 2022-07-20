/* eslint-disable react/require-default-props */
import React, { FunctionComponent, useCallback } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { Box, Divider, Paper } from '@material-ui/core';
import { GraphTitle } from '../../../components/LQAS-IM/GraphTitle';
import { useGetCampaignScope } from '../../../hooks/useGetCampaignScope';
import { useGetGeoJson } from '../../../hooks/useGetGeoJson';
import MESSAGES from '../../../constants/messages';
import { MapComponent } from '../../../components/MapComponent/MapComponent';

type Props = {
    country: string;
    campaignId: string;
};
const selectedPathOptions = {
    color: 'lime',
    weight: '1',
    opacity: '1',
    zIndex: '1',
};
const unselectedPathOptions = {
    color: 'gray',
    weight: '1',
    opacity: '1',
    zIndex: '1',
};
const getBackgroundLayerStyle = () => {
    return {
        color: 'grey',
        opacity: '1',
        fillColor: 'transparent',
    };
};

export const BudgetMap: FunctionComponent<Props> = ({
    country,
    campaignId,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: districtShapes, isFetching: isFetchingDistricts } =
        useGetGeoJson(country, 'DISTRICT');

    const { data: regionShapes, isFetching: isFetchingRegions } = useGetGeoJson(
        country,
        'REGION',
    );

    const { data: scope, isFetching: isFetchingScope } = useGetCampaignScope({
        country: parseInt(country, 10),
        campaignId,
    });
    const getShapeStyle = useCallback(
        shape => {
            if (scope.includes(shape.id)) return selectedPathOptions;
            return unselectedPathOptions;
        },
        [scope],
    );

    return (
        <Paper>
            <Box ml={2} pt={2} mr={2} pb={2}>
                <GraphTitle
                    text={formatMessage(MESSAGES.scope)}
                    displayTrigger
                />
                <Box mt={2} mb={1}>
                    <Divider />
                </Box>
                {(isFetchingRegions ||
                    isFetchingDistricts ||
                    isFetchingScope) && <LoadingSpinner fixed={false} />}
                {!isFetchingRegions &&
                    !isFetchingDistricts &&
                    !isFetchingScope && (
                        <MapComponent
                            name="BudgetScopeMap"
                            mainLayer={districtShapes}
                            backgroundLayer={regionShapes}
                            onSelectShape={() => null}
                            getMainLayerStyle={getShapeStyle}
                            getBackgroundLayerStyle={getBackgroundLayerStyle}
                            tooltipLabels={{
                                main: 'District',
                                background: 'Region',
                            }}
                        />
                    )}
            </Box>
        </Paper>
    );
};
