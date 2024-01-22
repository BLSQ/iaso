import React, { FunctionComponent, useRef, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Masonry } from '@mui/lab';
import VideoItem from './VideoItemComponent';
import { ShortFile } from '../../domains/instances/types/instance';

type Props = {
    videoList: ShortFile[];
};

const VideosListComponent: FunctionComponent<Props> = ({ videoList }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState<number>(0);
    useEffect(() => {
        if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth);
        }
    }, []);
    return (
        <Box ref={containerRef} overflow="hidden">
            {width > 0 && (
                <Masonry columns={width < 500 ? 1 : 3} spacing={2}>
                    {videoList.map(file => (
                        <Box key={file.itemId}>
                            <VideoItem videoItem={file} />
                        </Box>
                    ))}
                </Masonry>
            )}
        </Box>
    );
};

export default VideosListComponent;
