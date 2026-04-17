import React from 'react';
import { Alert, Chip } from '@mui/material';
import { Box } from '@mui/system';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from 'Iaso/domains/users/messages';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';
import { SxStyles } from 'Iaso/types/general';

type Props = {
    savingProfile?: boolean;
    profile?: ProfileRetrieveResponseItem;
};

const styles: SxStyles = {
    ouChip: {
        backgroundColor: theme => theme.palette.secondary.main,
        fontSize: '0.8rem',
        color: 'white',
    },
};

export const OrgUnitWriteTypePaper = ({ savingProfile, profile }: Props) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.orgUnitWriteTypes)}
            data-testid={'org-unit-write-type-info-box'}
        >
            {savingProfile && <LoadingSpinner absolute fixed={false} />}
            {!!profile?.editable_org_unit_types?.length && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 1,
                        px: 2,
                        pb: 2,
                    }}
                >
                    {profile?.editable_org_unit_types?.map(orgUnitWriteType => (
                        <Box key={`orgUnitWriteType-${orgUnitWriteType.id}`}>
                            <Chip
                                sx={styles.ouChip}
                                label={orgUnitWriteType.name}
                                size={'small'}
                            />
                        </Box>
                    ))}
                </Box>
            )}
            {!profile?.editable_org_unit_types?.length && (
                <Alert color={'info'} severity={'info'} sx={{ mx: 2, mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </WidgetPaper>
    );
};
