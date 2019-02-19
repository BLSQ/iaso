import React from 'react';
import {
    FormattedMessage,
    defineMessages,
} from 'react-intl';
import { formatThousand, getPercentage } from '../../../../utils';

export const MESSAGES = defineMessages({
    table: {
        defaultMessage: 'Liste',
        id: 'details.label.list',
    },
    map: {
        defaultMessage: 'Carte',
        id: 'details.label.map',
    },
    stats: {
        defaultMessage: 'Statistiques',
        id: 'details.label.stats',
    },
    testStatsTitle: {
        defaultMessage: 'Dépistages',
        id: 'details.title.testStatsTitle',
    },
    confirmationStatsTitle: {
        defaultMessage: 'Confirmations',
        id: 'details.title.confirmationStatsTitle',
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
                    {formatThousand(total.total_catt)} <FormattedMessage id="details.label.totalCatt" defaultMessage="test(s) CATT effectué(s)" />
                </div>
            }
            {
                total.total_catt === 0 &&
                <div className="padding-bottom">
                    <FormattedMessage id="details.label.noCATT" defaultMessage="Aucun test CATT" />
                </div>
            }
            {
                total.total_catt !== 0 &&
                <div className="padding-bottom">
                    {total.total_catt_positive} CATT <FormattedMessage id="details.label.cattPositive" defaultMessage="positif(s)" /> ({cattPercentage}%)
                </div>
            }
            {
                total.total_rdt !== 0 &&
                <div className="padding-bottom">
                    {formatThousand(total.total_rdt)} <FormattedMessage id="details.label.totalRdt" defaultMessage="test(s) RDT effectué(s)" />
                </div>
            }
            {
                total.total_rdt === 0 &&
                <div>
                    <FormattedMessage id="details.label.noRDT" defaultMessage="Aucun test RDT" />
                </div>
            }
            {
                total.total_rdt !== 0 &&
                <div>
                    {total.total_rdt_positive} RDT <FormattedMessage id="details.label.rdtPositive" defaultMessage="positif(s)" /> ({rdtPercentage}%)
                </div>
            }
        </div>);
};

export const renderConfirmationPourcentage = (total) => {
    const confirmationPercentage = getPercentage(total.total_confirmation_tests, total.total_confirmation_tests_positive);
    return (
        <div className="align-right bold large-text">
            <div className="padding-bottom">
                {formatThousand(total.total_catt_positive + total.total_rdt_positive)} <FormattedMessage id="details.label.suspect" defaultMessage="test(s) suspects" />
            </div>
            {
                total.total_confirmation_tests !== 0 &&
                <div className="padding-bottom">
                    {formatThousand(total.total_confirmation_tests)} <FormattedMessage id="details.label.total_confirmation_tests" defaultMessage="test(s) de confirmation" />
                </div>
            }
            {
                total.total_confirmation_tests === 0 &&
                <div>
                    <FormattedMessage id="details.label.noConfirmation" defaultMessage="Aucun test de confirmation" />
                </div>
            }
            {
                total.total_confirmation_tests !== 0 &&
                <div>
                    {total.total_confirmation_tests_positive} <FormattedMessage id="details.label.positiveConfirmation" defaultMessage="positif(s)" /> ({confirmationPercentage}%)
                </div>
            }
        </div>);
};
