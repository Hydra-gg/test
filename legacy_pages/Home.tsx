import React from 'react';
import Hero from '../src/components/Hero';
import Features from '../src/components/Features';
import HowItWorks from '../src/components/HowItWorks';
import Pricing from '../src/components/Pricing';
import CTASection from '../src/components/CTASection';
import SectionDivider from '../src/components/SectionDivider';

interface HomeProps {
    loading: boolean;
    onOpenBriefing: () => void;
}

const Home: React.FC<HomeProps> = ({ loading, onOpenBriefing }) => {
    return (
        <>
            <Hero />
            <SectionDivider />
            <Features />
            <SectionDivider />
            <HowItWorks />
            <SectionDivider />
            <Pricing />
            <SectionDivider />
            <CTASection />
        </>
    );
};

export default Home;
