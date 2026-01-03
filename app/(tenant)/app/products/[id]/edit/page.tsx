'use client';

import Link from "next/link";
import { useProducts } from "../../../../hooks/useProducts";
import ProductForm from "../../../../components/products/ProductForm";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const productId = params.id;

  const { data: products = [], isLoading } = useProducts();
  const product = products.find((p) => p.id === productId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
        <p className="text-sm font-semibold text-rose-900">Product not found</p>
        <Link href="/app/products" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  return <ProductForm product={product} />;
}
