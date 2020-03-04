import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, withStyles } from '@material-ui/core';

import CompletenessFiltersComponent from './CompletenessFiltersComponent';
import CompletenessPeriodComponent from './CompletenessPeriodComponent';
import commonStyles from '../../../styles/common';
import { PERIOD_TYPE_QUARTERLY } from '../periods';
import { INSTANCE_STATUSES } from '../../instances/constants';
import { groupCompletenessData } from '../utils';


const styles = theme => commonStyles(theme);

function CompletenessListComponent({
    classes, completenessList,
}) {
    const [activePeriodType, setActivePeriodType] = useState(PERIOD_TYPE_QUARTERLY);
    const [activeInstanceStatuses, setActiveInstanceStatuses] = useState(INSTANCE_STATUSES);

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
                {
                    Object.entries(groupedCompletenessData).map(([periodKey, periodData]) => (
                        <CompletenessPeriodComponent
                            key={periodKey}
                            data={periodData}
                            activeInstanceStatuses={activeInstanceStatuses}
                        />
                    ))
                }
            </div>
        </Box>
    );
}
CompletenessListComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    completenessList: PropTypes.arrayOf(PropTypes.object).isRequired,
};
export default withStyles(styles)(CompletenessListComponent);
