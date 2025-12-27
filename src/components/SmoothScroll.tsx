'use client';

import { useEffect } from 'react';

const SmoothScroll = () => {
    useEffect(() => {
        let locomotiveScroll: any;

        const initScroll = async () => {
            const LocomotiveScrollModule = await import('locomotive-scroll');
            const LocomotiveScroll = LocomotiveScrollModule.default || LocomotiveScrollModule;
            locomotiveScroll = new LocomotiveScroll();
        };

        initScroll();

        return () => {
            if (locomotiveScroll) locomotiveScroll.destroy();
        };
    }, []);

    return null;
};

export default SmoothScroll;
