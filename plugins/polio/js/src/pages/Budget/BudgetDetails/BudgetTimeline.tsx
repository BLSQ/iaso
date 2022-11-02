import { Box, makeStyles } from '@material-ui/core';
import React, { FunctionComponent, useState, useEffect } from 'react';
// @ts-ignore
// import { useSafeIntl } from 'bluesquare-components';
// import classnames from 'classnames';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import { CheckBox, CheckBoxOutlineBlank } from '@material-ui/icons';
// import MESSAGES from '../../../constants/messages';
import moment from 'moment';
import { Categories } from '../types';
import {
    BUDGET_COMPLETED_COLOR,
    BUDGET_PENDING_COLOR,
    BUDGET_INACTIVE_COLOR,
} from '../../../styles/constants';

type Props = {
    categories?: Categories;
    orientation?: string;
};

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        '&.MuiStepper-root': {
            paddingLeft: 0,
            paddingRight: 0,
        },
        '& .MuiStepConnector-lineHorizontal': {
            borderTopWidth: '12px',
            borderColor: 'grey',
        },
        '& .MuiBox-root': {
            alignItems: 'flex-start',
        },
    },
    step: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'red',
    },
    item: {
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    stepPending: {
        '& .MuiStepConnector-lineHorizontal': {
            borderColor: BUDGET_PENDING_COLOR,
        },
    },
    stepCompleted: {
        '& .MuiStepConnector-lineHorizontal': {
            borderColor: BUDGET_COMPLETED_COLOR,
        },
    },
    stepInactive: {
        '& .MuiStepConnector-lineHorizontal': {
            borderColor: BUDGET_INACTIVE_COLOR,
        },
    },
}));

const getClassName = category => {
    switch (category.completed) {
        case true:
            return 'stepCompleted';
        case false:
            return 'stepPending';
        default:
            return 'stepInactive';
    }
};

export const BudgetTimeline: FunctionComponent<Props> = ({
    categories = [],
    orientation,
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const classes = useStyles();

    useEffect(() => {
        if (categories.length > 0) {
            const lastStepCompleted = categories?.findLast(
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
                classes={classes}
                activeStep={activeStep}
                alternativeLabel
                orientation={orientation}
            >
                {categories?.map(category => (
                    <Step
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                        className={classes[getClassName(category)]}
                        key={category.key}
                        completed={category.completed}
                        active={category.active}
                    >
                        <StepLabel>{category.label}</StepLabel>
                        <Box className={classes.item}>
                            {category.items.map(item => (
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="flex-start"
                                    flexDirection="column"
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {' '}
                                        {item.performed_by ? (
                                            <CheckBox color="primary" />
                                        ) : (
                                            <CheckBoxOutlineBlank />
                                        )}
                                        <div>{item.label}</div>
                                    </div>

                                    {item.performed_at && (
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                        >
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
