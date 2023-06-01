/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
// @ts-ignore
import {
    useSafeIntl,
    LoadingSpinner,
    IntlFormatMessage,
} from 'bluesquare-components';

import { Grid, Typography, Box } from '@material-ui/core';
import { usePrettyPeriod } from '../../../periods/utils';
import WidgetPaper from '../../../../components/papers/WidgetPaperComponent';

import { getDisplayName, User } from '../../../../utils/usersUtils';
import { LinkToOrgUnit } from '../../../orgUnits/components/LinkToOrgUnit';
import { useGetOrgUnitDetail } from '../../../orgUnits/hooks/requests/useGetOrgUnitDetail';

import MESSAGES from '../messages';

type Props = {
    user: User | undefined;
    infos: Record<string, any> | undefined;
    loading: boolean;
};

export const InstanceLogInfos: FunctionComponent<Props> = ({
    user,
    infos,
    loading,
}) => {
    const formatPeriod = usePrettyPeriod();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const { data: currentOrgUnit } = useGetOrgUnitDetail(infos?.org_unit);
    return (
        <Box mt={2}>
            <WidgetPaper
                expandable
                isExpanded
                title={formatMessage(MESSAGES.infos)}
                padded
            >
                {loading && (
                    <LoadingSpinner
                        fixed={false}
                        transparent
                        padding={4}
                        size={25}
                    />
                )}
                {!loading && (
                    <Grid container spacing={1}>
                        <Grid
                            xs={5}
                            container
                            alignItems="center"
                            item
                            justifyContent="flex-end"
                        >
                            <Typography variant="body2" color="inherit">
                                {formatMessage(MESSAGES.last_modified_by)}
                            </Typography>
                            :
                        </Grid>
                        <Grid
                            xs={7}
                            container
                            item
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Typography variant="body2" color="inherit">
                                {user ? getDisplayName(user) : '-'}
                            </Typography>
                        </Grid>
                        <Grid
                            xs={5}
                            container
                            alignItems="center"
                            item
                            justifyContent="flex-end"
                        >
                            <Typography variant="body2" color="inherit">
                                {formatMessage(MESSAGES.org_unit)}
                            </Typography>
                            :
                        </Grid>
                        <Grid
                            xs={7}
                            container
                            item
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Typography variant="body2" color="inherit">
                                {currentOrgUnit && (
                                    <LinkToOrgUnit orgUnit={currentOrgUnit} />
                                )}
                            </Typography>
                        </Grid>
                        <Grid
                            xs={5}
                            container
                            alignItems="center"
                            item
                            justifyContent="flex-end"
                        >
                            <Typography variant="body2" color="inherit">
                                {formatMessage(MESSAGES.period)}
                            </Typography>
                            :
                        </Grid>
                        <Grid
                            xs={7}
                            container
                            item
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <Typography variant="body2" color="inherit">
                                {formatPeriod(infos?.period)}
                            </Typography>
                        </Grid>
                    </Grid>
                )}
            </WidgetPaper>
        </Box>
    );
};
