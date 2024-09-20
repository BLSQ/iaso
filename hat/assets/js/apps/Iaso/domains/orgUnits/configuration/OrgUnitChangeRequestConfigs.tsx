import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { baseUrls } from '../../../constants/urls';
import { OrgUnitChangeRequestConfigsParams } from './types';
import { useGetOrgUnitChangeRequestConfigs } from './hooks/api/useGetOrgUnitChangeRequestConfigs';
import TopBar from '../../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { OrgUnitChangeRequestConfigsFilter } from './Filter/OrgUnitChangeRequestConfigsFilter';
import { OrgUnitChangeRequestConfigsTable } from './Tables/OrgUnitChangeRequestConfigsTable';
import { OrgUnitChangeRequestConfigDialogCreateFirstStep } from './Dialog/OrgUnitChangeRequestConfigDialogCreateFirstStep';
import {
    OrgUnitChangeRequestConfigDialogCreateSecondStep,
    OrgUnitChangeRequestConfigDialogUpdate,
} from './Dialog/OrgUnitChangeRequestConfigDialogUpdate';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const OrgUnitChangeRequestConfigs: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.orgUnitsChangeRequestConfiguration,
    ) as unknown as OrgUnitChangeRequestConfigsParams;

    const { data, isFetching } = useGetOrgUnitChangeRequestConfigs(params);
    const [isCreationSecondStepDialogOpen, setIsCreationSecondStepDialogOpen] =
        useState<boolean>(false);
    const [configInCreation, setConfigInCreation] = useState<object>({});

    const handleCreationSecondStep = useCallback(
        (config) => {
            setConfigInCreation(config);
            setIsCreationSecondStepDialogOpen(true);
        },
        [setIsCreationSecondStepDialogOpen, setConfigInCreation],
    );

    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    console.log("*** state isDialogOpen = ", isCreationSecondStepDialogOpen);

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

                    <OrgUnitChangeRequestConfigDialogCreateFirstStep
                        iconProps={{}}
                        openCreationSecondStepDialog={handleCreationSecondStep}
                    />
                    <OrgUnitChangeRequestConfigDialogCreateSecondStep
                        isOpen={isCreationSecondStepDialogOpen}
                        closeDialog={() => {
                            setIsCreationSecondStepDialogOpen(false);
                        }}
                        config={configInCreation}
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
