import {
    LQAS_STRICT_PASS,
    LQAS_STRICT_FAIL,
    LQAS_LAX_PASS,
    LQAS_LAX_FAIL,
} from './constants';

import MESSAGES from '../../constants/messages';

export const convertLQASDataToArray = (LQASData, round) => {
    if (!LQASData) return [];
    const { stats } = LQASData;
    const campaignKeys = Object.keys(stats);
    const dataForRound = [];
    campaignKeys.forEach(key => {
        if (stats[key]) dataForRound.push({ ...stats[key][round] });
    });
    let results = [];
    dataForRound.forEach(districtData => {
        const keysForCampaign = Object.keys(districtData);
        const districtDataWithNames = Object.values(districtData).map(
            (value, index) => ({ ...value, name: keysForCampaign[index] }),
        );
        results = [
            ...results,
            // eslint-disable-next-line no-unused-vars
            ...keysForCampaign.map(_district => districtDataWithNames),
        ];
    });
    return results
        .reduce((uniqueValues, result) => {
            if (
                !uniqueValues.some(entry => entry.district === result.district)
            ) {
                uniqueValues.push(result);
            }
            return uniqueValues;
        }, [])
        .flat();
};

export const findLQASDataForShape = (shape, LQASData, round) => {
    if (!LQASData) return null;
    const dataForRound = convertLQASDataToArray(LQASData, round);
    const result = dataForRound.filter(data => data.district === shape.id)[0];
    return result;
};

const laxLQASPass = (checked, marked) => {
    return Math.floor(60 * (marked / checked)) >= 57;
};

export const determineStatusForDistrict = district => {
    if (!district) return null;
    const { total_child_fmd: marked, total_child_checked: checked } = district;
    if (checked === 60) {
        if (marked === 60) return LQAS_STRICT_PASS;
        return LQAS_STRICT_FAIL;
    }
    if (checked > 60) {
        if (laxLQASPass(checked, marked)) return LQAS_LAX_PASS;
        return LQAS_LAX_FAIL;
    }
    return LQAS_STRICT_FAIL;
};

export const makeCampaignsDropDown = campaigns =>
    campaigns.map(campaign => {
        return {
            label: campaign.obr_name,
            value: campaign.obr_name,
        };
    });
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
};

export const getBackgroundLayerStyle = () => {
    return defaultShapeStyle;
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

export const lqasTableColumns = formatMessage => {
    return [
        {
            Header: formatMessage(MESSAGES.districtName),
            accessor: 'name',
            sortable: true,
        },
        {
            Header: formatMessage(MESSAGES.districtId),
            accessor: 'district',
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
    ];
};

export const sortDistrictsByName = districts => {
    return districts.sort((districtA, districtB) =>
        districtA.name.localeCompare(districtB.name, undefined, {
            sensitivity: 'accent',
        }),
    );
};
