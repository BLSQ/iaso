import React, { FunctionComponent } from 'react';
import {
    useSafeIntl,
    LoadingSpinner,
    IntlFormatMessage,
    textPlaceholder,
} from 'bluesquare-components';

import { Grid, Box } from '@mui/material';
import moment from 'moment';
import { usePrettyPeriod } from '../../../periods/utils';
import WidgetPaper from '../../../../components/papers/WidgetPaperComponent';

import { getDisplayName, User } from '../../../../utils/usersUtils';
import { LinkToOrgUnit } from '../../../orgUnits/components/LinkToOrgUnit';
import { useGetOrgUnitDetail } from '../../../orgUnits/hooks/requests/useGetOrgUnitDetail';

import MESSAGES from '../messages';
import { LinkToForm } from '../../../forms/components/LinkToForm';
import InstanceLogInfosRow from './InstanceLogInfosRow';

type Props = {
    user: User | undefined;
    infos: Record<string, any> | undefined;
    loading: boolean;
};

export const InstanceLogInfos: FunctionComponent<Props> = ({
    user,
    infos,
    loading,
}) => {
    const formatPeriod = usePrettyPeriod();
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const { data: currentOrgUnit } = useGetOrgUnitDetail(infos?.org_unit);

    return (
        <Box mt={2}>
            <WidgetPaper
                expandable
                isExpanded
                title={formatMessage(MESSAGES.infos)}
                padded
            >
                {loading && (
                    <LoadingSpinner
                        fixed={false}
                        transparent
                        padding={4}
                        size={25}
                    />
                )}
                {!loading && (
                    <Grid container spacing={1}>
                        <InstanceLogInfosRow
                            label={formatMessage(MESSAGES.last_modified_by)}
                            value={
                                user ? getDisplayName(user) : textPlaceholder
                            }
                        />
                        <InstanceLogInfosRow
                            label={formatMessage(MESSAGES.updated)}
                            value={moment(infos?.updated_at).format('LTS')}
                        />
                        <InstanceLogInfosRow
                            label={formatMessage(MESSAGES.org_unit)}
                            value={<LinkToOrgUnit orgUnit={currentOrgUnit} />}
                            isValueLink
                        />
                        <InstanceLogInfosRow
                            label={formatMessage(MESSAGES.form)}
                            value={
                                <LinkToForm
                                    formId={infos?.form}
                                    formName={infos?.name}
                                />
                            }
                            isValueLink
                        />
                        <InstanceLogInfosRow
                            label={formatMessage(MESSAGES.form_version)}
                            value={infos?.json._version}
                        />
                        <InstanceLogInfosRow
                            label={formatMessage(MESSAGES.period)}
                            value={formatPeriod(infos?.period)}
                        />
                        <InstanceLogInfosRow
                            label={formatMessage(MESSAGES.deleted)}
                            value={formatMessage(
                                infos?.deleted ? MESSAGES.yes : MESSAGES.no,
                            )}
                            valueColor={infos?.deleted ? 'error' : 'inherit'}
                        />
                    </Grid>
                )}
            </WidgetPaper>
        </Box>
    );
};
