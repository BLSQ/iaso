const convertRoundDataToArray = roundDataAsDict => {
    const districtNames = Object.keys(roundDataAsDict);
    const roundData = Object.values(roundDataAsDict);
    return roundData.map((value, index) => {
        return { ...value, name: districtNames[index] };
    });
};

export const convertAPIData = data => {
    if (!data) return {};
    const { stats } = data;
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

export const findDataForShape = ({ shape, data, round, campaign }) => {
    if (!data || !data[campaign]) return null;
    const dataForRound = data[campaign][round];
    const result = dataForRound.filter(d => d.district === shape.id)[0];
    return result;
};

// TODO have exhaustive sorting function
const sortCampaignNames = (nameA, nameB) => {
    const [countryCodeA, referenceA] = nameA?.label.split('-');
    const [countryCodeB, referenceB] = nameB?.label.split('-');
    const comparison = countryCodeA.localeCompare(countryCodeB, undefined, {
        sensitivity: 'accent',
    });
    if (comparison === 0) {
        const refA = parseInt(referenceA, 10);
        const refB = parseInt(referenceB, 10);
        if (refA < refB) return -1;
        if (refA > refB) return 1;
        return 0;
    }
    return comparison;
};
export const makeCampaignsDropDown = campaigns =>
    campaigns
        .map(campaign => {
            return {
                label: campaign.obr_name,
                value: campaign.obr_name,
            };
        })
        .sort(sortCampaignNames);

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

export const sortDistrictsByName = districts => {
    return districts.sort((districtA, districtB) =>
        districtA.name.localeCompare(districtB.name, undefined, {
            sensitivity: 'accent',
        }),
    );
};

export const findCountryIds = LqasData => {
    const { stats } = LqasData;
    const campaignKeys = Object.keys(stats);
    return campaignKeys.map(campaignKey => stats[campaignKey].country_id);
};

export const makeLegendItem = ({ message, value, color }) => {
    return {
        label: `${message}: ${value}`,
        value: `${message}: ${value}`,
        color,
    };
};
