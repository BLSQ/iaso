import AddIcon from '@mui/icons-material/Add';
import { Box, Grid, Typography } from '@mui/material';
import { IconButton } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';

import { baseUrls } from '../../../../constants/urls';
import MESSAGES from '../../messages';

import { DisplayIfUserHasPerm } from '../../../../components/DisplayIfUserHasPerm';
import { SxStyles } from '../../../../types/general';
import * as Permissions from '../../../../utils/permissions';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { RegistryParams } from '../../types';
import { LinkToRegistry } from '../LinkToRegistry';

type Props = {
    orgUnit: OrgUnit;
    params: RegistryParams;
};

const styles: SxStyles = {
    titleContainer: {
        height: '55px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
    },
    title: {
        fontSize: '20px',
        lineHeight: '24px',
        marginLeft: theme => theme.spacing(2),
    },
    paperTitleButtonContainer: {
        position: 'relative',
    },
    paperTitleButton: {
        position: 'absolute',
        right: theme => theme.spacing(1),
        top: theme => theme.spacing(1),
    },
};

export const OrgUnitTitle: FunctionComponent<Props> = ({ orgUnit, params }) => {
    const isRootOrgUnit = params.orgUnitId === `${orgUnit?.id}`;
    return (
        <Grid container spacing={0}>
            <Grid xs={9} item sx={styles.titleContainer}>
                <Typography color="primary" variant="h6" sx={styles.title}>
                    {orgUnit.name} ({orgUnit.org_unit_type_name})
                </Typography>
            </Grid>
            <Grid
                xs={3}
                item
                container
                justifyContent="flex-end"
                sx={styles.paperTitleButtonContainer}
            >
                <Box sx={styles.paperTitleButton}>
                    <DisplayIfUserHasPerm
                        permissions={[Permissions.REGISTRY_WRITE]}
                    >
                        <>
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
                        </>
                    </DisplayIfUserHasPerm>
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
