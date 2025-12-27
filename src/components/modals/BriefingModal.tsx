import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, Mail, ChevronDown, Calendar, Phone, Check, Search, ArrowRight } from 'lucide-react';
import AuthModal from './auth/AuthModal';
import { countries } from '@/data/countries';
import InlineError from '@/components/ui/InlineError';

interface BriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BriefingModal: React.FC<BriefingModalProps> = ({ isOpen, onClose }) => {
    // Form State
    const [formData, setFormData] = useState({
        businessName: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        date: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'us') || countries[0]);
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.dial.includes(countrySearch)
    );

    // Calendar State
    const [view, setView] = useState<'form' | 'calendar'>('form');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Time State
    const timeSlots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
        '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
    ];
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('12:00 PM');
    const [isTimeOpen, setIsTimeOpen] = useState(false);

    // Calendar Helper Functions
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const handleDateClick = (day: number) => {
        setSelectedDate(new Date(currentYear, currentMonth, day));
    };

    const handleConfirmDateTime = () => {
        const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')} ${selectedTimeSlot}`;
        setFormData({ ...formData, date: formattedDate });
        setErrors(prev => ({ ...prev, date: '' }));
        setView('form');
    };

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
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
        if (!formData.date) newErrors.date = 'Please select a date and time';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        // TODO: Handle submission
        console.log('Submitting briefing:', formData);
        onClose();
    };

    return (
        <AuthModal isOpen={isOpen} onClose={onClose} title={view === 'form' ? "Schedule Briefing" : "Select Date & Time"}>
            <div className="space-y-4">
                {view === 'form' ? (
                    <>
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
                                    className={`w-full pl-12 pr-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.businessName ? 'border-red-500/50' : 'border-white/10'}`}
                                />
                            </div>
                            <InlineError message={errors.businessName} />
                        </div>

                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs uppercase tracking-wider text-white/40 font-medium">First Name</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => updateField('firstName', e.target.value)}
                                        placeholder="First Name"
                                        className={`w-full pl-12 pr-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.firstName ? 'border-red-500/50' : 'border-white/10'}`}
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
                                    placeholder="Last Name"
                                    className={`w-full px-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.lastName ? 'border-red-500/50' : 'border-white/10'}`}
                                />
                                <InlineError message={errors.lastName} />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Work Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    placeholder="you@company.com"
                                    className={`w-full pl-12 pr-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 ${errors.email ? 'border-red-500/50' : 'border-white/10'}`}
                                />
                            </div>
                            <InlineError message={errors.email} />
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Phone Number</label>
                            <div className="grid grid-cols-[110px_1fr] gap-3 relative z-20">
                                {/* Country Selector */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsCountryOpen(!isCountryOpen)}
                                        className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl py-3 px-3 text-white hover:bg-white/[0.05] transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={selectedCountry.flag}
                                                alt={selectedCountry.name}
                                                className="w-6 h-4 object-cover rounded-[2px]"
                                            />
                                            <span className="text-xs text-white/60">{selectedCountry.dial}</span>
                                        </div>
                                        <ChevronDown size={14} className="text-white/40" />
                                    </button>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {isCountryOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full left-0 mt-2 w-64 bg-[#1A1A1C] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 p-2"
                                            >
                                                <div className="relative mb-2">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search..."
                                                        className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-gold/30"
                                                        value={countrySearch}
                                                        onChange={(e) => setCountrySearch(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                    {filteredCountries.map((country) => (
                                                        <button
                                                            key={country.code}
                                                            onClick={() => {
                                                                setSelectedCountry(country);
                                                                setIsCountryOpen(false);
                                                                setCountrySearch('');
                                                            }}
                                                            className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                                                        >
                                                            <img
                                                                src={country.flag}
                                                                alt={country.name}
                                                                className="w-6 h-4 object-cover rounded-[2px]"
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-white">{country.name}</span>
                                                                <span className="text-xs text-white/40">{country.dial}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Phone Number */}
                                <div className="relative">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                        placeholder="Phone Number"
                                        className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Date Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Date & Time</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    readOnly
                                    value={formData.date}
                                    onClick={() => setView('calendar')}
                                    placeholder="Select Date & Time"
                                    className={`w-full pl-12 pr-4 py-3 bg-white/[0.03] border rounded-xl text-white placeholder:text-white/20 focus:border-gold/40 focus:bg-white/[0.05] focus:outline-none transition-all duration-200 cursor-pointer ${errors.date ? 'border-red-500/50' : 'border-white/10'}`}
                                />
                            </div>
                            <InlineError message={errors.date} />
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            onClick={handleSubmit}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full py-3.5 mt-4 bg-gradient-to-br from-gold-dark via-gold to-gold text-white font-bold uppercase tracking-wider text-sm rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(197,160,89,0.3)] hover:shadow-[0_6px_30px_rgba(197,160,89,0.4)] transition-all duration-300"
                        >
                            Confirm Briefing
                            <ArrowRight size={18} />
                        </motion.button>

                        <p className="text-center text-[10px] text-white/30 mt-4">
                            By confirming, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </>
                ) : (
                    /* Calendar View */
                    <div className="flex flex-col items-center">
                        <div className="w-full mb-4">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-lg font-serif text-white">{months[currentMonth]} <span className="text-gold">{currentYear}</span></span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)}
                                        className="p-1 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors"
                                    >
                                        <ChevronDown size={20} className="rotate-90" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)}
                                        className="p-1 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors"
                                    >
                                        <ChevronDown size={20} className="-rotate-90" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                    <span key={day} className="text-center text-xs text-white/40 font-medium py-2">{day}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-y-2 justify-items-center">
                                {blanks.map(i => <div key={`blank-${i}`} />)}
                                {days.map(day => {
                                    const isSelected = day === selectedDate.getDate() && currentMonth === selectedDate.getMonth();
                                    const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => handleDateClick(day)}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-200
                                                ${isSelected
                                                    ? 'bg-gold text-obsidian font-bold shadow-[0_0_15px_rgba(197,160,89,0.5)]'
                                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                                }
                                                ${isToday && !isSelected ? 'border border-gold/50 text-gold' : ''}
                                            `}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Picker Dropdown */}
                        <div className="w-full space-y-1.5 relative z-50">
                            <label className="text-xs uppercase tracking-wider text-white/40 font-medium">Select Time</label>
                            <button
                                onClick={() => setIsTimeOpen(!isTimeOpen)}
                                className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white hover:border-gold/30 transition-colors"
                            >
                                <span className="font-serif text-lg">{selectedTimeSlot}</span>
                                <ChevronDown size={16} className={`text-gold transition-transform duration-300 ${isTimeOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isTimeOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: 10, height: 0 }}
                                        className="absolute bottom-full mb-2 left-0 w-full bg-[#1A1A1C] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
                                    >
                                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar p-2 grid grid-cols-3 gap-2">
                                            {timeSlots.map(time => (
                                                <button
                                                    key={time}
                                                    onClick={() => {
                                                        setSelectedTimeSlot(time);
                                                        setIsTimeOpen(false);
                                                    }}
                                                    className={`py-2 rounded-lg text-sm font-medium transition-all ${selectedTimeSlot === time
                                                        ? 'bg-gold text-obsidian font-bold'
                                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-3 w-full mt-6">
                            <button
                                onClick={() => setView('form')}
                                className="flex-1 py-3.5 rounded-xl border border-white/10 text-white font-bold uppercase tracking-wider text-xs hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDateTime}
                                className="flex-[2] py-3.5 bg-gradient-to-br from-gold-dark via-gold to-gold text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-[0_4px_20px_rgba(197,160,89,0.3)] hover:shadow-[0_6px_30px_rgba(197,160,89,0.4)] transition-all"
                            >
                                Confirm Time
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AuthModal>
    );
};

export default BriefingModal;
