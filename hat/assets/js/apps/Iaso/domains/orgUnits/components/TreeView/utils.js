import React from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import FlareIcon from '@mui/icons-material/Flare';
import { Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { getOrgUnitAncestors } from '../../utils';
import OrgUnitTooltip from '../OrgUnitTooltip';
import MESSAGES from '../../messages';

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

// TODO rename
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

const makeOrgUnistStatusIcon = (classes, orgUnit, formatMessage) => {
    const style = {
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
    };
    if (orgUnit?.validation_status === 'NEW')
        // The icon has to be wrapped, otherwise Tooltip will crash
        return (
            <Tooltip title={formatMessage(MESSAGES.statusNew)} size="small">
                <div style={style}>
                    <FlareIcon fontSize="small" className={classes.new} />
                </div>
            </Tooltip>
        );
    if (orgUnit?.validation_status === 'VALID')
        return (
            <Tooltip title={formatMessage(MESSAGES.statusValid)} size="small">
                <div style={style}>
                    <CheckCircleOutlineIcon
                        fontSize="small"
                        className={classes.valid}
                    />
                </div>
            </Tooltip>
        );
    if (orgUnit?.validation_status === 'REJECTED')
        return (
            <Tooltip
                title={formatMessage(MESSAGES.statusRejected)}
                size="small"
            >
                <div style={style}>
                    <HighlightOffIcon
                        fontSize="small"
                        className={classes.rejected}
                    />
                </div>
            </Tooltip>
        );
    return null;
};

export const makeTreeviewLabel =
    (classes, withStatusIcon, withType = false) =>
    orgUnit => {
        const { formatMessage } = useSafeIntl();

        const icon = withStatusIcon
            ? makeOrgUnistStatusIcon(classes, orgUnit, formatMessage)
            : null;

        return (
            <>
                {orgUnit.name || `id: ${orgUnit.id}`}
                {withType && orgUnit.org_unit_type_short_name
                    ? ` (${orgUnit.org_unit_type_short_name})`
                    : ''}
                {icon}
            </>
        );
    };

export const orgUnitTreeviewStatusIconsStyle = theme => ({
    valid: {
        color: theme.palette.success.main,
        fontSize: '16px',
        marginLeft: '10px',
    },
    new: {
        color: theme.palette.primary.main,
        fontSize: '16px',
        marginLeft: '10px',
    },
    rejected: {
        color: theme.palette.error.main,
        fontSize: '16px',
        marginLeft: '10px',
    },
});

export {
    formatInitialSelectedIds,
    formatInitialSelectedParents,
    tooltip,
    adaptMap,
};
