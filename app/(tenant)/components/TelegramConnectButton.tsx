import { useState } from 'react';
import { authApi, tenantApi } from '@/lib/api';
import { DevicePhoneMobileIcon, RocketIcon } from './icons';

interface Props {
    variant?: 'inline' | 'card' | 'prominent' | 'solid';
    onSuccess?: () => void;
    tenantId?: string;
    className?: string;
    children?: React.ReactNode;
}

export default function TelegramConnectButton({ variant = 'inline', onSuccess, tenantId: propTenantId, className, children }: Props) {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            // Get secure deep link from backend
            // This generates a random token and stores it on the tenant record
            const res = await tenantApi.getTelegramConnectLink();

            if (!res || !res.link) {
                console.error('No link returned from API');
                return;
            }

            // Open Telegram in new tab
            window.open(res.link, '_blank');

            // Optional: Poll for connection status
            if (onSuccess) {
                // Could poll /api/tenant/me to check if TelegramBotToken is now set
                onSuccess();
            }
        } catch (err) {
            console.error('Failed to get connect link', err);
        } finally {
            setLoading(false);
        }
    };

    if (variant === 'prominent') {
        return (
            <div className="flex flex-col items-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-center space-y-4 max-w-sm mx-auto">
                <div className="text-4xl text-[#0088cc]">
                    <DevicePhoneMobileIcon className="w-10 h-10" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Connect Your Telegram Bot</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Link your business bot to start receiving messages.</p>
                </div>
                <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="w-full py-3 px-6 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? 'Getting link...' : (
                        <>
                            <RocketIcon className="w-5 h-5" />
                            <span>Connect with Telegram</span>
                        </>
                    )}
                </button>
                <small className="text-xs text-gray-400 dark:text-gray-500">Opens Telegram app</small>
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex-shrink-0 bg-[#0088cc]/10 rounded-full flex items-center justify-center text-[#0088cc]">
                        {/* Telegram Icon */}
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Telegram</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect your bot to manage conversations</p>
                    </div>
                </div>
                <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white text-sm font-medium transition-colors disabled:opacity-70"
                >
                    {loading ? '...' : 'Connect'}
                </button>
            </div>
        );
    }

    if (variant === 'solid') {
        return (
            <button
                onClick={handleConnect}
                disabled={loading}
                className={`flex items-center gap-2 rounded-lg bg-[#0088cc] hover:bg-[#0077b5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${className || ''}`}
            >
                {loading ? (
                    'Loading...'
                ) : children ? (
                    children
                ) : (
                    <>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                        </svg>
                        <span>Connect Telegram</span>
                    </>
                )}
            </button>
        );
    }

    // inline (default)
    return (
        <button
            onClick={handleConnect}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] text-sm font-medium transition-colors disabled:opacity-50 ${className || ''}`}
        >
            {loading ? 'Connecting...' : (
                <>
                    <DevicePhoneMobileIcon className="w-4 h-4" />
                    <span>Connect Telegram</span>
                </>
            )}
        </button>
    );
}
