import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, withStyles } from '@material-ui/core';

import CompletenessFiltersComponent from './CompletenessFiltersComponent';
import CompletenessPeriodComponent from './CompletenessPeriodComponent';
import commonStyles from '../../../styles/common';
import { PERIOD_TYPE_QUARTERLY } from '../periods';
import { groupCompletenessData } from '../utils';


const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

function CompletenessListComponent({
    classes, completenessList, instanceStatusList, params,
}) {
    const [groupByPeriodType, setGroupByPeriodType] = useState(PERIOD_TYPE_QUARTERLY);
    const groupedCompletenessData = useMemo(
        () => groupCompletenessData(completenessList, groupByPeriodType),
        [completenessList, groupByPeriodType],
    );

    return (
        <Box className={classes.containerFullHeightNoTabPadded}>
            <CompletenessFiltersComponent
                baseUrl="completeness"
                params={params}
            />
            <div className={classes.marginTop}>
                {
                    Object.entries(groupedCompletenessData).map(([periodKey, periodData]) => (
                        <CompletenessPeriodComponent
                            key={periodKey}
                            data={periodData}
                            instanceStatus={instanceStatusList}
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
    instanceStatusList: PropTypes.arrayOf(PropTypes.object).isRequired,
    params: PropTypes.object.isRequired,
};
export default withStyles(styles)(CompletenessListComponent);
