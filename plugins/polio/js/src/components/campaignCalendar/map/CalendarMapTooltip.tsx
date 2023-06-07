/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Tooltip } from 'react-leaflet';
import MESSAGES from '../../../constants/messages';

type Props = {
    type: 'regular' | 'merged';
    campaign: string;
    country: string;
    region?: string;
    district?: string;
    vaccine?: string;
    vaccines?: string;
};

export const CalendarMapTooltip: FunctionComponent<Props> = ({
    type,
    campaign,
    country,
    region = '',
    district = '',
    vaccine,
    vaccines,
}) => {
    return (
        <>
            {/* @ts-ignore TODO: fix this type problem */}
            <Tooltip pane="popupPane">
                <div>
                    <FormattedMessage {...MESSAGES.campaign} />
                    {`: ${campaign}`}
                </div>
                <div>
                    <FormattedMessage {...MESSAGES.country} />
                    {`: ${country}`}
                </div>
                {type === 'regular' && (
                    <>
                        <div>
                            <FormattedMessage {...MESSAGES.region} />
                            {`: ${region}`}
                        </div>
                        <div>
                            <FormattedMessage {...MESSAGES.district} />
                            {`: ${district}`}
                        </div>
                    </>
                )}
                {vaccines ? (
                    <div>
                        <FormattedMessage {...MESSAGES.vaccines} />
                        {`: ${vaccines}`}
                    </div>
                ) : (
                    <div>
                        <FormattedMessage {...MESSAGES.vaccine} />
                        {`: ${vaccine}`}
                    </div>
                )}
            </Tooltip>
        </>
    );
};
