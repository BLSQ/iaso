import moment from 'moment';
import React, { FunctionComponent, ReactNode } from 'react';
import {
    makeStyles,
    Table,
    TableBody,
    TableRow,
    TableCell,
} from '@material-ui/core';
import GpsFixedIcon from '@material-ui/icons/GpsFixed';
import GpsOffIcon from '@material-ui/icons/GpsOff';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { OrgUnit } from '../types/orgUnit';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: '60vh',
        marginBottom: 0,
    },
}));

type RowProps = {
    label: string | ReactNode;
    value?: string | ReactNode;
};

const Row: FunctionComponent<RowProps> = ({ label, value }) => {
    const classes: Record<string, string> = useStyles();
    return (
        <TableRow>
            <TableCell className={classes.leftCell}>{label}</TableCell>
            <TableCell>{value}</TableCell>
        </TableRow>
    );
};

type Props = {
    orgUnit: OrgUnit;
};

export const OrgUnitCreationDetails: FunctionComponent<Props> = ({
    orgUnit,
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

    return (
        <>
            {!orgUnit && <LoadingSpinner absolute />}

            <WidgetPaper showHeader={false} title="">
                <Table size="medium">
                    <TableBody>
                        <Row
                            label={formatMessage(MESSAGES.source)}
                            value={orgUnit.source ?? '-'}
                        />
                        <Row
                            label={formatMessage(MESSAGES.creator)}
                            value={orgUnit.creator.value ?? '-'}
                        />
                        <Row
                            label={formatMessage(MESSAGES.created_at)}
                            value={orgUnit.created_at ? orgUnitCreatedAt : '-'}
                        />
                        <Row
                            label={formatMessage(MESSAGES.updated_at)}
                            value={orgUnit.updated_at ? orgUnitUpdatedAt : '-'}
                        />
                        {!orgUnit.has_geo_json && !latitudeLongitude && (
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
                                />

                                <Row
                                    label={formatMessage(MESSAGES.longitude)}
                                    value={orgUnit.longitude}
                                />
                            </>
                        )}
                    </TableBody>
                </Table>
            </WidgetPaper>
        </>
    );
};
