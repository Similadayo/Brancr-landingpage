import { motion } from 'framer-motion';
import TelegramConnectButton from '../TelegramConnectButton';

interface Props {
    onComplete: () => void;
}

export default function OnboardingSuccess({ onComplete }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 text-center"
        >
            <div className="space-y-4">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-4xl mx-auto"
                >
                    🎉
                </motion.div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    You&apos;re all set!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Your AI assistant is ready. Connect your Telegram bot now to start handling messages instantly.
                </p>
            </div>

            <div className="max-w-sm mx-auto">
                <TelegramConnectButton variant="prominent" />
            </div>

            <button
                onClick={onComplete}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
                Skip for now →
            </button>
        </motion.div>
    );
}
