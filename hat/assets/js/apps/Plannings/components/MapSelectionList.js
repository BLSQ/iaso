/*
 * This component displays the list of selected villages. It also allows to
 * remove (`deselect`) them from the list (one by one or all together),
 * or to identify the selected village in the the map (`show`).
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

class MapSelectionList extends Component {
    render() {
        const { data, show, coordinationId } = this.props;

        if (!data || data.length === 0) {
            return <div />;
        }


        return (
            <div>
                <div className="map__selection__list__header">
                    <h3>
                        <FormattedMessage id="microplanning.selected.list" defaultMessage="Villages list:" />
                    </h3>
                    <a
                        tabIndex={0}
                        role="button"
                        onClick={() => this.props.deselect(data.map(village => ({ village_id: village.id })))}
                        className="button--tiny button--danger"
                    >
                        <FormattedMessage id="microplanning.selected.reset" defaultMessage="Deselect all" />
                    </a>
                </div>
                <table className="map__selection__list">
                    <thead>
                        <tr>
                            <th colSpan={coordinationId !== '' ? '2' : '1'} />
                            <th>
                                <FormattedMessage id="main.label.name" defaultMessage="Name" />
                            </th>
                            <th>As</th>
                            <th>
                                <FormattedMessage id="microplanning.label.team" defaultMessage="Unité" />
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.map(item => {
                            // console.log(item);
                            return (
                                <tr className="map__selection__list__item" key={item.id}>
                                    {
                                        coordinationId !== ''
                                        && (
                                            <td className="tools">
                                                {(this.props.teamsMap[this.props.assignationsMap[item.id]])
                                                    && (
                                                        <span
                                                            tabIndex={0}
                                                            role="button"
                                                            className="remove"
                                                            onClick={() => this.props.deselect([{ village_id: item.id }])}
                                                        >
                                                            <i className="fa fa-close" />
                                                        </span>
                                                    )
                                                }
                                            </td>
                                        )
                                    }
                                    <td className="tools">
                                        <span
                                            tabIndex={0}
                                            role="button"
                                            className={`view text--${item._isHighlight ? 'highlight' : item.type}`}
                                            onClick={() => show(item)}
                                        >
                                            <i className="fa fa-map-marker" />
                                        </span>
                                    </td>
                                    <td>
                                        {item.name}
                                    </td>
                                    <td className="limited-width">
                                        {item.AS__name}
                                    </td>
                                    <td className="limited-width">
                                        {(this.props.teamsMap[this.props.assignationsMap[item.id]])
                                            && (
                                                <span>
                                                    {this.props.teamsMap[this.props.assignationsMap[item.id]].name}
                                                </span>
                                            )
                                        }
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }
}
MapSelectionList.defaultProps = {
    data: [],
    assignationsMap: undefined,
    teamsMap: undefined,
    show: () => { },
    deselect: () => { },
    coordinationId: '',
};

MapSelectionList.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object),
    assignationsMap: PropTypes.object,
    teamsMap: PropTypes.object,
    show: PropTypes.func,
    deselect: PropTypes.func,
    coordinationId: PropTypes.string,
};

export default injectIntl(MapSelectionList);
