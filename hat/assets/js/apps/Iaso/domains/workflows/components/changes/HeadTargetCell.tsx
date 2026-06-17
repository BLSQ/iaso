import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../../components/forms/InputComponent';
import { DropdownOptions } from '../../../../types/utils';
import MESSAGES from '../../messages';
import { ReferenceForm } from '../../types';

type Props = {
    handleChangeTargetVersion: (_: any, value: string) => void;
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
        <Box sx={{
            mb: 2
        }}>
            <Grid container spacing={2}>
                <Grid
                    container
                    size={{
                        xs: 12,
                        md: 7
                    }}
                    sx={{
                        alignContent: "center"
                    }}>
                    <Box sx={{
                        mt: 1
                    }}>
                        <Box
                            sx={{
                                display: "inline-block",
                                mr: 1
                            }}>
                            {formatMessage(MESSAGES.targetForm)}:
                        </Box>
                        <b>{referenceForm?.name}</b>
                    </Box>
                </Grid>
                <Grid
                    size={{
                        xs: 12,
                        md: 5
                    }}>
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
