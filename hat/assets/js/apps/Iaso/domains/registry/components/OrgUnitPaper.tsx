import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles, Tabs, Tab, Box } from '@material-ui/core';
import { isNumber } from 'lodash';
import { commonStyles, IconButton, useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';

import MESSAGES from '../messages';

import { baseUrls } from '../../../constants/urls';

import { useGetOrgUnitsChildren } from '../hooks/useGetOrgUnit';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { OrgUnitChildrenMap } from './OrgUnitChildrenMap';

import { redirectTo } from '../../../routing/actions';

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

    const { data: listChildrenOrgUnits, isFetching } = useGetOrgUnitsChildren(
        `${orgUnit.id}`,
        subOrgUnitTypes,
    );
    const mapChildrenOrgUnits = useMemo(
        () =>
            listChildrenOrgUnits?.filter(
                orgUnitItem =>
                    Boolean(orgUnitItem.geo_json) ||
                    (isNumber(orgUnitItem.latitude) &&
                        isNumber(orgUnitItem.longitude)),
            ),
        [listChildrenOrgUnits],
    );
    const handleChangeTab = useCallback(
        (_, newTab: OrgUnitListTab) => {
            setTab(newTab);
            const newParams = {
                ...params,
                orgUnitListTab: newTab,
            };
            dispatch(redirectTo(baseUrls.registryDetail, newParams));
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

            {!isFetching && (
                <Box position="relative">
                    <Box
                        className={classnames(
                            tab !== 'map' && classes.hiddenOpacity,
                        )}
                    >
                        <OrgUnitChildrenMap
                            orgUnit={orgUnit}
                            subOrgUnitTypes={subOrgUnitTypes}
                            childrenOrgUnits={mapChildrenOrgUnits || []}
                        />
                    </Box>
                    {tab === 'list' && (
                        <OrgUnitChildrenList
                            orgUnit={orgUnit}
                            subOrgUnitTypes={subOrgUnitTypes}
                            childrenOrgUnits={mapChildrenOrgUnits || []}
                        />
                    )}
                </Box>
            )}
        </WidgetPaper>
    );
};
