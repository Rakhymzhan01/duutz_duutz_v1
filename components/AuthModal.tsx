import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const { t } = useTranslation('auth');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        handleClose();
      } else {
        // Registration validation
        if (password !== confirmPassword) {
          setError(t('errors.passwordMismatch'));
          setIsLoading(false);
          return;
        }

        if (password.length < 8) {
          setError(t('errors.passwordLength'));
          setIsLoading(false);
          return;
        }

        if (!firstName.trim() || !lastName.trim()) {
          setError(t('errors.nameRequired'));
          setIsLoading(false);
          return;
        }

        await register(email, password, firstName.trim(), lastName.trim());
        handleClose();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      // Display the specific error message from the API
      const errorMessage = error?.message || t('errors.unexpectedError');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/30 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-300">
          {isLogin ? t('modal.welcomeBack') : t('modal.joinDuutz')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm">
              {error.split(', ').map((msg, index) => (
                <div key={index} className={index > 0 ? 'mt-1' : ''}>
                  {msg}
                </div>
              ))}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-2">
              {t('modal.emailAddress')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-purple-300"
              placeholder={t('modal.placeholders.email')}
            />
          </div>

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-purple-200 mb-2">
                    {t('modal.firstName')}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-purple-300"
                    placeholder={t('modal.placeholders.firstName')}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-purple-200 mb-2">
                    {t('modal.lastName')}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-purple-300"
                    placeholder={t('modal.placeholders.lastName')}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-2">
              {t('modal.password')}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLogin ? undefined : 8}
              className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-purple-300"
              placeholder={t('modal.placeholders.password')}
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-purple-200 mb-2">
                {t('modal.confirmPassword')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-purple-900/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-purple-300"
                placeholder={t('modal.placeholders.password')}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isLogin ? t('modal.signingIn') : t('modal.creatingAccount')}
              </div>
            ) : (
              isLogin ? t('modal.signIn') : t('modal.createAccount')
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-purple-200">
            {isLogin ? t('modal.noAccount') : t('modal.hasAccount')}
            <button
              onClick={toggleMode}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline"
            >
              {isLogin ? t('modal.signUp') : t('modal.signIn')}
            </button>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;