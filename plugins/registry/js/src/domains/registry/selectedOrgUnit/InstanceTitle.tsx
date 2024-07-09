import { Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useMemo } from 'react';

import moment from 'moment';
import { MESSAGES } from '../messages';

import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { Instance } from '../../../../../../../hat/assets/js/apps/Iaso/domains/instances/types/instance';
import { OrgUnit } from '../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import { baseUrls } from '../../../constants/urls';
import { RegistryParams } from '../../../types';

type Props = {
    orgUnit?: OrgUnit;
    currentInstance?: Instance;
    params: RegistryParams;
    instances: Instance[];
    isFetching: boolean;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    subTitle: {
        fontSize: '1.15rem',
    },
    paperTitle: {
        padding: theme.spacing(2),
        display: 'flex',
    },
    paperTitleButtonContainer: {
        position: 'relative',
    },
    paperTitleButton: {
        position: 'absolute',
        right: -theme.spacing(1),
        top: -theme.spacing(1),
    },
}));

export const InstanceTitle: FunctionComponent<Props> = ({
    orgUnit,
    currentInstance,
    params,
    instances,
    isFetching,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();

    const instancesOptions = useMemo(() => {
        return (instances || []).map(instance => {
            const isReferenceInstance = orgUnit?.reference_instances?.some(
                ref => ref.id === instance.id,
            );
            const label = `${instance.form_name} (${
                isReferenceInstance
                    ? `${formatMessage(MESSAGES.referenceInstance)} - `
                    : ''
            }${moment.unix(instance.created_at).format('LTS')})`;
            return {
                label,
                value: instance.id,
            };
        });
    }, [formatMessage, instances, orgUnit?.reference_instances]);

    const handleChange = useCallback(
        (_, submissionId) => {
            const newParams: RegistryParams = {
                ...params,
                submissionId,
            };
            redirectToReplace(baseUrls.registry, newParams);
        },
        [redirectToReplace, params],
    );
    return (
        <Grid container className={classes.paperTitle}>
            <Grid xs={8} item>
                <InputComponent
                    type="select"
                    disabled={isFetching}
                    keyValue="instance"
                    onChange={handleChange}
                    value={isFetching ? undefined : currentInstance?.id}
                    label={MESSAGES.submission}
                    options={instancesOptions}
                    loading={isFetching}
                    clearable={false}
                    withMarginTop={false}
                />
            </Grid>
        </Grid>
    );
};
