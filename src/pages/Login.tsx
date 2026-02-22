import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { requestOTP, verifyOTP } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ArrowRight } from 'lucide-react';

export default function Login() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login: authLogin } = useAuth();

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
            setPhoneNumber(formattedPhone);
            await requestOTP(formattedPhone);
            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to request OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await verifyOTP(phoneNumber, otp);
            if (response.user && response.token) {
                authLogin(response.user, response.token);

                // If they don't have a name, maybe they should be in signup flow, but we let them in
                // or redirect to a profile completion page if needed. For now, go to Home.
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden flex justify-center items-center">
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-sm px-6 py-8">

                <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ChevronLeft size={20} className="mr-1" />
                    <span className="text-sm font-medium">Back</span>
                </Link>

                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-400 text-sm">Sign in to your AgriAssist account</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="glass-panel-dark rounded-2xl p-6 border border-white/10 shadow-2xl">

                    {step === 'phone' && (
                        <form onSubmit={handleRequestOTP} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">+91</span>
                                    <input
                                        type="tel"
                                        value={phoneNumber.replace('+91', '')}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                        placeholder="Enter 10-digit number"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || phoneNumber.length < 10}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {loading ? 'Sending OTP...' : 'Login with OTP'}
                                {!loading && <ArrowRight size={18} className="ml-2" />}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-400">OTP sent to <span className="text-white">{phoneNumber}</span></p>
                                <button
                                    type="button"
                                    onClick={() => setStep('phone')}
                                    className="text-xs text-green-400 hover:text-green-300 mt-2 hover:underline"
                                >
                                    Change Number
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2 text-center">Enter 6-digit OTP</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                    placeholder="• • • • • •"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-center text-2xl tracking-widest text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all font-mono"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                        </form>
                    )}

                </div>

                {step === 'phone' && (
                    <p className="text-center text-sm text-gray-400 mt-8">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-green-400 hover:text-green-300 font-medium hover:underline">
                            Sign up
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
