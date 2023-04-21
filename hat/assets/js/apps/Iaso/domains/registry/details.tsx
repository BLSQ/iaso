import React, { FunctionComponent, useMemo } from 'react';
import {
    useSafeIntl,
    commonStyles,
    IconButton,
    LoadingSpinner,
} from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import { orderBy } from 'lodash';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { useGoBack } from '../../routing/useGoBack';
import { baseUrls } from '../../constants/urls';
import { getOtChipColors } from '../../constants/chipColors';

import { useGetOrgUnit } from './hooks/useGetOrgUnit';
import { useGetEnketoUrl } from './hooks/useGetEnketoUrl';
import { useCurrentUser } from '../../utils/usersUtils';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import InstanceFileContent from '../instances/components/InstanceFileContent';
import EnketoIcon from '../instances/components/EnketoIcon';
import { Instances } from './components/Instances';
import { OrgUnitPaper } from './components/OrgUnitPaper';

import { OrgunitTypes } from '../orgUnits/types/orgunitTypes';
import { RegistryDetailParams } from './types';

import { userHasPermission } from '../users/utils';

type Router = {
    goBack: () => void;
    params: RegistryDetailParams;
};
type Props = {
    router: Router;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        width: '100%',
    },
    formContents: {
        maxHeight: '502px',
        overflow: 'auto',
    },
}));

export const Details: FunctionComponent<Props> = ({ router }) => {
    const {
        params: { orgUnitId, accountId },
        params,
    } = router;
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(router, baseUrls.registry, { accountId });

    const { data: orgUnit, isFetching } = useGetOrgUnit(orgUnitId);

    const subOrgUnitTypes: OrgunitTypes = useMemo(() => {
        const options =
            orgUnit?.org_unit_type?.sub_unit_types.map((subType, index) => ({
                ...subType,
                color: getOtChipColors(index) as string,
            })) || [];
        return orderBy(options, [f => f.depth], ['asc']);
    }, [orgUnit]);

    const getEnketoUrl = useGetEnketoUrl(
        window.location.href,
        orgUnit?.reference_instance,
    );
    const currentUser = useCurrentUser();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton
                goBack={() => goBack()}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                {isFetching && <LoadingSpinner />}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        {orgUnit && (
                            <OrgUnitPaper
                                orgUnit={orgUnit}
                                subOrgUnitTypes={subOrgUnitTypes}
                                params={params}
                            />
                        )}
                    </Grid>
                    {orgUnit?.reference_instance && (
                        <Grid
                            item
                            xs={12}
                            md={6}
                            alignItems="flex-start"
                            container
                        >
                            <WidgetPaper
                                id="form-contents"
                                className={classes.paper}
                                title={orgUnit.reference_instance.form_name}
                                IconButton={
                                    userHasPermission(
                                        'iaso_update_submission',
                                        currentUser,
                                    ) && IconButton
                                }
                                iconButtonProps={{
                                    onClick: () => getEnketoUrl(),
                                    overrideIcon: EnketoIcon,
                                    color: 'secondary',
                                    tooltipMessage: MESSAGES.editOnEnketo,
                                }}
                            >
                                <Box className={classes.formContents}>
                                    <InstanceFileContent
                                        instance={orgUnit.reference_instance}
                                        showQuestionKey={false}
                                    />
                                </Box>
                            </WidgetPaper>
                        </Grid>
                    )}
                </Grid>
                <Box mt={2}>
                    <Instances
                        isLoading={isFetching}
                        subOrgUnitTypes={subOrgUnitTypes}
                        params={params}
                    />
                </Box>
            </Box>
        </>
    );
};
