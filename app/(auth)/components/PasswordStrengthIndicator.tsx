'use client';

import { validatePassword, type PasswordValidationResult } from '@/lib/validation';

interface PasswordStrengthIndicatorProps {
    password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const validation: PasswordValidationResult = validatePassword(password);

    const requirements = [
        { label: 'At least 8 characters', met: validation.checks.minLength },
        { label: 'Uppercase letter (A-Z)', met: validation.checks.hasUppercase },
        { label: 'Lowercase letter (a-z)', met: validation.checks.hasLowercase },
        { label: 'Number (0-9)', met: validation.checks.hasNumber },
        { label: 'No common patterns', met: validation.checks.noWeakPatterns },
    ];

    // Don't show anything if password is empty
    if (!password) {
        return null;
    }

    return (
        <div className="mt-2 space-y-1.5">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Password must include:</p>
            <ul className="text-xs space-y-1">
                {requirements.map((req, i) => (
                    <li
                        key={i}
                        className={`flex items-center gap-1.5 transition-colors ${req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                            }`}
                    >
                        {req.met ? (
                            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        ) : (
                            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}
                        <span>{req.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
