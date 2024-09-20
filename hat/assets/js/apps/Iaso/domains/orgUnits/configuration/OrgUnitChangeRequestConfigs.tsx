import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { baseUrls } from '../../../constants/urls';
import {
    OrgUnitChangeRequestConfigsParams,
    OrgUnitChangeRequestConfiguration,
} from './types';
import { useGetOrgUnitChangeRequestConfigs } from './hooks/api/useGetOrgUnitChangeRequestConfigs';
import TopBar from '../../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { OrgUnitChangeRequestConfigsFilter } from './Filter/OrgUnitChangeRequestConfigsFilter';
import { OrgUnitChangeRequestConfigsTable } from './Tables/OrgUnitChangeRequestConfigsTable';
import { OrgUnitChangeRequestConfigDialogCreateFirstStep } from './Dialog/OrgUnitChangeRequestConfigDialogCreateFirstStep';
import {
    OrgUnitChangeRequestConfigDialogCreateSecondStep,
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
    const [config, setConfig] = useState<OrgUnitChangeRequestConfiguration>();

    const handleSecondStep = useCallback(
        (newConfig) => {
            setConfig(newConfig);
            setIsCreationSecondStepDialogOpen(true);
        },
        [setIsCreationSecondStepDialogOpen, setConfig],
    );

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

                    <OrgUnitChangeRequestConfigDialogCreateFirstStep
                        iconProps={{}}
                        openCreationSecondStepDialog={handleSecondStep}
                    />
                    {isCreationSecondStepDialogOpen && config && (
                        <OrgUnitChangeRequestConfigDialogCreateSecondStep
                            isOpen
                            closeDialog={() => {
                                setIsCreationSecondStepDialogOpen(false);
                            }}
                            config={config}
                        />
                    )}
                </Box>

                <OrgUnitChangeRequestConfigsTable
                    data={data}
                    isFetching={isFetching}
                    params={params}
                    onEditClicked={handleSecondStep}
                />
            </Box>
        </div>
    );
};
