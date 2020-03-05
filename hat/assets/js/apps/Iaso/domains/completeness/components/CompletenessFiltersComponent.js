import React from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';

import InputComponent from '../../../components/forms/InputComponent';
import ChipListComponent from '../../../components/chips/ChipListComponent';
import { instanceStatusPluralOptions } from '../../instances/config';
import { periodTypeOptions } from '../../periods/config';

function CompletenessFiltersComponent({
    activePeriodType,
    setActivePeriodType,
    activeInstanceStatuses,
    setActiveInstanceStatuses,
    intl,
}) {
    // TODO: select and chiplist should accept translatable messages options
    const translatedPeriodTypeOptions = periodTypeOptions.map(option => ({
        value: option.value,
        label: intl.formatMessage(option.label),
    }));
    const translatedInstanceStatusOptions = instanceStatusPluralOptions.map(option => ({
        value: option.value,
        label: intl.formatMessage(option.label),
    }));

    return (
        <>
            <Grid container spacing={4}>
                <Grid item xs={3}>
                    <InputComponent
                        type="select"
                        clearable={false}
                        onChange={(_, value) => setActivePeriodType(value)}
                        label={{
                            id: 'iaso.label.periodType',
                            defaultMessage: 'Period type',
                        }}
                        options={translatedPeriodTypeOptions}
                        value={activePeriodType}
                        keyValue="periodType"
                    />
                </Grid>
                <Grid item xs={3} />
                <Grid item container xs={6} justify="flex-end">
                    <ChipListComponent
                        options={translatedInstanceStatusOptions}
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
    intl: PropTypes.object.isRequired,
};
export default injectIntl(CompletenessFiltersComponent);
