import React, { FunctionComponent, ReactNode } from 'react';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GpsOffIcon from '@mui/icons-material/GpsOff';
import { Table, TableBody, TableRow, TableCell } from '@mui/material';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import moment from 'moment';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { useCurrentUser } from '../../../utils/usersUtils';
import MESSAGES from '../messages';
import { OrgUnit } from '../types/orgUnit';

type RowProps = {
    label: string | ReactNode;
    value?: string | ReactNode;
    dataTestId?: string;
};

const Row: FunctionComponent<RowProps> = ({ label, value, dataTestId }) => {
    return (
        <TableRow>
            <TableCell>{label}</TableCell>
            <TableCell data-test={dataTestId}>{value}</TableCell>
        </TableRow>
    );
};

type Props = {
    orgUnit: Partial<OrgUnit>;
    params: Record<string, any>;
};

export const OrgUnitCreationDetails: FunctionComponent<Props> = ({
    orgUnit,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const latitude = `${formatMessage(MESSAGES.latitude)}: ${
        orgUnit.latitude
    },`;
    const longitude = `${formatMessage(MESSAGES.longitude)}: ${
        orgUnit.longitude
    },`;

    const latitudeLongitude =
        orgUnit.latitude && orgUnit.longitude ? latitude + longitude : false;
    const orgUnitCreatedAt = orgUnit.created_at
        ? moment.unix(orgUnit.created_at).format('LTS')
        : '-';
    const orgUnitUpdatedAt = orgUnit.updated_at
        ? moment.unix(orgUnit.updated_at).format('LTS')
        : '-';
    const isNewOrgunit = params.orgUnitId === '0';
    const { account } = useCurrentUser();

    return (
        <>
            {!orgUnit && <LoadingSpinner absolute />}

            <WidgetPaper showHeader={false} title="">
                <Table size="medium">
                    <TableBody>
                        <Row
                            label={formatMessage(MESSAGES.source)}
                            value={
                                orgUnit.source ??
                                account.default_version?.data_source.name
                            }
                            dataTestId="source"
                        />
                        <Row
                            label={formatMessage(MESSAGES.creator)}
                            value={orgUnit.creator ?? '-'}
                            dataTestId="creator"
                        />
                        <Row
                            label={formatMessage(MESSAGES.created_at)}
                            value={orgUnit.created_at ? orgUnitCreatedAt : '-'}
                            dataTestId="created_at"
                        />
                        <Row
                            label={formatMessage(MESSAGES.updated_at)}
                            value={orgUnit.updated_at ? orgUnitUpdatedAt : '-'}
                            dataTestId="updated_at"
                        />
                        {!isNewOrgunit &&
                            !orgUnit.has_geo_json &&
                            !latitudeLongitude && (
                                <Row
                                    label={<GpsOffIcon color="primary" />}
                                    value={formatMessage(
                                        MESSAGES.hasNoGeometryAndGps,
                                    )}
                                />
                            )}
                        {orgUnit.has_geo_json && (
                            <Row
                                label={<GpsFixedIcon color="primary" />}
                                value={formatMessage(MESSAGES.hasGeometry)}
                            />
                        )}
                        {latitudeLongitude && (
                            <>
                                <Row
                                    label={formatMessage(MESSAGES.latitude)}
                                    value={orgUnit.latitude}
                                    dataTestId="latitude"
                                />

                                <Row
                                    label={formatMessage(MESSAGES.longitude)}
                                    value={orgUnit.longitude}
                                    dataTestId="longitude"
                                />
                            </>
                        )}
                    </TableBody>
                </Table>
            </WidgetPaper>
        </>
    );
};
