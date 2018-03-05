import React from 'react';
import PropTypes from 'prop-types';


const initiaState = {
    videoLoaded: false,
};

class VideoComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = initiaState;
    }


    componentWillReceiveProps(nextProps) {
    }


    render() {
        return (
            <section className="video-component">
                {
                    !this.state.videoLoaded && <i className="fa fa-spinner" />
                }
                <section>
                test
                </section>
            </section>
        );
    }
}


VideoComponent.propTypes = {
    videoItem: PropTypes.object.isRequired,
};

export default VideoComponent;
