import { Box, makeStyles, Divider } from '@material-ui/core';
import React, { FunctionComponent, useState, useEffect } from 'react';
import classnames from 'classnames';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import { CheckCircleOutline } from '@material-ui/icons';
import moment from 'moment';
import { findLast } from 'lodash';
import { Categories } from '../types';

type Props = {
    categories?: Categories;
};

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        '&.MuiStepper-root': {
            padding: 0,
            marginTop: theme.spacing(2),
        },
        '& .MuiBox-root': {
            alignItems: 'flex-start',
        },
    },
    step: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    checkboxWrapper: {
        display: 'flex',
        alignItems: 'center',
    },
    taskIcon: {
        transform: 'scale(0.85)',
        position: 'relative',
        top: -3,
    },
    taskDone: {
        color: theme.palette.success.main,
    },
    taskPending: {
        // @ts-ignore
        color: theme.palette.mediumGray.main,
    },
    itemLabel: {
        fontSize: '0.82rem',
    },
    divider: {
        height: '30px',
        // @ts-ignore
        backgroundColor: theme.palette.gray.main,
    },
    stepCompleted: {
        '& + div .MuiStepConnector-lineHorizontal': {
            borderColor: theme.palette.success.main,
        },
    },
    stepActive: {
        '& + div .MuiStepConnector-lineHorizontal': {
            // @ts-ignore
            borderColor: theme.palette.success.background,
        },
    },
    stepInactive: {
        '& + div .MuiStepConnector-lineHorizontal': {
            // @ts-ignore
            borderColor: theme.palette.gray.main,
        },
    },
}));

const getColor = category => {
    switch (category.color) {
        case 'lightgreen':
            return 'stepActive';
        case 'green':
            return 'stepCompleted';
        default:
            return 'stepInactive';
    }
};

export const BudgetTimeline: FunctionComponent<Props> = ({
    categories = [],
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const classes = useStyles();

    useEffect(() => {
        if (categories.length > 0) {
            // @ts-ignore
            const lastStepCompleted = findLast(
                categories,
                category => !category.completed,
            );

            const lastStepCompletedIndex = lastStepCompleted
                ? categories.indexOf(lastStepCompleted)
                : 0;
            setActiveStep(lastStepCompletedIndex);
        }
    }, [categories, activeStep]);
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
                        completed={category.completed}
                        active={category.active}
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
                                                    className={
                                                        classes.checkboxWrapper
                                                    }
                                                >
                                                    <CheckCircleOutline
                                                        className={classnames(
                                                            item.performed_by &&
                                                                classes.taskDone,
                                                            !item.performed_by &&
                                                                classes.taskPending,
                                                            classes.taskIcon,
                                                        )}
                                                    />
                                                    <Box
                                                        className={
                                                            classes.itemLabel
                                                        }
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
