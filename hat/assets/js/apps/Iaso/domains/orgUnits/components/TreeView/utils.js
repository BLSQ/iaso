import React from 'react';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import FlareIcon from '@material-ui/icons/Flare';
import { getOrgUnitAncestors } from '../../utils';
import OrgUnitTooltip from '../OrgUnitTooltip';

const formatInitialSelectedIds = orgUnits => {
    if (!orgUnits) return [];
    if (!Array.isArray(orgUnits)) return orgUnits.id.toString();
    return orgUnits.map(orgUnit => orgUnit.id.toString());
};
const formatInitialSelectedParents = orgUnits => {
    const parents = new Map();
    if (!orgUnits) return parents;
    if (!Array.isArray(orgUnits)) {
        parents.set(orgUnits.id.toString(), getOrgUnitAncestors(orgUnits));
    }
    if (Array.isArray(orgUnits)) {
        orgUnits.forEach(orgUnit => {
            parents.set(orgUnit.id.toString(), getOrgUnitAncestors(orgUnit));
        });
    }
    return parents;
};

const tooltip = (orgUnit, icon) => (
    <OrgUnitTooltip orgUnit={orgUnit} enterDelay={0} enterNextDelay={0}>
        {icon}
    </OrgUnitTooltip>
);

const adaptMap = value => {
    if (!value) return null;
    return Array.from(value.entries()) // original map in array form [[key1, entry1],[key2, entry2]]
        .map(entry => Array.from(entry[1].keys())) // 2D array containing the keys of each entry from comment above: [[entry1Key1, entry1Key2],[entry2Key1,entry2Key2]]
        .map(
            keys =>
                keys
                    .map(key => key.toString()) // [["entry1Key1"],["entry2Key1"]]. String conversion needed for Treeview
                    .filter(
                        (key, _index, keyArray) =>
                            key !== keyArray[keyArray.length - 1],
                    ), // removing last entry in the array to avoid expanding it
        )
        .flat();
};

export const makeValidationStatusIcon = classes => orgUnit => {
    if (orgUnit?.validationStatus === 'NEW')
        return <FlareIcon fontSize="small" className={classes.new} />;
    if (orgUnit?.validationStatus === 'VALID')
        return (
            <CheckCircleOutlineIcon
                fontSize="small"
                className={classes.valid}
            />
        );
    if (orgUnit?.validationStatus === 'REJECTED')
        return (
            <HighlightOffIcon fontSize="small" className={classes.rejected} />
        );
    return null;
};

export {
    formatInitialSelectedIds,
    formatInitialSelectedParents,
    tooltip,
    adaptMap,
};
