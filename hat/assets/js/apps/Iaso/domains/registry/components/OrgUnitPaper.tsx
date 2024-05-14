import React, { FunctionComponent, useCallback, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
    Box,
    Divider,
    Grid,
    Paper,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { IconButton, commonStyles, useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import { useRedirectToReplace } from '../../../routing/routing';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { OrgUnitChildrenMap } from './OrgUnitChildrenMap';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgUnitChildrenList } from './OrgUnitChildrenList';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';
import { OrgUnitListChildren } from '../hooks/useGetOrgUnit';
import { OrgUnitListTab, RegistryDetailParams } from '../types';

type Props = {
    orgUnit: OrgUnit;
    subOrgUnitTypes: OrgunitTypes;
    params: RegistryDetailParams;
    orgUnitListChildren?: OrgUnitListChildren;
    isFetchingListChildren: boolean;
    orgUnitMapChildren?: OrgUnit[];
    isFetchingMapChildren: boolean;
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
    orgUnitListChildren,
    isFetchingListChildren,
    orgUnitMapChildren,
    isFetchingMapChildren,
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
            <Grid container className={classes.paperTitle}>
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
                            url={`/${baseUrls.orgUnitDetails}/orgUnitId/0/levels/${orgUnit.id}`}
                            color="secondary"
                            overrideIcon={AddIcon}
                            tooltipMessage={MESSAGES.addOrgUnitChild}
                        />
                        <IconButton
                            url={`/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`}
                            color="secondary"
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.editOrgUnit}
                        />
                    </Box>
                </Grid>
            </Grid>
            <Divider />
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
                    />
                </Box>
            </Box>
        </Paper>
    );
};
