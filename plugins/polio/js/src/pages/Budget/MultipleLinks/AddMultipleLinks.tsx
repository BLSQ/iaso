import { Box, Button, Grid } from '@material-ui/core';
import { useFormikContext } from 'formik';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl, IconButton } from 'bluesquare-components';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import MESSAGES from '../../../constants/messages';
import { NamedLink } from './NamedLink';

export const AddMultipleLinks: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const {
        setFieldValue,
        // @ts-ignore
        values,
    } = useFormikContext();

    // @ts-ignore
    const links = useMemo(() => values?.links ?? [], [values?.links]);

    const handleAddlink = () => {
        const newLinks = [...links, {}];
        if (links.length === 0) {
            newLinks.push({});
        }
        setFieldValue(`links`, newLinks);
    };

    const handleRemoveLastLink = useCallback(() => {
        if (links.length > 1) {
            const newLinks = [...links];
            newLinks.pop();
            setFieldValue(`links`, newLinks);
        }
    }, [setFieldValue, links]);

    return (
        <>
            {links.length > 0 &&
                links.map((_shipment, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Grid item xs={12} key={`lonk-${index}`}>
                        <Box mt={2}>
                            <NamedLink index={index} />
                        </Box>
                    </Grid>
                ))}
            {links.length === 0 && (
                <Grid item xs={12}>
                    <Box mt={2}>
                        <NamedLink index={0} />
                    </Box>
                </Grid>
            )}

            <Grid
                container
                item
                xs={12}
                spacing={2}
                direction="column"
                justifyContent="flex-end"
            >
                <Box mt={2} mb={2}>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-end"
                        spacing={2}
                    >
                        <Grid item>
                            <IconButton
                                onClick={handleAddlink}
                                variant="outlined"
                                overrideIcon={AddIcon}
                                tooltipMessage={MESSAGES.addLink}
                            >
                                {formatMessage(MESSAGES.addLink)}
                            </IconButton>
                        </Grid>
                        <Grid item>
                            <IconButton
                                onClick={handleRemoveLastLink}
                                disabled={!(links.length > 1)}
                                variant="outlined"
                                overrideIcon={RemoveIcon}
                                tooltipMessage={MESSAGES.removeLastLink}
                            >
                                {formatMessage(MESSAGES.removeLastLink)}
                            </IconButton>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        </>
    );
};
