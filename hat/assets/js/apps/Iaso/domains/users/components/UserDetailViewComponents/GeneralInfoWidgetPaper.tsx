import React from 'react';
import { Box, Table, TableBody } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { WidgetPaperRow as Row } from 'Iaso/components/papers/WidgetPaperRow';
import MESSAGES from 'Iaso/domains/users/messages';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';
import { SxStyles } from 'Iaso/types/general';

type Props = {
    savingProfile?: boolean;
    profile?: ProfileRetrieveResponseItem;
};

const styles: SxStyles = {
    badge: {
        // @ts-ignore
        border: theme => `3px solid ${theme.palette.ligthGray.border}`,
        borderRadius: theme => theme.spacing(3),
        width: theme => theme.spacing(3),
        height: theme => theme.spacing(3),
        display: 'inline-block',
        outline: 'none !important',
    },
};

export const GeneralInfoWidgetPaper = ({
    savingProfile = false,
    profile,
}: Props) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.generalInfo)}
            data-testid={'general-info-box'}
        >
            {savingProfile ? (
                <Box sx={{ my: 2 }}>
                    <LoadingSpinner absolute={false} fixed={false} />
                </Box>
            ) : (
                <Table size="small">
                    <TableBody>
                        <Row
                            field={{
                                label: formatMessage(MESSAGES.userName),
                                value: profile?.userName,
                            }}
                        />
                        <Row
                            field={{
                                label: formatMessage(MESSAGES.firstName),
                                value: profile?.firstName,
                            }}
                        />
                        <Row
                            field={{
                                label: formatMessage(MESSAGES.lastName),
                                value: profile?.lastName,
                            }}
                        />
                        <Row
                            field={{
                                label: formatMessage(MESSAGES.email),
                                value: profile?.email && (
                                    <a href={`mailto:${profile?.email}`}>
                                        {profile?.email}
                                    </a>
                                ),
                            }}
                        />
                        <Row
                            field={{
                                label: formatMessage(MESSAGES.language),
                                value: profile?.language,
                            }}
                        />
                        <Row
                            field={{
                                label: formatMessage(MESSAGES.organization),
                                value: profile?.organization,
                            }}
                        />
                        <Row
                            field={{
                                label: formatMessage(MESSAGES.phoneNumber),
                                value: profile?.phoneNumber && (
                                    <a href={`tel:${profile?.phoneNumber}`}>
                                        {profile?.phoneNumber}
                                    </a>
                                ),
                            }}
                        />
                        <Row
                            field={{
                                label: formatMessage(MESSAGES.homePage),
                                value: profile?.homePage,
                            }}
                        />
                        <Row
                            field={{
                                label: formatMessage(MESSAGES.color),
                                value: profile?.color && (
                                    <Box
                                        component="span"
                                        data-testid={'user-color-badge'}
                                        sx={{
                                            ...styles.badge,
                                            backgroundColor: profile?.color,
                                        }}
                                        tabIndex={0}
                                    />
                                ),
                            }}
                        />
                    </TableBody>
                </Table>
            )}
        </WidgetPaper>
    );
};
