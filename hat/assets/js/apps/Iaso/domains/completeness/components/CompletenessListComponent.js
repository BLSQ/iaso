import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, withStyles } from '@material-ui/core';

import CompletenessFiltersComponent from './CompletenessFiltersComponent';
import CompletenessPeriodComponent from './CompletenessPeriodComponent';
import commonStyles from '../../../styles/common';
import { PERIOD_TYPE_QUARTER } from '../../periods/constants';
import { INSTANCE_STATUSES } from '../../instances/constants';
import { groupCompletenessData } from '../utils';

const styles = theme => commonStyles(theme);

function CompletenessListComponent({
    classes,
    completenessList,
    redirectTo,
    onGenerateDerivedInstances,
}) {
    const [activePeriodType, setActivePeriodType] =
        useState(PERIOD_TYPE_QUARTER);
    const [activeInstanceStatuses, setActiveInstanceStatuses] =
        useState(INSTANCE_STATUSES);

    const groupedCompletenessData = useMemo(
        () => groupCompletenessData(completenessList, activePeriodType),
        [completenessList, activePeriodType],
    );

    return (
        <Box className={classes.containerFullHeightNoTabPadded}>
            <CompletenessFiltersComponent
                activePeriodType={activePeriodType}
                setActivePeriodType={setActivePeriodType}
                activeInstanceStatuses={activeInstanceStatuses}
                setActiveInstanceStatuses={setActiveInstanceStatuses}
            />
            <div className={classes.marginTop}>
                {groupedCompletenessData.map(({ period, forms }) => (
                    <CompletenessPeriodComponent
                        key={period.periodString}
                        period={period}
                        forms={forms}
                        activeInstanceStatuses={activeInstanceStatuses}
                        activePeriodType={activePeriodType}
                        redirectTo={redirectTo}
                        onGenerateDerivedInstances={onGenerateDerivedInstances}
                    />
                ))}
            </div>
        </Box>
    );
}
CompletenessListComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    completenessList: PropTypes.arrayOf(PropTypes.object).isRequired,
    redirectTo: PropTypes.func.isRequired,
    onGenerateDerivedInstances: PropTypes.func.isRequired,
};
export default withStyles(styles)(CompletenessListComponent);
