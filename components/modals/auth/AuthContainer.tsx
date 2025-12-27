import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AuthModal from './AuthModal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import OTPVerification from './OTPVerification';
import WelcomeModal from '@/components/modals/WelcomeModal';
import LoginSuccessModal from '@/components/modals/LoginSuccessModal';
import ForgotPasswordModal from '@/components/modals/ForgotPasswordModal';
import ResetPasswordOTPModal from '@/components/modals/ResetPasswordOTPModal';
import NewPasswordModal from '@/components/modals/NewPasswordModal';
import PasswordResetSuccessModal from '@/components/modals/PasswordResetSuccessModal';

type AuthView = 'login' | 'register' | 'otp';

interface AuthContainerProps {
    isOpen: boolean;
    onClose: () => void;
    onReopen?: () => void;
    initialView?: 'login' | 'register';
}

const AuthContainer: React.FC<AuthContainerProps> = ({
    isOpen,
    onClose,
    onReopen,
    initialView = 'login'
}) => {
    const [currentView, setCurrentView] = useState<AuthView>(initialView);
    const [pendingEmail, setPendingEmail] = useState('');
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [showLoginSuccessModal, setShowLoginSuccessModal] = useState(false);
    const [userName, setUserName] = useState('');

    // Forgot password flow state
    const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'password' | 'success' | null>(null);
    const [resetEmail, setResetEmail] = useState('');

    const handleLoginSuccess = () => {
        setShowLoginSuccessModal(true);
        onClose();
    };

    const handleRegisterSuccess = (email: string, needsVerification: boolean, firstName?: string) => {
        if (firstName) {
            setUserName(firstName);
        }

        if (!needsVerification) {
            setShowWelcomeModal(true);
            onClose();
            return;
        }
        setPendingEmail(email);
        setCurrentView('otp');
    };

    const handleOTPSuccess = () => {
        setShowWelcomeModal(true);
        onClose();
    };

    const resetToLogin = () => {
        setCurrentView('login');
        setPendingEmail('');
    };

    // Reset view when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setCurrentView(initialView);
            setPendingEmail('');
        }
    }, [isOpen, initialView]);

    return (
        <>
            <AuthModal isOpen={isOpen} onClose={onClose}>
                {currentView === 'login' && (
                    <LoginForm
                        onSwitchToRegister={() => setCurrentView('register')}
                        onSuccess={handleLoginSuccess}
                        onForgotPassword={() => {
                            onClose();
                            setForgotPasswordStep('email');
                        }}
                    />
                )}
                {currentView === 'register' && (
                    <RegisterForm
                        onSwitchToLogin={() => setCurrentView('login')}
                        onSuccess={handleRegisterSuccess}
                    />
                )}
                {currentView === 'otp' && (
                    <OTPVerification
                        email={pendingEmail}
                        onSuccess={handleOTPSuccess}
                        onBack={resetToLogin}
                    />
                )}
            </AuthModal>

            {/* Success Modals */}
            <WelcomeModal
                isOpen={showWelcomeModal}
                onClose={() => setShowWelcomeModal(false)}
                userName={userName || 'there'}
            />

            <LoginSuccessModal
                isOpen={showLoginSuccessModal}
                onClose={() => setShowLoginSuccessModal(false)}
                userName={userName}
            />

            {/* Forgot Password Flow */}
            <ForgotPasswordModal
                isOpen={forgotPasswordStep === 'email'}
                onClose={() => setForgotPasswordStep(null)}
                onSuccess={(email) => {
                    setResetEmail(email);
                    setForgotPasswordStep('otp');
                }}
                onBackToLogin={() => {
                    setForgotPasswordStep(null);
                    setCurrentView('login');
                    onReopen?.();
                }}
            />

            <ResetPasswordOTPModal
                isOpen={forgotPasswordStep === 'otp'}
                onClose={() => setForgotPasswordStep(null)}
                onSuccess={() => setForgotPasswordStep('password')}
                onResend={async () => {
                    // Will trigger resend from ForgotPasswordModal logic
                    console.log('Resending OTP to:', resetEmail);
                }}
                email={resetEmail}
            />

            <NewPasswordModal
                isOpen={forgotPasswordStep === 'password'}
                onClose={() => setForgotPasswordStep(null)}
                onSuccess={() => setForgotPasswordStep('success')}
                email={resetEmail}
            />

            <PasswordResetSuccessModal
                isOpen={forgotPasswordStep === 'success'}
                onClose={() => setForgotPasswordStep(null)}
                onLoginClick={() => {
                    setForgotPasswordStep(null);
                    setCurrentView('login');
                    onReopen?.();
                }}
            />
        </>
    );
};

export default AuthContainer;
