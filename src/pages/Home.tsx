import Header from '../components/Header';
import WeatherSection from '../components/WeatherSection';
import FarmAdvisory from '../components/FarmAdvisory';
import CropsSection from '../components/CropsSection';
import ActionButtons from '../components/ActionButtons';
import BottomNav from '../components/BottomNav';
import { useTranslation } from 'react-i18next';

export default function Home() {
    const { t } = useTranslation();

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex justify-center">
            {/* Gradient Overlay for Global Background */}
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90 pointer-events-none"></div>


            {/* Main Content Container - Mobile constrained */}
            <div className="relative z-10 w-full max-w-md h-full flex flex-col pb-32">
                <div className="px-5 pt-6 pb-4">
                    <Header />

                    <div className="mt-8 mb-6">
                        <h1
                            className="text-2xl font-semibold leading-tight tracking-wide"
                            style={{
                                background: 'linear-gradient(to right, #FFFFFF 46%, #D6F6CF 73%, #ADED9F 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {t('home.farmingMade')} {t('home.simple')}<br />
                            {t('home.smarter')} {t('home.and')} {t('home.sustainable')}
                        </h1>
                    </div>

                    <WeatherSection />

                    <div className="mt-6">
                        <FarmAdvisory />
                    </div>

                    <div className="mt-6">
                        <CropsSection />
                    </div>

                    <div className="mt-6">
                        <ActionButtons />
                    </div>
                </div>
            </div>

            {/* Floating Bottom Nav */}
            <BottomNav />
        </div>
    );
}