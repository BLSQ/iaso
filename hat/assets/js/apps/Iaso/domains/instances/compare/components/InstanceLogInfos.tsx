import React, { FunctionComponent, useMemo } from 'react';
import {
    useSafeIntl,
    LoadingSpinner,
    IntlFormatMessage,
    textPlaceholder,
} from 'bluesquare-components';

import { Grid, Box, Card, Typography } from '@mui/material';
import moment from 'moment';
import { usePrettyPeriod } from '../../../periods/utils';

import { getDisplayName, User } from '../../../../utils/usersUtils';
import { LinkToOrgUnit } from '../../../orgUnits/components/LinkToOrgUnit';
import { useGetOrgUnitDetail } from '../../../orgUnits/hooks/requests/useGetOrgUnitDetail';

import MESSAGES from '../messages';
import { LinkToForm } from '../../../forms/components/LinkToForm';
import InstanceLogInfosRow from './InstanceLogInfosRow';
import InputComponent from '../../../../components/forms/InputComponent';

type Props = {
    log: string;
    dropDownHandleChange: (key: string, value: string) => void;
    value: string | number | undefined;
    label: any;
    options: any;
    dropDownLoading: boolean;
    user: User | undefined;
    infos: Record<string, any> | undefined;
    loading: boolean;
    logTitle: string;
};

export const InstanceLogInfos: FunctionComponent<Props> = ({
    log,
    logTitle,
    dropDownHandleChange,
    value,
    label,
    options,
    dropDownLoading,
    user,
    infos,
    loading,
}) => {
    const formatPeriod = usePrettyPeriod();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const { data: currentOrgUnit } = useGetOrgUnitDetail(infos?.org_unit);
    const firstLogInfos = useMemo(
        () => [
            // Modified by
            {
                label: formatMessage(MESSAGES.last_modified_by),
                value: user ? getDisplayName(user) : textPlaceholder,
                index: 1,
            },
            // Updated at
            {
                label: formatMessage(MESSAGES.updated),
                value: moment(infos?.updated_at).format('LTS'),
                index: 2,
            },
            // OrgUnit hyperlink
            {
                label: formatMessage(MESSAGES.org_unit),
                value: <LinkToOrgUnit orgUnit={currentOrgUnit} />,
                index: 3,
            },
            // Form hyperlink
            {
                label: formatMessage(MESSAGES.form),
                value: (
                    <LinkToForm formId={infos?.form} formName={infos?.name} />
                ),
                index: 4,
            },
        ],
        [
            currentOrgUnit,
            formatMessage,
            infos?.form,
            infos?.name,
            infos?.updated_at,
            user,
        ],
    );
    const secondLogInfos = useMemo(
        () => [
            // Form version
            {
                label: formatMessage(MESSAGES.form_version),
                value: infos?.json._version,
                index: 5,
            },
            // Period
            {
                label: formatMessage(MESSAGES.period),
                value: formatPeriod(infos?.period),
                index: 6,
            },
            // Deleted
            {
                label: formatMessage(MESSAGES.deleted),
                value: formatMessage(
                    infos?.deleted ? MESSAGES.yes : MESSAGES.no,
                ),
                valueColor: infos?.deleted ? 'error' : 'inherit',
                index: 7,
            },
        ],
        [
            formatMessage,
            formatPeriod,
            infos?.deleted,
            infos?.json._version,
            infos?.period,
        ],
    );
    return (
        <Box mt={2}>
            <Card>
                {loading && (
                    <LoadingSpinner
                        fixed={false}
                        transparent
                        padding={4}
                        size={25}
                    />
                )}
                {!loading && (
                    <Grid container spacing={2} padding={2}>
                        <Grid item xs={12}>
                            <Typography variant="h5" fontWeight="bold">
                                {logTitle}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2" fontWeight="bold">
                                {formatMessage(MESSAGES.selectVersionToCompare)}
                            </Typography>
                            <InputComponent
                                clearable={false}
                                type="select"
                                keyValue={log}
                                onChange={dropDownHandleChange}
                                value={value}
                                label={label}
                                options={options}
                                loading={dropDownLoading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    {firstLogInfos.map(logInfo => (
                                        <InstanceLogInfosRow
                                            key={logInfo.index}
                                            label={logInfo.label}
                                            value={logInfo.value}
                                        />
                                    ))}
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    {secondLogInfos.map(logInfo => (
                                        <InstanceLogInfosRow
                                            key={logInfo.index}
                                            label={logInfo.label}
                                            value={logInfo.value}
                                            valueColor={logInfo.valueColor}
                                        />
                                    ))}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                )}
            </Card>
        </Box>
    );
};
