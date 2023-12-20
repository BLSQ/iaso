import React, { useState, FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    TreeViewWithSearch,
    useSafeIntl,
    commonStyles,
} from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import {
    tooltip,
    makeTreeviewLabel,
} from '../orgUnits/components/TreeView/utils';

import { OrgUnitLabel, getOrgUnitAncestors } from '../orgUnits/utils';
import { OrgUnitInfos } from './components/OrgUnitInfos';

import {
    getRootData,
    getChildrenData,
    searchOrgUnits,
} from '../orgUnits/components/TreeView/requests';
import { OrgUnit } from '../orgUnits/types/orgUnit';

import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    treeContainer: {
        '& ul[role="tree"]': {
            maxHeight: '75vh',
            '& li>div>div>div svg': {
                display: 'none',
            },
        },
    },
}));

type Params = {
    accountId: 'string';
};

type Props = {
    params: Params;
};

export const Registry: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    const [selectedOrgUnits, setSelectedOrgUnits] = useState<OrgUnit[]>([]);

    const [selectedOrgUnitsIds, setSelectedOrgUnitsIds] = useState<string[]>(
        [],
    );
    const [selectedOrgUnitParents, setSelectedOrgUnitParents] = useState<
        Map<string, string>
    >(new Map());
    const onUpdate = (orgUnitIds, parentsData, orgUnits) => {
        setSelectedOrgUnitsIds(orgUnitIds);
        setSelectedOrgUnitParents(parentsData);
        if (orgUnits) {
            setSelectedOrgUnits(orgUnits);
        }
    };
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6} className={classes.treeContainer}>
                        <TreeViewWithSearch
                            getChildrenData={id => getChildrenData(id, 'VALID')}
                            getRootData={(id, type) =>
                                getRootData(id, type, 'VALID')
                            }
                            label={makeTreeviewLabel(classes, true)}
                            toggleOnLabelClick={false}
                            request={(value, count) => {
                                //  @ts-ignore => TODO fix this while migrate tree to Typescript
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
                            multiselect={false}
                            inputLabelObject={MESSAGES.search}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {selectedOrgUnits?.length > 0 && (
                            <WidgetPaper
                                title={formatMessage(MESSAGES.selectedOrgUnit)}
                            >
                                <OrgUnitInfos
                                    orgUnit={selectedOrgUnits[0]}
                                    accountId={params.accountId}
                                />
                            </WidgetPaper>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
