import React from 'react';
import { motion } from 'framer-motion';

interface SocialLoginButtonProps {
    provider: 'google' | 'apple';
    onClick: () => void;
    disabled?: boolean;
}

const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({ provider, onClick, disabled }) => {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-white/90 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {provider === 'google' ? (
                <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5 object-contain"
                />
            ) : (
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg"
                    alt="Apple"
                    className="w-5 h-5 object-contain pb-0.5"
                />
            )}
            <span className="font-medium">{provider === 'google' ? 'Google' : 'Apple'}</span>
        </motion.button>
    );
};

export default SocialLoginButton;
