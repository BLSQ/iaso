import { makeStyles } from '@mui/styles';
import { AddButton, commonStyles, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { baseUrls } from '../../../constants/urls';
import { OrgUnitChangeRequestConfigsParams } from './types';
import { useGetOrgUnitChangeRequestConfigs } from './hooks/api/useGetOrgUnitChangeRequestConfigs';
import TopBar from '../../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { OrgUnitChangeRequestConfigsFilter } from './Filter/OrgUnitChangeRequestConfigsFilter';
import { OrgUnitChangeRequestConfigsTable } from './Tables/OrgUnitChangeRequestConfigsTable';
import { OrgUnitChangeRequestConfigDialog } from './Dialog/OrgUnitChangeRequestConfigDialog';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const OrgUnitChangeRequestConfigs: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.orgUnitsChangeRequestConfiguration,
    ) as unknown as OrgUnitChangeRequestConfigsParams;
    const { data, isFetching } = useGetOrgUnitChangeRequestConfigs(params);

    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    return (
        <div>
            <TopBar
                title={formatMessage(
                    MESSAGES.orgUnitChangeRequestConfigurations,
                )}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <OrgUnitChangeRequestConfigsFilter params={params} />
                <Box mb={2} display="flex" justifyContent="flex-end">
                    <OrgUnitChangeRequestConfigDialog
                        titleMessage={formatMessage(MESSAGES.oucrcCreateModalTitle)}
                        iconProps={{ disabled: false }}
                        dataTestId="add-org-unit-config-button"
                    />
                </Box>

                <OrgUnitChangeRequestConfigsTable
                    data={data}
                    isFetching={isFetching}
                    params={params}
                    onEditClicked={config => {
                        // TODO
                    }}
                />
            </Box>
        </div>
    );
};
