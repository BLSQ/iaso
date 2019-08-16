import React from 'react';
import {
    FormattedMessage,
    defineMessages,
} from 'react-intl';
import { formatThousand, getPercentage } from '../../../../utils';

export const MESSAGES = defineMessages({
    table: {
        defaultMessage: 'List',
        id: 'main.label.list',
    },
    map: {
        defaultMessage: 'Map',
        id: 'main.label.map',
    },
    stats: {
        defaultMessage: 'Statistics',
        id: 'main.label.stats',
    },
    testStatsTitle: {
        defaultMessage: 'Dépistages',
        id: 'main.label.screening_results',
    },
    confirmationStatsTitle: {
        defaultMessage: 'Confirmations',
        id: 'main.label.confirmation_results',
    },
});

export const mapVillages = (allVillages) => {
    const villages = [];
    allVillages.map((village) => {
        if (village.village__id && village.village__latitude && village.village__longitude) {
            const tempVillage = {
                latitude: village.village__latitude,
                longitude: village.village__longitude,
                name: village.village__name,
                original: village,
            };
            villages.push(tempVillage);
        }
        return null;
    });
    return villages;
};

export const renderTestPourcentage = (total) => {
    const cattPercentage = getPercentage(total.total_catt, total.total_catt_positive);
    const rdtPercentage = getPercentage(total.total_rdt, total.total_rdt_positive);
    return (
        <div className="align-right bold large-text">
            {
                total.total_catt !== 0 &&
                <div className="padding-bottom">
                    {formatThousand(total.total_catt)} <FormattedMessage id="details.label.totalCatt" defaultMessage="CATT test(s) done" />
                </div>
            }
            {
                total.total_catt === 0 &&
                <div className="padding-bottom">
                    <FormattedMessage id="details.label.noCATT" defaultMessage="No CATT test" />
                </div>
            }
            {
                total.total_catt !== 0 &&
                <div className="padding-bottom">
                    {total.total_catt_positive} CATT <FormattedMessage id="details.label.cattPositive" defaultMessage="positive(s)" /> ({cattPercentage}%)
                </div>
            }
            {
                total.total_rdt !== 0 &&
                <div className="padding-bottom">
                    {formatThousand(total.total_rdt)} <FormattedMessage id="details.label.totalRdt" defaultMessage="RDT test(s) done" />
                </div>
            }
            {
                total.total_rdt === 0 &&
                <div>
                    <FormattedMessage id="details.label.noRDT" defaultMessage="No RDT test" />
                </div>
            }
            {
                total.total_rdt !== 0 &&
                <div>
                    {total.total_rdt_positive} RDT <FormattedMessage id="details.label.cattPositive" defaultMessage="positive(s)" /> ({rdtPercentage}%)
                </div>
            }
        </div>);
};

export const renderConfirmationPourcentage = (total) => {
    const confirmationPercentage = getPercentage(total.total_confirmation_tests, total.total_confirmation_tests_positive);
    return (
        <div className="align-right bold large-text">
            <div className="padding-bottom">
                {formatThousand(total.total_catt_positive + total.total_rdt_positive)} <FormattedMessage id="details.label.suspect" defaultMessage="suspect(s) test(s)" />
            </div>
            {
                total.total_confirmation_tests !== 0 &&
                <div className="padding-bottom">
                    {formatThousand(total.total_confirmation_tests)} <FormattedMessage id="details.label.total_confirmation_tests" defaultMessage="confirmation test(s)" />
                </div>
            }
            {
                total.total_confirmation_tests === 0 &&
                <div>
                    <FormattedMessage id="details.label.noConfirmation" defaultMessage="No confirmation test" />
                </div>
            }
            {
                total.total_confirmation_tests !== 0 &&
                <div>
                    {total.total_confirmation_tests_positive} <FormattedMessage id="details.label.cattPositive" defaultMessage="positive(s)" /> ({confirmationPercentage}%)
                </div>
            }
        </div>);
};

export const renderCountCell = (count, formatMessage) => {
    let daysClass = 'ok';
    let daysString = count;
    if (count === undefined || count < 0) {
        daysString = formatMessage({
            defaultMessage: 'N/A',
            id: 'teamsdevices.last_sync.none',
        });
    }
    if (count === undefined || count < 0 || count > 40) {
        daysClass = 'error';
    }
    if (count !== undefined && count > 20 && count < 40) {
        daysClass = 'warning';
    }
    return (
        <span className={daysClass}>
            {daysString}
        </span>
    );
};
