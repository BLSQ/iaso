import React, { useState, FunctionComponent } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
    TreeViewWithSearch,
    useSafeIntl,
    commonStyles,
} from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import {
    getRootData,
    getChildrenData,
    searchOrgUnits,
} from '../orgUnits/components/TreeView/requests';
import { OrgUnitLabel, getOrgUnitAncestors } from '../orgUnits/utils';
import {
    tooltip,
    makeTreeviewLabel,
} from '../orgUnits/components/TreeView/utils';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Registry: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    const [selectedOrgUnits, setSelectedOrgUnits] = useState();

    const [selectedOrgUnitsIds, setSelectedOrgUnitsIds] = useState([]);
    const [selectedOrgUnitParents, setSelectedOrgUnitParents] = useState(
        new Map(),
    );
    const onUpdate = (orgUnitIds, parentsData, orgUnits) => {
        setSelectedOrgUnitsIds(orgUnitIds);
        setSelectedOrgUnitParents(parentsData);
        if (orgUnits) {
            setSelectedOrgUnits(orgUnits);
        }
        console.log('orgUnits', orgUnits);
    };
    console.log('selectedOrgUnits', selectedOrgUnits);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <TreeViewWithSearch
                    getChildrenData={getChildrenData}
                    getRootData={getRootData}
                    label={makeTreeviewLabel(classes, true)}
                    toggleOnLabelClick={false}
                    request={(value, count) => {
                        //  @ts-ignore
                        return searchOrgUnits({ value, count });
                    }}
                    makeDropDownText={orgUnit => (
                        <OrgUnitLabel
                            orgUnit={orgUnit}
                            withType
                            withSource={false}
                        />
                    )}
                    toolTip={tooltip}
                    parseNodeIds={getOrgUnitAncestors}
                    preselected={selectedOrgUnitsIds}
                    preexpanded={selectedOrgUnitParents}
                    selectedData={selectedOrgUnits}
                    onUpdate={onUpdate}
                    // allowSelection={false}
                    multiselect={false}
                />
                {selectedOrgUnits && selectedOrgUnits[0]?.name}
            </Box>
        </>
    );
};
