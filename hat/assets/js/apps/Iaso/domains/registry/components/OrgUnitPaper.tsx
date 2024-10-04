import { Box, Paper, Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import classnames from 'classnames';
import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useCallback,
    useState,
} from 'react';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';

import { OrgUnitChildrenMap } from './map/OrgUnitChildrenMap';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';
import { OrgUnitListChildren } from '../hooks/useGetOrgUnit';
import { OrgUnitListTab, RegistryParams } from '../types';
import { OrgUnitChildrenList } from './OrgUnitChildrenList';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
    params: RegistryParams;
    orgUnitListChildren?: OrgUnitListChildren;
    isFetchingListChildren: boolean;
    orgUnitMapChildren?: OrgUnit[];
    isFetchingMapChildren: boolean;
    setSelectedChildren: Dispatch<SetStateAction<OrgUnit | undefined>>;
    selectedChildrenId: string | undefined;
    isFetchingOrgUnit: boolean;
    handleOrgUnitChange: (newOrgUnit: OrgUnit) => void;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        width: '100%',
        // @ts-ignore
        backgroundColor: theme.palette.ligthGray.background,
        marginBottom: theme.spacing(4),
        '&:last-child': {
            marginBottom: 0,
        },
    },
    title: {
        [theme.breakpoints.down('md')]: {
            fontSize: '1.4rem',
        },
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
    orgUnitListChildren,
    isFetchingListChildren,
    orgUnitMapChildren,
    isFetchingMapChildren,
    setSelectedChildren,
    selectedChildrenId,
    isFetchingOrgUnit,
    handleOrgUnitChange,
}) => {
    const classes: Record<string, string> = useStyles();
    const [tab, setTab] = useState<OrgUnitListTab>(
        params.orgUnitListTab || 'map',
    );
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();

    const handleChangeTab = useCallback(
        (_, newTab: OrgUnitListTab) => {
            setTab(newTab);
            const newParams = {
                ...params,
                orgUnitListTab: newTab,
            };
            redirectToReplace(baseUrls.registry, newParams);
        },
        [params, redirectToReplace],
    );
    return (
        <Paper elevation={1} className={classes.paper}>
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
                        params={params}
                        orgUnit={orgUnit}
                        subOrgUnitTypes={subOrgUnitTypes}
                        orgUnitChildren={orgUnitMapChildren}
                        isFetchingChildren={isFetchingMapChildren}
                        setSelectedChildren={setSelectedChildren}
                        selectedChildrenId={selectedChildrenId}
                        isFetchingOrgUnit={isFetchingOrgUnit}
                        handleOrgUnitChange={handleOrgUnitChange}
                    />
                </Box>
                <Box
                    className={classnames(
                        tab !== 'list' && classes.hiddenOpacity,
                    )}
                >
                    <OrgUnitChildrenList
                        params={params}
                        orgUnitChildren={orgUnitListChildren}
                        isFetchingChildren={isFetchingListChildren}
                        setSelectedChildren={setSelectedChildren}
                        selectedChildrenId={selectedChildrenId}
                    />
                </Box>
            </Box>
        </Paper>
    );
};
