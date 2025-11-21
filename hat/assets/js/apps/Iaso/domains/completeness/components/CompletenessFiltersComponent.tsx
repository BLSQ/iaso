import React, { FunctionComponent } from 'react';
import Grid from '@mui/material/Grid';
import ChipListComponent from '../../../components/chips/ChipListComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { periodTypeOptions, instanceStatusOptions } from '../config';
import MESSAGES from '../messages';

type Props = {
    activePeriodType: string;
    setActivePeriodType: React.Dispatch<React.SetStateAction<any>>;
    activeInstanceStatuses: string[];
    setActiveInstanceStatuses: React.Dispatch<React.SetStateAction<any>>;
};

const CompletenessFiltersComponent: FunctionComponent<Props> = ({
    activePeriodType,
    setActivePeriodType,
    activeInstanceStatuses,
    setActiveInstanceStatuses,
}) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={3}>
                <InputComponent
                    type="select"
                    clearable={false}
                    onChange={(_, value) => setActivePeriodType(value)}
                    label={MESSAGES.periodType}
                    options={periodTypeOptions}
                    value={activePeriodType}
                    keyValue="periodType"
                />
            </Grid>
            <Grid item xs={3} />
            <Grid item container xs={6} justifyContent="flex-end">
                <ChipListComponent
                    options={instanceStatusOptions}
                    value={activeInstanceStatuses}
                    onChange={setActiveInstanceStatuses}
                />
            </Grid>
        </Grid>
    );
};

export default CompletenessFiltersComponent;
