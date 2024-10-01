import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import TopBar from '../../../components/nav/TopBarComponent';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { OrgUnitChangeRequestConfigDialogCreateSecondStep } from './Dialog/OrgUnitChangeRequestConfigDialog';
import { OrgUnitChangeRequestConfigDialogCreateFirstStep } from './Dialog/OrgUnitChangeRequestConfigDialogCreateFirstStep';
import { OrgUnitChangeRequestConfigsFilter } from './Filter/OrgUnitChangeRequestConfigsFilter';
import { useGetOrgUnitChangeRequestConfigs } from './hooks/api/useGetOrgUnitChangeRequestConfigs';
import MESSAGES from './messages';
import { OrgUnitChangeRequestConfigsTable } from './Tables/OrgUnitChangeRequestConfigsTable';
import {
    OrgUnitChangeRequestConfigsParams,
    OrgUnitChangeRequestConfiguration,
} from './types';

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
        newConfig => {
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
