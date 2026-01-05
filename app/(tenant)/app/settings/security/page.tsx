'use client';

import { useState, FormEvent } from 'react';
import { authApi, ApiError } from '@/lib/api';
import { validatePassword } from '@/lib/validation';
import { PasswordStrengthIndicator } from '@/app/(auth)/components/PasswordStrengthIndicator';
import { toast } from 'react-hot-toast';

export default function SecuritySettingsPage() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccess(false);

        // Validate passwords match
        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        // Validate new password strength
        const validation = validatePassword(formData.newPassword);
        if (!validation.isValid) {
            setError(validation.errors[0]);
            return;
        }

        // Ensure new password is different from current
        if (formData.currentPassword === formData.newPassword) {
            setError('New password must be different from current password');
            return;
        }

        setIsSubmitting(true);

        try {
            await authApi.changePassword({
                current_password: formData.currentPassword,
                new_password: formData.newPassword,
            });

            setSuccess(true);
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            toast.success('Password changed successfully!');
        } catch (err) {
            if (err instanceof ApiError) {
                // Handle specific backend errors
                if (err.body?.error === 'weak_password' || err.body?.error === 'validation_error') {
                    setError(err.message || 'Password does not meet requirements');
                } else if (err.body?.error === 'invalid_credentials' || err.status === 401) {
                    setError('Current password is incorrect');
                } else {
                    setError(err.message || 'Failed to change password');
                }
            } else {
                setError('Failed to change password. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <header className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl md:text-3xl lg:text-4xl">Security Settings</h1>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">Manage your account security and password</p>
                    </div>
                </div>
            </header>

            {/* Change Password Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                    Update your password regularly to keep your account secure.
                </p>

                <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-200">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200">
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Password changed successfully!
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Current Password
                        </label>
                        <input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            required
                            value={formData.currentPassword}
                            onChange={(e) => handleChange('currentPassword', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
                            placeholder="Enter your current password"
                            autoComplete="current-password"
                        />
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            New Password
                        </label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            required
                            minLength={8}
                            value={formData.newPassword}
                            onChange={(e) => handleChange('newPassword', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
                            placeholder="Enter new password"
                            autoComplete="new-password"
                        />
                        <PasswordStrengthIndicator password={formData.newPassword} />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm New Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={8}
                            value={formData.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:bg-dark-surface dark:border-dark-border dark:text-white dark:focus:border-primary"
                            placeholder="Confirm new password"
                            autoComplete="new-password"
                        />
                        {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">Passwords do not match</p>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50 dark:bg-dark-accent-primary dark:text-white dark:hover:bg-dark-accent-primary/90 sm:w-auto"
                        >
                            {isSubmitting ? 'Changing Password...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Security Tips */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Security Tips</h2>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Use a unique password that you don't use on other sites</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Include uppercase, lowercase, numbers, and avoid common words</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Consider using a password manager to generate and store passwords</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <svg className="h-5 w-5 flex-shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Never share your password or enter it on untrusted sites</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
