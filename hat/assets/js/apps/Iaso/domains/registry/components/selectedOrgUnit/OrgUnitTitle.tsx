import AddIcon from '@mui/icons-material/Add';
import { Box, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { IconButton, commonStyles } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';

import { baseUrls } from '../../../../constants/urls';
import MESSAGES from '../../messages';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { RegistryParams } from '../../types';
import { LinkToRegistry } from '../LinkToRegistry';

type Props = {
    orgUnit: OrgUnit;
    params: RegistryParams;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
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
}));

export const OrgUnitTitle: FunctionComponent<Props> = ({ orgUnit, params }) => {
    const classes: Record<string, string> = useStyles();

    const isRootOrgUnit = params.orgUnitId === `${orgUnit?.id}`;
    return (
        <Grid container className={classes.paperTitle}>
            <Grid xs={8} item>
                <Typography
                    color="primary"
                    variant="h6"
                    className={classes.title}
                >
                    {orgUnit.name} ({orgUnit.org_unit_type_name})
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
                    {isRootOrgUnit && (
                        <IconButton
                            url={`/${baseUrls.orgUnitDetails}/orgUnitId/0/levels/${orgUnit.id}`}
                            color="secondary"
                            overrideIcon={AddIcon}
                            tooltipMessage={MESSAGES.addOrgUnitChild}
                            iconSize="small"
                            size="small"
                        />
                    )}
                    <IconButton
                        url={`/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}`}
                        color="secondary"
                        icon="edit"
                        tooltipMessage={MESSAGES.editOrgUnit}
                        iconSize="small"
                        size="small"
                    />
                    {!isRootOrgUnit && (
                        <LinkToRegistry
                            orgUnit={orgUnit}
                            useIcon
                            iconSize="small"
                            size="small"
                            color="secondary"
                        />
                    )}
                </Box>
            </Grid>
        </Grid>
    );
};
