import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { useLocation } from 'react-router-dom';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from './messages';

const baseUrl = baseUrls.vaccineRepository;
const embeddedVaccineRepositoryUrl = baseUrls.embeddedVaccineRepository;

export const VaccineRepository: FunctionComponent = () => {
    const location = useLocation();
    const { formatMessage } = useSafeIntl();
    const isEmbedded = location.pathname.includes(embeddedVaccineRepositoryUrl);
    return (
        <>
            {!isEmbedded && (
                <TopBar
                    title={formatMessage(MESSAGES.title)}
                    displayBackButton={false}
                />
            )}
            REPOSITORY
        </>
    );
};
