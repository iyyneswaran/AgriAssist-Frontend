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
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/85 via-black/55 to-black/90 pointer-events-none"></div>
            {/* Subtle radial ambient illumination */}
            <div className="fixed top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-lime-500/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Main Content Container - Responsive max-width */}
            <div className="max-w-md md:max-w-2xl lg:max-w-3xl w-full mx-auto px-4 sm:px-6 pt-5 pb-36 relative z-10">
                <Header />

                <div className="mt-7 mb-5 text-left">
                    <h1 className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-white">
                        {t('home.farmingMade')}{' '}
                        <span
                            className="font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #A1E533 0%, #D6F6CF 60%, #FFFFFF 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {t('home.simple')} {t('home.smarter')}
                        </span>{' '}
                        {t('home.and')}{' '}
                        <span
                            className="font-bold"
                            style={{
                                background: 'linear-gradient(135deg, #FFFFFF 0%, #D6F6CF 40%, #A1E533 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {t('home.sustainable')}
                        </span>
                    </h1>
                </div>

                <WeatherSection />

                <div className="mt-6">
                    <FarmAdvisory />
                </div>

                <div className="mt-6">
                    <ActionButtons />
                </div>

                <div className="mt-6">
                    <CropsSection />
                </div>
            </div>

            {/* Floating Bottom Nav */}
            <BottomNav />
        </div>
    );
}