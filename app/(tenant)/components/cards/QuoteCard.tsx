'use client';

import { DocumentTextIcon, CheckCircleIcon, ClockIcon } from '../icons';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

type QuoteCardProps = {
    orderId: string | number;
    amount?: number;
    currency?: string;
    status?: string;
    href?: string;
};

export function QuoteCard({
    orderId,
    amount,
    currency = 'NGN', // Default currency
    status = 'generated',
    href,
}: QuoteCardProps) {
    // If no href provided, default to order details
    const link = href || `/app/orders/${orderId}`;

    return (
        <Card href={link} hoverable className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10">
            <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <DocumentTextIcon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Quote Generated
                        </h4>
                        <Badge variant="info" size="sm" className="hidden sm:inline-flex">
                            #{orderId}
                        </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Click to view quote details
                    </p>
                </div>

                {amount !== undefined && (
                    <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {currency} {amount.toLocaleString()}
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}
