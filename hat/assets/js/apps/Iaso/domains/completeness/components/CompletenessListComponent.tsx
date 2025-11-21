import React, { useState, useMemo, FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';
import CompletenessFiltersComponent from './CompletenessFiltersComponent';
import CompletenessPeriodComponent from './CompletenessPeriodComponent';
import { PERIOD_TYPE_QUARTER } from '../../periods/constants';
import { INSTANCE_STATUSES } from '../../instances/constants';
import { groupCompletenessData } from '../utils';

const useStyles = makeStyles(theme => commonStyles(theme));

type Props = {
    completenessList: Record<string, any>[];
};

const CompletenessListComponent: FunctionComponent<Props> = ({
    completenessList,
}) => {
    const classes: Record<string, string> = useStyles();
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
                {/* FIXME either bad typing or incorrect use of map */}
                {groupedCompletenessData.map(({ period, forms }) => (
                    <CompletenessPeriodComponent
                        key={period.periodString}
                        period={period}
                        forms={forms}
                        activeInstanceStatuses={activeInstanceStatuses}
                        activePeriodType={activePeriodType}
                    />
                ))}
            </div>
        </Box>
    );
};

export default CompletenessListComponent;
