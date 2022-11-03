import { Box, makeStyles, Divider } from '@material-ui/core';
import React, { FunctionComponent, useState, useEffect } from 'react';
import classnames from 'classnames';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import { CheckCircleOutline } from '@material-ui/icons';
import moment from 'moment';
import { Categories } from '../types';

type Props = {
    categories?: Categories;
};

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        '&.MuiStepper-root': {
            paddingLeft: 0,
            paddingRight: 0,
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
    taskDone: {
        transform: 'scale(0.85)',
        color: theme.palette.success.main,
    },
    taskPending: {
        transform: 'scale(0.85)',
        // @ts-ignore
        color: theme.palette.mediumGray.main,
    },
    itemLabel: {
        fontSize: '0.82rem',
    },
    date: {
        paddingLeft: '1.5rem',
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
            const lastStepCompleted = categories.findLast(
                category => category.completed === false,
            );

            const lastStepCompletedIndex =
                categories.indexOf(lastStepCompleted);
            setActiveStep(lastStepCompletedIndex);
        }
    }, [categories, activeStep]);

    return (
        <>
            <Stepper
                className={classes.root}
                activeStep={activeStep}
                alternativeLabel
            >
                {categories?.map(category => (
                    <Step
                        className={classnames(
                            classes[getColor(category)],
                            classes.step,
                        )}
                        key={category.key}
                        completed={category.completed}
                        active={category.active}
                    >
                        <StepLabel>{category.label}</StepLabel>
                        <Box display="flex" justifyContent="center">
                            <Divider
                                orientation="vertical"
                                className={classes.divider}
                            />
                        </Box>

                        <Box>
                            {category.items.map(item => (
                                <Box key={item.step_id} mb={1}>
                                    <div className={classes.checkboxWrapper}>
                                        {item.performed_by ? (
                                            <CheckCircleOutline
                                                className={classes.taskDone}
                                            />
                                        ) : (
                                            <CheckCircleOutline
                                                className={classes.taskPending}
                                            />
                                        )}
                                        <div className={classes.itemLabel}>
                                            {item.label}
                                        </div>
                                    </div>
                                    {item.performed_at && (
                                        <div className={classes.date}>
                                            {moment(item.performed_at).format(
                                                'l',
                                            )}
                                        </div>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Step>
                ))}
            </Stepper>
        </>
    );
};
