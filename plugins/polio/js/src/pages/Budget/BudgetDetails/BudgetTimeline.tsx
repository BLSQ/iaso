import { Box, Divider } from '@material-ui/core';
import React, { FunctionComponent, useMemo } from 'react';
import classnames from 'classnames';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import moment from 'moment';
import { Categories, Item } from '../types';
import { TimelineStepIcon } from './TimelineStepIcon';
import { useStyles } from './styles';

type Props = {
    categories?: Categories;
};

const getColor = category => {
    switch (category.color) {
        case 'yellow':
            return 'stepActive';
        case 'green':
            return 'stepCompleted';
        default:
            return 'stepInactive';
    }
};

const findLatestStep = (steps: Item[]) => {
    const sorted = steps
        .filter(step => step.performed_at)
        .sort((step1, step2) =>
            moment(step1.performed_at).isAfter(moment(step2.performed_at)),
        );
    // API sends the data sorted by ascending date. We keep that order to avoid messing with the order for step swith the same timestamp (it happens)
    // So we need to get the last element of the sorted array
    return sorted[sorted.length - 1];
};

const isSameItem = (item1: Item, item2: Item): boolean => {
    return (
        item1?.label === item2?.label &&
        item1?.performed_at === item2?.performed_at
    );
};

export const BudgetTimeline: FunctionComponent<Props> = ({
    categories = [],
}) => {
    const classes = useStyles();

    const activeStep = useMemo(() => {
        if (categories.length > 0) {
            return categories.findIndex(category => !category.completed);
        }
        return 0;
    }, [categories]);
    const latestItem = useMemo(() => {
        return findLatestStep(categories.map(c => c.items).flat());
    }, [categories]);
    return (
        <Stepper
            className={classes.root}
            activeStep={activeStep}
            alternativeLabel
        >
            {categories?.map(category => {
                return (
                    <Step
                        className={classnames(
                            classes[getColor(category)],
                            classes.step,
                        )}
                        key={category.key}
                    >
                        <StepLabel>
                            <Box>
                                {category.label}

                                <Box display="flex" justifyContent="center">
                                    <Divider
                                        orientation="vertical"
                                        className={classes.divider}
                                    />
                                </Box>

                                <Box>
                                    {category.items.map((item, index) => {
                                        return (
                                            <Box
                                                // eslint-disable-next-line react/no-array-index-key
                                                key={`${
                                                    item.step_id || item.label
                                                }-${index}`}
                                                mb={1}
                                            >
                                                <Box
                                                    className={classnames(
                                                        classes.checkboxWrapper,
                                                        item.cancelled ||
                                                            item.skipped
                                                            ? classes.strikethrough
                                                            : '',
                                                    )}
                                                >
                                                    <TimelineStepIcon
                                                        item={item}
                                                    />
                                                    <Box
                                                        className={classnames(
                                                            classes.itemLabel,
                                                            isSameItem(
                                                                item,
                                                                latestItem,
                                                            ) &&
                                                                classes.latestItem,
                                                        )}
                                                    >
                                                        {item.label}
                                                        {item.performed_at &&
                                                            `: ${moment(
                                                                item.performed_at,
                                                            ).format('l')}`}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </StepLabel>
                    </Step>
                );
            })}
        </Stepper>
    );
};
