/* eslint-disable camelcase */
import React, { FunctionComponent, useState } from 'react';
import { Box, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import {
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';

import InputComponent from '../../../components/forms/InputComponent';
import InstanceFileContent from '../../instances/components/InstanceFileContent';
import MESSAGES from '../messages';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { Instance } from '../../instances/types/instance';

type Props = {
    referenceInstances: Instance[];
};

const useStyles = makeStyles(() => ({
    formContents: {
        width: '100%',
    },
}));

export const OrgUnitMultiReferenceInstances: FunctionComponent<Props> = ({
    referenceInstances,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [active, setActive] = useState<Instance>(referenceInstances[0]);
    const options = referenceInstances.map(instance => ({
        value: instance.id,
        label: instance.form_name,
    }));
    const handleChange = value => {
        const instance = referenceInstances.filter(i => i.id === value)[0];
        setActive(instance);
    };

    return (
        <>
            <Grid container item xs={12} md={8}>
                <Box mt={4} className={classes.formContents}>
                    {referenceInstances.length > 1 && (
                        <InputComponent
                            type="select"
                            clearable={false}
                            onChange={(_, value) => handleChange(value)}
                            label={MESSAGES.multiReferenceInstancesLabel}
                            options={options}
                            keyValue="referenceInstance"
                            value={active.id}
                        />
                    )}

                    <br />

                    <WidgetPaper
                        id="form-contents"
                        title={`${formatMessage(MESSAGES.detailTitle)} - ${
                            active.form_name
                        }`}
                        IconButton={IconButtonComponent}
                        iconButtonProps={{
                            onClick: () =>
                                window.open(active.file_url, '_blank'),
                            icon: 'xml',
                            color: 'secondary',
                            tooltipMessage: MESSAGES.downloadXml,
                        }}
                    >
                        <InstanceFileContent instance={active} />
                    </WidgetPaper>
                </Box>
            </Grid>
        </>
    );
};
