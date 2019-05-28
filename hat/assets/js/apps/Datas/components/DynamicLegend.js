import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import { mapCasesToVillages } from '../../../utils/map/mapUtils';

class DynamicLegend extends Component {
    toggleDisplayed(villageId, testId) {
        if (villageId || testId) {
            const { cases, setCaseslist } = this.props;
            const tempCases = [...cases];
            tempCases.forEach((c, caseIndex) => {
                c.tests.forEach((t, testIndex) => {
                    if (villageId) {
                        if (t.village.id === villageId) {
                            tempCases[caseIndex].tests[testIndex].village.displayed = !tempCases[caseIndex].tests[testIndex].village.displayed;
                        }
                    }
                    if (testId) {
                        if (t.id === testId) {
                            tempCases[caseIndex].tests[testIndex].displayed = !tempCases[caseIndex].tests[testIndex].displayed;
                        }
                    }
                });
            });
            setCaseslist(tempCases);
        }
    }

    render() {
        const { cases } = this.props;
        const villages = mapCasesToVillages(cases);
        return (
            <div className="map__option">
                <span className="map__option__header">
                    <FormattedMessage id="datas.label.dynamicLegend.title" defaultMessage="Visibilité" />
                </span>
                <ul className="dynamic-legend">
                    {villages.map(village => (
                        <li key={`case-${village.id}`}>
                            <div
                                onClick={() => this.toggleDisplayed(village.id, null)}
                                role="button"
                                tabIndex={0}
                                className={!village.isLocalised ? 'error-text no-cursor' : ''}
                            >
                                {
                                    village.isLocalised && village.displayed &&
                                    <i className="fa fa-check-square-o" />
                                }
                                {
                                    village.isLocalised && !village.displayed &&
                                    <i className="fa fa-square-o" />
                                }
                                {
                                    !village.isLocalised &&
                                    <i className="fa fa-times" />
                                }
                                {village.name}
                                {
                                    !village.isLocalised &&
                                    <span className="text-padding-left">
                                        (<FormattedMessage id="datas.label.dynamicLegend.noLocation" defaultMessage="Pas de localisation" />)
                                    </span>
                                }
                            </div>
                            <ul>
                                {village.tests.map((test) => {
                                    const hasLocalisation = test.latitude && test.longitude;
                                    return (
                                        <li key={`test-${test.id}`}>
                                            <div
                                                onClick={() => this.toggleDisplayed(null, test.id)}
                                                role="button"
                                                tabIndex={0}
                                                className={parseInt(test.result, 10) > 1 || !hasLocalisation ?
                                                    `error-text ${!hasLocalisation ? 'no-cursor' : ''}` : ''}
                                            >
                                                {
                                                    !hasLocalisation &&
                                                    <i className="fa fa-times" />
                                                }
                                                {
                                                    hasLocalisation && test.displayed &&
                                                    <i className="fa fa-check-square-o" />
                                                }
                                                {
                                                    hasLocalisation && !test.displayed &&
                                                    <i className="fa fa-square-o" />
                                                }
                                                {test.type}-{test.id}
                                                {
                                                    !hasLocalisation &&
                                                    <span className="text-padding-left">
                                                        (<FormattedMessage id="datas.label.dynamicLegend.noLocation" defaultMessage="Pas de localisation" />)
                                                    </span>
                                                }
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>))}
                </ul>
            </div>
        );
    }
}

DynamicLegend.propTypes = {
    cases: PropTypes.array.isRequired,
    setCaseslist: PropTypes.func.isRequired,
};

export default injectIntl(DynamicLegend);
