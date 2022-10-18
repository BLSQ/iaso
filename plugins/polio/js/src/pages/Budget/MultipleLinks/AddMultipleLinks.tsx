import { Box, Grid, makeStyles, Typography } from '@material-ui/core';
import { useFormikContext } from 'formik';
import React, { FunctionComponent, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl, IconButton } from 'bluesquare-components';
import AddIcon from '@material-ui/icons/Add';
import classNames from 'classnames';
import MESSAGES from '../../../constants/messages';
import { NamedLink } from './NamedLink';
import { StepForm } from '../types';

type Props = { required?: boolean };
const useStyles = makeStyles(theme => ({
    addLink: {
        position: 'absolute',
        bottom: theme.spacing(13.8),
        left: theme.spacing(8),
    },
    title: {
        display: 'inline',
    },
}));

export const AddMultipleLinks: FunctionComponent<Props> = ({
    required = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { setFieldValue, values } = useFormikContext<StepForm>();

    const links = useMemo(() => values?.links ?? [], [values?.links]);

    const handleAddlink = () => {
        const newLinks = [...links, {}];
        if (links.length === 0) {
            newLinks.push({});
        }
        setFieldValue(`links`, newLinks);
    };

    return (
        <>
            <div>
                <Typography className={classNames(classes.title)}>
                    {formatMessage(MESSAGES.links)}
                    {required && <sup>*</sup>}
                </Typography>
            </div>
            <Box mt={1}>
                {links.length > 1 &&
                    links.map((_link, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <NamedLink index={index} key={`lonk-${index}`} />
                    ))}
                {/* if the condition is on length === 0 the UI will flicker and the field lose focus because of re-render */}
                {links.length <= 1 && <NamedLink index={0} />}

                <Grid container spacing={2}>
                    <Box mb={2} className={classes.addLink}>
                        <IconButton
                            onClick={handleAddlink}
                            variant="outlined"
                            overrideIcon={AddIcon}
                            tooltipMessage={MESSAGES.addLink}
                            iconSize="small"
                        >
                            {formatMessage(MESSAGES.addLink)}
                        </IconButton>
                    </Box>
                </Grid>
            </Box>
        </>
    );
};
