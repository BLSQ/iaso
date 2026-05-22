import React, { FunctionComponent, useRef, useState, useEffect } from 'react';
import { Masonry } from '@mui/lab';
import { Box } from '@mui/material';
import moment from 'moment';
import { getFileName } from 'Iaso/utils/filesUtils';
import { ShortFile } from '../../domains/instances/types/instance';
import VideoItem from './VideoItemComponent';

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
                    {videoList.map(file => {
                        const fileName = getFileName(file.path);
                        return (
                            <Box key={file.itemId}>
                                <VideoItem
                                    videoPath={file.path}
                                    fileInfo={`${moment.unix(file.createdAt).format('LTS')} - ${
                                        fileName.name
                                    }.${fileName.extension}`}
                                />
                            </Box>
                        );
                    })}
                </Masonry>
            )}
        </Box>
    );
};

export default VideosListComponent;
