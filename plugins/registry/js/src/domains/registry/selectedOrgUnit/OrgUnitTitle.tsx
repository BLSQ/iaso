import { Box, Grid, Typography } from '@mui/material';
import React, { FunctionComponent } from 'react';

import { OrgUnit } from '../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { SxStyles } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { RegistryParams } from '../../../types';
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
