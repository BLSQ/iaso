/*
 * This component displays a button to toggle the side menu.
 */

import React, { Component, PropTypes } from 'react';
import { injectIntl } from 'react-intl'


class ToggleMenuButton extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isMenuOpen : true
        };
    }

    toggleMenu() {
        document.body.className = !this.state.isMenuOpen ? document.body.className.replace('menu-close', '') : 'menu-close';
        this.setState({
            isMenuOpen: !this.state.isMenuOpen
        });
    }

    render() {
        return (
            <div className='toggle-menu-container'>

                <button
                    className='toggle-menu-button'
                    onClick={() => this.toggleMenu()}
                >
                    {
                    this.state.isMenuOpen ? <i className='fa fa-arrow-left ' /> : <i className='fa fa-arrow-right' />
                    }
                </button>
            </div>
        )
    }
}

export default injectIntl(ToggleMenuButton)
