import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';

import { useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../../messages';
import InputComponent from '../../../../components/forms/InputComponent';

import { DropdownOptions } from '../../../../types/utils';

import { ReferenceForm } from '../../types';

type Props = {
    // eslint-disable-next-line no-unused-vars
    handleChangeTargetVersion: (_, value: string) => void;
    targetVersion: string;
    targetVersionsDropdownOptions: DropdownOptions<string>[];
    referenceForm?: ReferenceForm;
};

export const HeadTargetCell: FunctionComponent<Props> = ({
    handleChangeTargetVersion,
    targetVersion,
    targetVersionsDropdownOptions,
    referenceForm,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box mb={2}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={7} container alignContent="center">
                    <Box mt={1}>
                        <Box display="inline-block" mr={1}>
                            {formatMessage(MESSAGES.targetForm)}:
                        </Box>
                        <b>{referenceForm?.name}</b>
                    </Box>
                </Grid>
                <Grid item xs={12} md={5}>
                    <InputComponent
                        type="select"
                        keyValue="targetVersion"
                        onChange={handleChangeTargetVersion}
                        value={targetVersion}
                        label={MESSAGES.targetVersion}
                        options={targetVersionsDropdownOptions}
                        clearable={false}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};
