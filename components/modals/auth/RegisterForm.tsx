import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Check, ChevronDown, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SocialLoginButton from './SocialLoginButton';
import InlineError from '@/components/ui/InlineError';

// Complete list of world countries with ISO codes for flags
const countries = [
    { code: 'AF', name: 'Afghanistan' }, { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
    { code: 'AD', name: 'Andorra' }, { code: 'AO', name: 'Angola' }, { code: 'AG', name: 'Antigua and Barbuda' },
    { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' }, { code: 'AU', name: 'Australia' },
    { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' }, { code: 'BS', name: 'Bahamas' },
    { code: 'BH', name: 'Bahrain' }, { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' },
    { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' }, { code: 'BZ', name: 'Belize' },
    { code: 'BJ', name: 'Benin' }, { code: 'BT', name: 'Bhutan' }, { code: 'BO', name: 'Bolivia' },
    { code: 'BA', name: 'Bosnia and Herzegovina' }, { code: 'BW', name: 'Botswana' }, { code: 'BR', name: 'Brazil' },
    { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgaria' }, { code: 'BF', name: 'Burkina Faso' },
    { code: 'BI', name: 'Burundi' }, { code: 'CV', name: 'Cabo Verde' }, { code: 'KH', name: 'Cambodia' },
    { code: 'CM', name: 'Cameroon' }, { code: 'CA', name: 'Canada' }, { code: 'CF', name: 'Central African Republic' },
    { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' }, { code: 'CN', name: 'China' },
    { code: 'CO', name: 'Colombia' }, { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' },
    { code: 'CR', name: 'Costa Rica' }, { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' },
    { code: 'CY', name: 'Cyprus' }, { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' },
    { code: 'DJ', name: 'Djibouti' }, { code: 'DM', name: 'Dominica' }, { code: 'DO', name: 'Dominican Republic' },
    { code: 'EC', name: 'Ecuador' }, { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' },
    { code: 'GQ', name: 'Equatorial Guinea' }, { code: 'ER', name: 'Eritrea' }, { code: 'EE', name: 'Estonia' },
    { code: 'SZ', name: 'Eswatini' }, { code: 'ET', name: 'Ethiopia' }, { code: 'FJ', name: 'Fiji' },
    { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' }, { code: 'GA', name: 'Gabon' },
    { code: 'GM', name: 'Gambia' }, { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' },
    { code: 'GH', name: 'Ghana' }, { code: 'GR', name: 'Greece' }, { code: 'GD', name: 'Grenada' },
    { code: 'GT', name: 'Guatemala' }, { code: 'GN', name: 'Guinea' }, { code: 'GW', name: 'Guinea-Bissau' },
    { code: 'GY', name: 'Guyana' }, { code: 'HT', name: 'Haiti' }, { code: 'HN', name: 'Honduras' },
    { code: 'HU', name: 'Hungary' }, { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' },
    { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' },
    { code: 'IE', name: 'Ireland' }, { code: 'IL', name: 'Israel' }, { code: 'IT', name: 'Italy' },
    { code: 'JM', name: 'Jamaica' }, { code: 'JP', name: 'Japan' }, { code: 'JO', name: 'Jordan' },
    { code: 'KZ', name: 'Kazakhstan' }, { code: 'KE', name: 'Kenya' }, { code: 'KI', name: 'Kiribati' },
    { code: 'KP', name: 'North Korea' }, { code: 'KR', name: 'South Korea' }, { code: 'KW', name: 'Kuwait' },
    { code: 'KG', name: 'Kyrgyzstan' }, { code: 'LA', name: 'Laos' }, { code: 'LV', name: 'Latvia' },
    { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' }, { code: 'LR', name: 'Liberia' },
    { code: 'LY', name: 'Libya' }, { code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lithuania' },
    { code: 'LU', name: 'Luxembourg' }, { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' },
    { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' }, { code: 'ML', name: 'Mali' },
    { code: 'MT', name: 'Malta' }, { code: 'MH', name: 'Marshall Islands' }, { code: 'MR', name: 'Mauritania' },
    { code: 'MU', name: 'Mauritius' }, { code: 'MX', name: 'Mexico' }, { code: 'FM', name: 'Micronesia' },
    { code: 'MD', name: 'Moldova' }, { code: 'MC', name: 'Monaco' }, { code: 'MN', name: 'Mongolia' },
    { code: 'ME', name: 'Montenegro' }, { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' },
    { code: 'MM', name: 'Myanmar' }, { code: 'NA', name: 'Namibia' }, { code: 'NR', name: 'Nauru' },
    { code: 'NP', name: 'Nepal' }, { code: 'NL', name: 'Netherlands' }, { code: 'NZ', name: 'New Zealand' },
    { code: 'NI', name: 'Nicaragua' }, { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
    { code: 'MK', name: 'North Macedonia' }, { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' },
    { code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' }, { code: 'PS', name: 'Palestine' },
    { code: 'PA', name: 'Panama' }, { code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' },
    { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' },
    { code: 'PT', name: 'Portugal' }, { code: 'QA', name: 'Qatar' }, { code: 'RO', name: 'Romania' },
    { code: 'RU', name: 'Russia' }, { code: 'RW', name: 'Rwanda' }, { code: 'KN', name: 'Saint Kitts and Nevis' },
    { code: 'LC', name: 'Saint Lucia' }, { code: 'VC', name: 'Saint Vincent and the Grenadines' },
    { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' }, { code: 'ST', name: 'Sao Tome and Principe' },
    { code: 'SA', name: 'Saudi Arabia' }, { code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' },
    { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' }, { code: 'SG', name: 'Singapore' },
    { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' }, { code: 'SB', name: 'Solomon Islands' },
    { code: 'SO', name: 'Somalia' }, { code: 'ZA', name: 'South Africa' }, { code: 'SS', name: 'South Sudan' },
    { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' }, { code: 'SD', name: 'Sudan' },
    { code: 'SR', name: 'Suriname' }, { code: 'SE', name: 'Sweden' }, { code: 'CH', name: 'Switzerland' },
    { code: 'SY', name: 'Syria' }, { code: 'TW', name: 'Taiwan' }, { code: 'TJ', name: 'Tajikistan' },
    { code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' }, { code: 'TL', name: 'Timor-Leste' },
    { code: 'TG', name: 'Togo' }, { code: 'TO', name: 'Tonga' }, { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'TN', name: 'Tunisia' }, { code: 'TR', name: 'Turkey' }, { code: 'TM', name: 'Turkmenistan' },
    { code: 'TV', name: 'Tuvalu' }, { code: 'UG', name: 'Uganda' }, { code: 'UA', name: 'Ukraine' },
    { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
    { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' }, { code: 'VU', name: 'Vanuatu' },
    { code: 'VA', name: 'Vatican City' }, { code: 'VE', name: 'Venezuela' }, { code: 'VN', name: 'Vietnam' },
    { code: 'YE', name: 'Yemen' }, { code: 'ZM', name: 'Zambia' }, { code: 'ZW', name: 'Zimbabwe' },
    { code: 'HK', name: 'Hong Kong' }, { code: 'PR', name: 'Puerto Rico' },
];

// Password validation rules
const passwordRules = [
    { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { id: 'uppercase', label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'lowercase', label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { id: 'number', label: 'Contains number', test: (p: string) => /[0-9]/.test(p) },
    { id: 'special', label: 'Contains special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

interface RegisterFormProps {
    onSwitchToLogin: () => void;
    onSuccess: (email: string, needsVerification: boolean, firstName?: string) => void;
}

// Premium Country Dropdown Component
const CountryDropdown: React.FC<{
    value: string;
    onChange: (value: string) => void;
    error?: string;
}> = ({ value, onChange, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selectedCountry = countries.find(c => c.name === value);
    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen]);

    const getFlagUrl = (code: string) => `https://flagcdn.com/w80/${code.toLowerCase()}.png`;

    return (
        <div ref={dropdownRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-4 py-3.5 bg-white/[0.03] border rounded-xl text-left flex items-center justify-between transition-all duration-200 ${error ? 'border-red-500/50' : isOpen ? 'border-gold/40 bg-white/[0.05]' : 'border-white/10'
                    }`}
            >
                {selectedCountry ? (
                    <div className="flex items-center gap-3">
                        <img
                            src={getFlagUrl(selectedCountry.code)}
                            alt={selectedCountry.name}
                            className="w-7 h-5 object-cover rounded shadow-sm"
                        />
                        <span className="text-white">{selectedCountry.name}</span>
                    </div>
                ) : (
                    <span className="text-white/30">Select your country</span>
                )}
                <ChevronDown size={18} className={`text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden"
                        style={{
                            background: 'linear-gradient(180deg, rgba(25, 25, 28, 0.98) 0%, rgba(18, 18, 20, 0.99) 100%)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(197, 160, 89, 0.05)',
                        }}
                    >
                        {/* Search */}
                        <div className="p-3 border-b border-white/10">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search countries..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-gold/30 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>

                        {/* Country List */}
                        <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {filteredCountries.length === 0 ? (
                                <div className="px-4 py-8 text-center text-white/40 text-sm">No countries found</div>
                            ) : (
                                filteredCountries.map((country) => (
                                    <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => {
                                            onChange(country.name);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.05] transition-colors ${value === country.name ? 'bg-gold/10' : ''
                                            }`}
                                    >
                                        <img
                                            src={getFlagUrl(country.code)}
                                            alt={country.name}
                                            className="w-7 h-5 object-cover rounded shadow-sm"
                                        />
                                        <span className={`text-sm ${value === country.name ? 'text-gold' : 'text-white/80'}`}>
                                            {country.name}
                                        </span>
                                        {value === country.name && (
                                            <Check size={16} className="ml-auto text-gold" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-red-400 text-xs mt-1.5"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

// Password Strength Component
const PasswordStrength: React.FC<{ password: string; show: boolean }> = ({ password, show }) => {
    const passedRules = passwordRules.filter(rule => rule.test(password)).length;
    const strength = passedRules === 0 ? 0 : passedRules <= 2 ? 1 : passedRules <= 4 ? 2 : 3;
    const strengthLabels = ['', 'Weak', 'Medium', 'Strong'];
    const strengthColors = ['', 'text-red-400', 'text-yellow-400', 'text-emerald-400'];
    const barColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-emerald-500'];

    return (
        <AnimatePresence>
            {show && password.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 space-y-3 overflow-hidden"
                >
                    {/* Strength Bar */}
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-white/40 uppercase tracking-wider">Password Strength</span>
                        <span className={`text-xs font-medium ${strengthColors[strength]}`}>{strengthLabels[strength]}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(strength / 3) * 100}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className={`h-full rounded-full ${barColors[strength]}`}
                        />
                    </div>

                    {/* Rules List */}
                    <div className="space-y-2 pt-1">
                        {passwordRules.map((rule, idx) => {
                            const passed = rule.test(password);
                            return (
                                <motion.div
                                    key={rule.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center gap-2"
                                >
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: passed ? [1, 1.2, 1] : 1,
                                            backgroundColor: passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)'
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${passed ? 'border-emerald-500/50' : 'border-white/10'
                                            }`}
                                    >
                                        {passed ? (
                                            <Check size={12} className="text-emerald-400" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                        )}
                                    </motion.div>
                                    <span className={`text-xs ${passed ? 'text-emerald-400' : 'text-white/40'}`}>
                                        {rule.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
    const { signUp, signInWithOAuth } = useAuth();
    const [formData, setFormData] = useState({
        businessName: '',
        firstName: '',
        lastName: '',
        country: '',
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        else if (!/^[A-Z]/.test(formData.firstName.trim())) newErrors.firstName = 'Must start with a capital letter';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.country) newErrors.country = 'Please select your country';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (!agreedToTerms) newErrors.terms = 'You must agree to the terms';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            const { needsVerification } = await signUp(formData.email, formData.password, {
                business_name: formData.businessName,
                first_name: formData.firstName,
                last_name: formData.lastName,
                country: formData.country,
            });
            onSuccess(formData.email, needsVerification, formData.firstName);
        } catch (error: any) {
            setErrors({ general: error.message });
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        try {
            await signInWithOAuth(provider);
        } catch (error: any) {
            setErrors({ general: error.message });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="text-center mb-4">
                <h2 className="text-2xl font-serif font-bold text-white mb-1">Create Account</h2>
                <p className="text-platinum/50 text-sm">Join the protocol and start scaling</p>
            </div>

            {/* General Error */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <SocialLoginButton provider="google" onClick={() => handleSocialLogin('google')} />
                <SocialLoginButton provider="apple" onClick={() => handleSocialLogin('apple')} />
            </div>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#141416] px-2 text-white/40">Or continue with</span>
                </div>
            </div>

            <AnimatePresence>
                {errors.general && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-1.5"
                    >
                        <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                        <p className="text-xs text-red-400 leading-tight">{errors.general}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Business Name */}
            <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Business Name</label>
                <div className="relative">
                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => updateField('businessName', e.target.value)}
                        placeholder="Business Name"
                        className={`w-full pl-12 pr-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.businessName ? 'border-red-500/50' : 'border-white/10'
                            }`}
                    />
                </div>
                <InlineError message={errors.businessName} />
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-white/40 font-medium">First Name</label>
                    <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => updateField('firstName', e.target.value)}
                            placeholder="John"
                            className={`w-full pl-12 pr-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.firstName ? 'border-red-500/50' : 'border-white/10'
                                }`}
                        />
                    </div>
                    <InlineError message={errors.firstName} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Last Name</label>
                    <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        placeholder="Doe"
                        className={`w-full px-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.lastName ? 'border-red-500/50' : 'border-white/10'
                            }`}
                    />
                    <InlineError message={errors.lastName} />
                </div>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Country</label>
                <CountryDropdown
                    value={formData.country}
                    onChange={(value) => updateField('country', value)}
                    error={errors.country}
                />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Email</label>
                <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="you@company.com"
                        className={`w-full pl-12 pr-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.email ? 'border-red-500/50' : 'border-white/10'
                            }`}
                    />
                </div>
                <InlineError message={errors.email} />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Password</label>
                <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        placeholder="••••••••••"
                        className={`w-full pl-12 pr-12 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.password ? 'border-red-500/50' : 'border-white/10'
                            }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                <InlineError message={errors.password} />

                {/* Password Strength */}
                <PasswordStrength password={formData.password} show={passwordFocused || formData.password.length > 0} />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => {
                        setAgreedToTerms(!agreedToTerms);
                        if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                    }}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 flex-shrink-0 ${agreedToTerms
                        ? 'bg-gold border-gold'
                        : errors.terms
                            ? 'bg-white/[0.03] border-red-500/50'
                            : 'bg-white/[0.03] border-white/20 hover:border-white/40'
                        }`}
                >
                    {agreedToTerms && <Check size={14} className="text-obsidian" />}
                </button>
                <p className="text-sm text-white/40">
                    I agree to the{' '}
                    <a href="#" className="text-gold hover:text-gold-bright transition-colors">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-gold hover:text-gold-bright transition-colors">Privacy Policy</a>
                </p>
            </div>

            {/* Submit Button */}
            <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3.5 bg-gradient-to-br from-gold-dark via-gold to-gold text-white font-bold uppercase tracking-wider text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(197,160,89,0.3)] hover:shadow-[0_6px_30px_rgba(197,160,89,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-4"
            >
                {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <>
                        Create Account
                        <ArrowRight size={18} />
                    </>
                )}
            </motion.button>

            {/* Switch to Login */}
            <div className="text-center pt-2">
                <p className="text-white/40 text-sm">
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-gold hover:text-gold-bright font-medium transition-colors"
                    >
                        Sign In
                    </button>
                </p>
            </div>
        </form>
    );
};

export default RegisterForm;
