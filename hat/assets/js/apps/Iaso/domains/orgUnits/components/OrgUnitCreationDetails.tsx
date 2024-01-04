import moment from 'moment';
import React, { FunctionComponent, ReactNode } from 'react';
import { Table, TableBody, TableRow, TableCell } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import GpsOffIcon from '@mui/icons-material/GpsOff';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { OrgUnit } from '../types/orgUnit';
import { useCurrentUser } from '../../../utils/usersUtils';
import MESSAGES from '../messages';
import { NumberCell } from '../../../components/Cells/NumberCell';

type RowProps = {
    label: string | ReactNode;
    value?: string | ReactNode;
    dataTestId?: string;
};

const Row: FunctionComponent<RowProps> = ({ label, value, dataTestId }) => {
    return (
        <TableRow>
            <TableCell>{label}</TableCell>
            <TableCell data-test={dataTestId}>
                {typeof value === 'number' ? (
                    <NumberCell value={value} />
                ) : (
                    value
                )}
            </TableCell>
        </TableRow>
    );
};

type Props = {
    orgUnit: OrgUnit;
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
    const orgUnitCreatedAt = moment.unix(orgUnit.created_at).format('LTS');
    const orgUnitUpdatedAt = moment.unix(orgUnit.updated_at).format('LTS');
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
