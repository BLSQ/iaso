import { Box, makeStyles } from '@material-ui/core';
import React, { FunctionComponent, useEffect, useState } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import { CheckBox } from '@material-ui/icons';
import MESSAGES from '../../../constants/messages';
import { Categories } from '../types';

type Props = {
    categories?: Categories;
};

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        '& .MuiStepConnector-lineHorizontal': {
            borderTopWidth: '12px',
            borderColor: 'grey',
        },
    },
    item: {
        marginTop: '20px',
    },
}));

export const BudgetTimeline: FunctionComponent<Props> = ({
    categories = [],
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const classes = useStyles();

    return (
        <>
            <Stepper classes={classes} activeStep={activeStep} alternativeLabel>
                {categories?.map(category => (
                    <Step key={category.key}>
                        <StepLabel>{category.label}</StepLabel>
                        <Box className={classes.item}>
                            {category.items.map(item => (
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <CheckBox />
                                    {item.label}
                                </Box>
                            ))}
                        </Box>
                    </Step>
                ))}
            </Stepper>
        </>
    );
};
