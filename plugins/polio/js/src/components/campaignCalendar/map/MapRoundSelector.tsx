/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import {
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { useStyles } from '../Styles';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import MESSAGES from '../../../constants/messages';
import { DropdownOptions } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';

type Props = {
    label: string;
    selection: 'all' | 'latest' | number;
    // eslint-disable-next-line no-unused-vars
    onChange: (value: 'all' | 'latest' | number) => void;
    options: DropdownOptions<'all' | 'latest' | number>[];
};

const MapRoundSelector: FunctionComponent<Props> = ({
    label,
    selection,
    onChange,
    options,
}) => {
    const classes = useStyles();
    const parsedSelection =
        typeof selection === 'number' ? String(selection) : selection;
    console.log('selection', selection, 'parsed', parsedSelection);

    const handleChange = useCallback(
        (_keyValue: string, value: 'all' | 'latest' | number) => {
            const parsed = parseInt(value as unknown as string, 10);
            if (!Number.isNaN(parsed)) {
                onChange(parsed);
            } else {
                onChange(value);
            }
        },
        [onChange],
    );
    return (
        <Accordion elevation={1} className={classes.mapLegendCampaigns}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendCampaignTitle}
                >
                    {/* <FormattedMessage {...MESSAGES[label]} /> */}
                    La la land
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box display="block">
                    <InputComponent
                        type="radio"
                        keyValue="showRound"
                        value={parsedSelection}
                        onChange={handleChange}
                        options={options}
                        labelString="Shape of water"
                    />
                </Box>
            </AccordionDetails>
        </Accordion>
    );
};

export { MapRoundSelector };
