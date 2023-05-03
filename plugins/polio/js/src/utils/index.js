import { accessArrayRound } from './LqasIm.tsx';

export const findDataForShape = ({ shape, data, round, campaign }) => {
    if (!data || !data[campaign]) return null;
    const dataForRound = accessArrayRound(data[campaign], round);
    const result = dataForRound.filter(d => d.district === shape.id)[0];
    return result;
};

// TODO have exhaustive sorting function
export const sortCampaignNames = (nameA, nameB) => {
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
        ?.map(campaign => {
            return {
                label: campaign.obr_name,
                value: campaign.obr_name,
            };
        })
        .sort(sortCampaignNames);

export const makeCampaignsDropDownWithUUID = campaigns => {
    return (
        campaigns
            ?.map(campaign => {
                return {
                    label: campaign.obr_name,
                    value: campaign.id,
                };
            })
            .sort(sortCampaignNames) ?? []
    );
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

export const findScopeIds = (obrName, campaigns, currentRound) => {
    let scopeIds = obrName
        ? campaigns.filter(campaign => campaign.obr_name === obrName)
        : campaigns;

    scopeIds = scopeIds
        .map(campaign => {
            if (!campaign.separate_scopes_per_round) {
                return campaign.scopes
                    .filter(scope => scope.group)
                    .map(scope => scope.group.org_units)
                    .flat();
            }
            const fullRound = campaign.rounds.find(
                round => round.number === currentRound,
            );
            if (fullRound) {
                return fullRound.scopes
                    .filter(scope => scope.group)
                    .map(scope => scope.group.org_units)
                    .flat();
            }
            return [];
        })
        .flat();
    return scopeIds;
};

export const makeLegendItem = ({ message, value, color }) => {
    return {
        label: `${message}: ${value}`,
        value: `${message}: ${value}`,
        color,
    };
};

export const convertWidth = width => {
    if (width === 'xs') return '100px';
    if (width === 'sm') return '120px';
    if (width === 'md') return '150px';
    if (width === 'lg') return '180px';
    if (width === 'xl') return '200px';
    return '100px';
};

export const floatToPercentString = (num = 0) => {
    if (Number.isSafeInteger(num)) return `${parseInt(num, 10)}%`;
    return `${Math.round(num)}%`;
};

// this is a duplicate of Iaso to avoid import conflicts
export const convertObjectToString = value =>
    Object.entries(value)
        .map(([key, entry]) => `${key}-${String(entry)}`)
        .toString();

export const findCampaignRound = (campaign, round) => {
    return campaign.rounds.find(rnd => rnd.number === round);
};

export const isTouched = touched => {
    const keys = Object.keys(touched ?? {});

    for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (typeof touched[key] === 'boolean' && touched[key] === true) {
            return true;
        }
        if (typeof touched[key] === 'object' && !Array.isArray(touched[key])) {
            return isTouched(touched[key]);
        }
        if (typeof touched[key] === 'object' && Array.isArray(touched[key])) {
            return Boolean(
                touched[key].find(touchedKey => isTouched(touchedKey)),
            );
        }
    }
    return false;
};
