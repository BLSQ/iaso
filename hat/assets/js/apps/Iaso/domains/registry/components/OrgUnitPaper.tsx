import React, { FunctionComponent, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles, Tabs, Tab, Box } from '@material-ui/core';
import { commonStyles, IconButton, useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';

import MESSAGES from '../messages';

import { baseUrls } from '../../../constants/urls';

import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { OrgUnitChildrenMap } from './OrgUnitChildrenMap';

import { redirectToReplace } from '../../../routing/actions';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgUnitChildrenList } from './OrgUnitChildrenList';

import { RegistryDetailParams, OrgUnitListTab } from '../types';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
    params: RegistryDetailParams;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        width: '100%',
    },
    hiddenOpacity: {
        position: 'absolute',
        top: 0,
        left: -5000,
        zIndex: -10,
        opacity: 0,
        width: '100%',
    },
    tabs: {
        ...commonStyles(theme).tabs,
        zIndex: 10,
        position: 'relative',
    },
}));

export const OrgUnitPaper: FunctionComponent<Props> = ({
    orgUnit,
    subOrgUnitTypes,
    params,
}) => {
    const classes: Record<string, string> = useStyles();
    const [tab, setTab] = useState<OrgUnitListTab>(
        params.orgUnitListTab || 'map',
    );
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const handleChangeTab = useCallback(
        (_, newTab: OrgUnitListTab) => {
            setTab(newTab);
            const newParams = {
                ...params,
                orgUnitListTab: newTab,
            };
            dispatch(redirectToReplace(baseUrls.registryDetail, newParams));
        },
        [dispatch, params],
    );
    return (
        <WidgetPaper
            className={classes.paper}
            title={orgUnit.name ?? ''}
            IconButton={IconButton}
            iconButtonProps={{
                url: `${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`,
                color: 'secondary',
                icon: 'edit',
                tooltipMessage: MESSAGES.editOrgUnit,
            }}
        >
            <Tabs
                value={tab}
                classes={{
                    root: classes.tabs,
                }}
                onChange={handleChangeTab}
            >
                <Tab value="map" label={formatMessage(MESSAGES.map)} />
                <Tab value="list" label={formatMessage(MESSAGES.list)} />
            </Tabs>

            <Box position="relative">
                <Box
                    className={classnames(
                        tab !== 'map' && classes.hiddenOpacity,
                    )}
                >
                    <OrgUnitChildrenMap
                        orgUnit={orgUnit}
                        subOrgUnitTypes={subOrgUnitTypes}
                    />
                </Box>
                <Box
                    className={classnames(
                        tab !== 'list' && classes.hiddenOpacity,
                    )}
                >
                    <OrgUnitChildrenList orgUnit={orgUnit} params={params} />
                </Box>
            </Box>
        </WidgetPaper>
    );
};
