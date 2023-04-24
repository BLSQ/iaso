import React, { FunctionComponent, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    makeStyles,
    Tabs,
    Tab,
    Box,
    Paper,
    Grid,
    Typography,
    Divider,
} from '@material-ui/core';
import { commonStyles, IconButton, useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import AddIcon from '@material-ui/icons/Add';

import MESSAGES from '../messages';

import { baseUrls } from '../../../constants/urls';

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
    paperTitle: {
        padding: theme.spacing(2),
        display: 'flex',
    },
    paperTitleButtonContainer: {
        position: 'relative',
    },
    paperTitleButton: {
        position: 'absolute',
        right: -theme.spacing(1),
        top: -theme.spacing(1),
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
        <Paper elevation={1} className={classes.paper}>
            <Box className={classes.paperTitle}>
                <Grid xs={8} item>
                    <Typography
                        color="primary"
                        variant="h5"
                        className={classes.title}
                    >
                        {orgUnit.name ?? ''}
                    </Typography>
                </Grid>
                <Grid
                    xs={4}
                    item
                    container
                    justifyContent="flex-end"
                    className={classes.paperTitleButtonContainer}
                >
                    <Box className={classes.paperTitleButton}>
                        <IconButton
                            url={`${baseUrls.orgUnitDetails}/orgUnitId/0/levels/${orgUnit.id}`}
                            color="secondary"
                            overrideIcon={AddIcon}
                            tooltipMessage={MESSAGES.addOrgUnitChild}
                        />
                        <IconButton
                            url={`${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`}
                            color="secondary"
                            icon="edit"
                            tooltipMessage={MESSAGES.editOrgUnit}
                        />
                    </Box>
                </Grid>

                <Divider />
            </Box>
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
                    <OrgUnitChildrenList
                        orgUnit={orgUnit}
                        subOrgUnitTypes={subOrgUnitTypes}
                        params={params}
                    />
                </Box>
            </Box>
        </Paper>
    );
};
