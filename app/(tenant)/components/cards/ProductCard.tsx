'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PackageIcon } from '../icons';

type ProductCardProps = {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  stock_count?: number;
  availability?: 'in_stock' | 'out_of_stock' | 'low_stock';
  images?: string[];
  href?: string;
};

export function ProductCard({
  id,
  name,
  description,
  price,
  currency,
  category,
  stock_count,
  availability = 'in_stock',
  images,
  href = `/app/products/${id}`,
}: ProductCardProps) {
  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in_stock':
        return 'bg-green-100 text-green-700';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-700';
      case 'out_of_stock':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-primary/50 hover:shadow-md active:scale-[0.98] overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
        {images && images.length > 0 ? (
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <PackageIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-1 flex-1">{name}</h3>
          {category && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 flex-shrink-0">
              {category}
            </span>
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {currency} {price.toLocaleString()}
            </p>
            {stock_count !== undefined && (
              <p className="text-xs text-gray-500 mt-0.5">
                Stock: {stock_count}
              </p>
            )}
          </div>
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getAvailabilityColor(availability)}`}>
            {availability === 'in_stock' ? 'In Stock' : availability === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    </Link>
  );
}

