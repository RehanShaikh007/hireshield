import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'

const SignupPage = () => {
  const navigate = useNavigate();
  const { register, googleSignIn } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    // Validate basic fields
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.username.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    // Go to next step
    setCurrentStep(2);
  };



  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { username, firstName, lastName, email, password } = formData;
      const result = await register({
        username,
        firstName,
        lastName,
        email,
        password
      });

      if (result.success) {
        // Redirect to login page after successful registration
        toast.success('Registration successful! Please login with your credentials.');
        navigate('/login');
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto px-4 py-12 bg-gradient-to-t from-cyan-50 to-cyan-900 min-h-screen">
      <div className='mb-8'>
        <img src="./hire_logo.png" alt="hero logo" className="w-24 h-24 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-center mb-2 text-white drop-shadow-lg">{t('joinUs')}</h1>
        <p className="text-cyan-100 text-center">{t('createAccountStarted')}</p>
      </div>
      
      <div className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('signUp')}</h2>
          <p className="text-gray-600 font-medium">
            {currentStep === 1 ? t('step1Basic') : t('step2Security')}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentStep(1)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentStep >= 1 ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
              }`}
            >
              1
            </button>
            <div className={`w-12 h-1 mx-2 ${
              currentStep >= 2 ? 'bg-cyan-600' : 'bg-gray-300'
            }`}></div>
            <button
              onClick={() => {
                // Only allow going to step 2 if step 1 is completed
                if (formData.firstName.trim() && formData.lastName.trim() && formData.email.trim() && formData.username.trim()) {
                  setCurrentStep(2);
                } else {
                  toast.error('Please complete step 1 first');
                }
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentStep >= 2 ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
              }`}
            >
              2
            </button>
          </div>
        </div>

        {currentStep === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-6">
            <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-2">{t('username')}</label>
              <input 
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                                 placeholder={t('chooseUsername')}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                                 <label className="block text-sm font-semibold text-gray-700 mb-2">{t('firstName')}</label>
                <input 
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                                     placeholder={t('first_name')}
                  required
                />
              </div>
              <div>
                                 <label className="block text-sm font-semibold text-gray-700 mb-2">{t('lastName')}</label>
                <input 
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                                     placeholder={t('last_name')}
                  required
                />
              </div>
            </div>
            
            <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-2">{t('emailAddress')}</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                                 placeholder={t('enterEmail')}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold hover:from-cyan-700 hover:to-cyan-800 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
                             {t('continue')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-2">{t('password')}</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                                 placeholder={t('createStrongPassword')}
                required
              />
            </div>
            
            <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-2">{t('confirmPassword')}</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white/80 backdrop-blur-sm" 
                                 placeholder={t('confirmYourPassword')}
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold hover:from-cyan-700 hover:to-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            >
                             {loading ? t('creatingAccount') : t('createAccount')}
            </button>
          </form>
        )}
        
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
                         <span className="px-4 bg-white/95 text-gray-500 font-medium">{t('orContinueWith')}</span>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={async () => {
              setLoading(true);
              const result = await googleSignIn();
              if (result.success) {
                const user = result.data.user;
                if (user.role === 'super_admin') {
                  navigate('/superadmin');
                } else if (user.role === 'admin') {
                  navigate('/admin');
                } else {
                  navigate('/dashboard');
                }
              } else {
                toast.error(result.error);
              }
              setLoading(false);
            }}
            className="w-full px-6 py-4 rounded-xl bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
            disabled={loading}
          >
            <img src="./google.png" alt="Google logo" className="w-5 h-5" />
                         <span>{loading ? t('processing') : t('signUpWithGoogle')}</span>
          </button>
        </div>
        
        <div className="text-center">
                     <p className="text-gray-600 font-medium">
             {t('alreadyHaveAccount')}{' '}
             <Link to="/login" className="text-cyan-600 font-semibold hover:text-cyan-700 transition-colors duration-200">
               {t('signIn')}
             </Link>
           </p>
        </div>
      </div>
      
      <div className='text-center mt-8'>
                 <p className="text-sm font-medium text-black">
           {t('byContinuing')}{' '}
           <Link to="/terms" className="text-blue-600 font-semibold transition-all duration-200">
             {t('termsOfService')}
           </Link>
           {' '}{t('and')}{' '}
           <Link to="/privacy" className="text-blue-600 font-semibold transition-all duration-200">
             {t('privacyPolicy')}
           </Link>
         </p>
      </div>
    </div>
  )
}

export default SignupPage


