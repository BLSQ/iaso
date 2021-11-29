import React from 'react';
import CheckIcon from '@material-ui/icons/Check';
import { Box } from '@material-ui/core';
import { LQAS_PASS, LQAS_FAIL, LQAS_DISQUALIFIED } from './constants';

import MESSAGES from '../../constants/messages';

const convertRoundDataToArray = roundDataAsDict => {
    const districtNames = Object.keys(roundDataAsDict);
    const roundData = Object.values(roundDataAsDict);
    return roundData.map((value, index) => {
        return { ...value, name: districtNames[index] };
    });
};

// TODO rename
export const convertLQASData = LQASData => {
    if (!LQASData) return {};
    const { stats } = LQASData;
    const campaignKeys = Object.keys(stats);
    const result = {};
    campaignKeys.forEach(key => {
        if (stats[key]) {
            result[key] = {};
            result[key].round_1 = convertRoundDataToArray(stats[key].round_1);
            result[key].round_2 = convertRoundDataToArray(stats[key].round_2);
        }
    });
    return result;
};

export const findLQASDataForShape = ({ shape, LQASData, round, campaign }) => {
    if (!LQASData || !LQASData[campaign]) return null;
    const dataForRound = LQASData[campaign][round];
    const result = dataForRound.filter(data => data.district === shape.id)[0];
    return result;
};

export const findLQASDataForDistrict = ({
    district,
    LQASData,
    round,
    campaign,
}) => {
    if (!LQASData) return null;
    const dataForRound = LQASData[campaign][round];
    const result = dataForRound.filter(
        data => data.district === district.district,
    );
    return result[0];
};

export const determineStatusForDistrict = district => {
    if (!district) return null;
    const { total_child_fmd: marked, total_child_checked: checked } = district;
    // console.log('district', district, checked, marked, marked > 56);

    if (checked === 60) {
        if (marked > 56) {
            return LQAS_PASS;
        }
        return LQAS_FAIL;
    }
    return LQAS_DISQUALIFIED;
};

export const makeCampaignsDropDown = campaigns =>
    campaigns
        .map(campaign => {
            return {
                label: campaign.obr_name,
                value: campaign.obr_name,
            };
        })
        .sort((a, b) =>
            a.label.localeCompare(b.label, undefined, {
                sensitivity: 'accent',
            }),
        );
export const totalDistrictsEvaluatedPerRound = LQASData => {
    if (!LQASData) return { evaluatedRound1: [], evaluatedRound2: [] };
    let totalEvaluatedRound1 = [];
    let totalEvaluatedRound2 = [];
    Object.keys(LQASData.stats).forEach(campaignKey => {
        const districtsRound1 = Object.keys(
            LQASData.stats[campaignKey].round_1,
        );
        const districtsRound2 = Object.keys(
            LQASData.stats[campaignKey].round_2,
        );
        totalEvaluatedRound1 = [...totalEvaluatedRound1, ...districtsRound1];
        totalEvaluatedRound2 = [...totalEvaluatedRound2, ...districtsRound2];
    });

    const evaluatedRound1 = new Set(totalEvaluatedRound1);
    const evaluatedRound2 = new Set(totalEvaluatedRound2);
    return { evaluatedRound1, evaluatedRound2 };
};

export const defaultShapeStyle = {
    color: 'grey',
    opacity: '1',
    fillColor: 'lightGrey',
    weight: '1',
    zIndex: 1,
};

export const getScopeStyle = (shape, scope) => {
    const isShapeInScope =
        scope.filter(shapeInScope => shape.id === shapeInScope.id).length === 1;
    if (isShapeInScope) {
        return {
            color: 'grey',
            opacity: '1',
            fillColor: 'grey',
            weight: '2',
            zIndex: 1,
        };
    }
    return defaultShapeStyle;
};

export const findScope = (obrName, campaigns, shapes) => {
    let scopeIds = [];
    if (obrName) {
        scopeIds = campaigns
            .filter(campaign => campaign.obr_name === obrName)
            .map(campaign => campaign.group.org_units)
            .flat();
    } else {
        scopeIds = campaigns.map(campaign => campaign.group.org_units).flat();
    }
    return shapes.filter(shape => scopeIds.includes(shape.id));
};

const applyStatusColor = status => {
    if (status === LQAS_PASS) return { color: 'green' };
    if (status === LQAS_FAIL) return { color: 'red' };
    if (status === LQAS_DISQUALIFIED) return { color: 'orange' };
    return null;
};

export const lqasTableColumns = formatMessage => {
    return [
        {
            Header: formatMessage(MESSAGES.districtName),
            accessor: 'name',
            sortable: true,
        },
        {
            Header: formatMessage(MESSAGES.childrenMarked),
            accessor: 'total_child_fmd',
            sortable: false,
        },
        {
            Header: formatMessage(MESSAGES.childrenChecked),
            accessor: 'total_child_checked',
            sortable: false,
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'status',
            sortable: false,
            Cell: settings => (
                <span style={applyStatusColor(settings.row.original.status)}>
                    {formatMessage(MESSAGES[settings.row.original.status])}
                </span>
            ),
        },
        {
            Header: formatMessage(MESSAGES.districtFound),
            accessor: 'district',
            sortable: true,
            Cell: settings => {
                if (settings.row.original.district)
                    return (
                        <Box>
                            <CheckIcon />
                        </Box>
                    );
                return null;
            },
        },
    ];
};

export const sortDistrictsByName = districts => {
    return districts.sort((districtA, districtB) =>
        districtA.name.localeCompare(districtB.name, undefined, {
            sensitivity: 'accent',
        }),
    );
};

export const getLqasStatsForRound = (lqasData, campaign, round) => {
    if (!lqasData[campaign]) return [[], [], [], []];
    const totalEvaluated = [...lqasData[campaign][round]];
    const allStatuses = totalEvaluated.map(district => {
        return determineStatusForDistrict(district);
    });
    const passed = allStatuses.filter(status => status === LQAS_PASS);
    const disqualified = allStatuses.filter(
        status => status === LQAS_DISQUALIFIED,
    );
    const failed = allStatuses.filter(status => status === LQAS_FAIL);

    return [totalEvaluated, passed, failed, disqualified];
};

export const findCountryIds = LqasData => {
    const { stats } = LqasData;
    const campaignKeys = Object.keys(stats);
    return campaignKeys.map(campaignKey => stats[campaignKey].country_id);
};
