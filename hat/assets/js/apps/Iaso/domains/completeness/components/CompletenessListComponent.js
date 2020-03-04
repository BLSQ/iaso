import React from 'react';
import PropTypes from 'prop-types';
import { Box, withStyles } from '@material-ui/core';

import CompletenessFiltersComponent from './CompletenessFiltersComponent';
import CompletenessPeriodComponent from './CompletenessPeriodComponent';
import commonStyles from '../../../styles/common';


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
    return (
        <Box className={classes.containerFullHeightNoTabPadded}>
            <CompletenessFiltersComponent
                baseUrl="completeness"
                params={params}
            />
            <div className={classes.marginTop}>
                {
                    Object.entries(completenessList).map(([periodKey, periodData]) => (
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
