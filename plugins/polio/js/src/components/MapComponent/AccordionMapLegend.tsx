/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import {
    Grid,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { IntlMessage } from 'bluesquare-components';
import { useStyles } from '../campaignCalendar/Styles';

import MESSAGES from '../../constants/messages';
import { convertWidth } from '../../utils';

type Props = {
    data: { id: string; value: string; color: string }[];
    title: IntlMessage;
    noDataMsg: IntlMessage;
    defaultExpanded?: boolean;
    width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
};

export const AccordionMapLegend: FunctionComponent<Props> = ({
    data,
    title,
    noDataMsg,
    defaultExpanded = false,
    width = 'sm',
}) => {
    const classes = useStyles();
    return (
        <Accordion
            elevation={1}
            style={{ width: convertWidth(width) }}
            defaultExpanded={defaultExpanded}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendCampaignTitle}
                >
                    <FormattedMessage {...title} />
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box display="block">
                    {data.length === 0 && (
                        <div style={{ justifyContent: 'center' }}>
                            <FormattedMessage {...noDataMsg} />
                        </div>
                    )}
                    {data.map(item => (
                        <Grid container spacing={1} key={item.id}>
                            {item.color && (
                                <Grid
                                    item
                                    sm={3}
                                    container
                                    className={classes.mapLegendLabel}
                                    justifyContent="flex-start"
                                >
                                    <span
                                        className={classes.roundColor}
                                        style={{
                                            borderColor: item.color,
                                        }}
                                    />
                                </Grid>
                            )}
                            {!item.color && (
                                <Grid
                                    item
                                    sm={9}
                                    container
                                    justifyContent="flex-start"
                                >
                                    <Typography variant="body2">
                                        <FormattedMessage
                                            {...MESSAGES[item.id]}
                                        />
                                    </Typography>
                                </Grid>
                            )}
                            <Grid
                                item
                                sm={item.color ? 9 : 3}
                                container
                                justifyContent="flex-end"
                                alignItems="center"
                            >
                                <Typography
                                    variant="body2"
                                    className={classes.mapLegendText}
                                >
                                    {item.value}
                                </Typography>
                            </Grid>
                        </Grid>
                    ))}
                </Box>
            </AccordionDetails>
        </Accordion>
    );
};
