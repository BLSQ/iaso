import React from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';

import InputComponent from '../../../components/forms/InputComponent';
import ChipListComponent from '../../../components/chips/ChipListComponent';
import { periodTypeOptions, instanceStatusOptions } from '../config';
import MESSAGES from '../messages';

function CompletenessFiltersComponent({
    activePeriodType,
    setActivePeriodType,
    activeInstanceStatuses,
    setActiveInstanceStatuses,
}) {
    return (
        <>
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
        </>
    );
}
CompletenessFiltersComponent.propTypes = {
    activePeriodType: PropTypes.string.isRequired,
    setActivePeriodType: PropTypes.func.isRequired,
    activeInstanceStatuses: PropTypes.arrayOf(PropTypes.string).isRequired,
    setActiveInstanceStatuses: PropTypes.func.isRequired,
};
export default CompletenessFiltersComponent;
