'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from "../../hooks/useProducts";
import { TrashIcon, ArrowLeftIcon } from "../icons";
import ImageUploader from "../shared/ImageUploader";
import VariantBuilder from "../shared/VariantBuilder";
import { toast } from "react-hot-toast";
import { getUserFriendlyErrorMessage, parseApiFieldErrors } from '@/lib/error-messages';
import Link from "next/link";
import Select from "../ui/Select";
import ConfirmModal from '@/app/components/ConfirmModal';

type ProductFormProps = {
  product?: Product | null;
};

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price !== undefined ? String(product.price) : "",
    currency: product?.currency || "NGN",
    category: product?.category || "",
    negotiation_mode: product?.negotiation_mode || "default",
    negotiation_min_price: product?.negotiation_min_price !== undefined ? String(product.negotiation_min_price) : "",
    negotiation_max_price: product?.negotiation_max_price !== undefined ? String(product.negotiation_max_price) : "",
    sku: (product as any)?.sku || "",
    stock_count: product?.stock_count ?? -1,
    availability: product?.availability || "in_stock",
    is_active: product?.is_active ?? true,
    tags: product?.tags?.join(", ") || "",
    images: product?.images || [],
    variants: product?.variants || {},
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price !== undefined ? String(product.price) : "",
        currency: product.currency || "NGN",
        category: product.category || "",
        negotiation_mode: product.negotiation_mode || "default",
        negotiation_min_price: product.negotiation_min_price !== undefined ? String(product.negotiation_min_price) : "",
        negotiation_max_price: product.negotiation_max_price !== undefined ? String(product.negotiation_max_price) : "",
        sku: (product as any)?.sku || "",
        stock_count: product.stock_count ?? -1,
        availability: product.availability || "in_stock",
        is_active: product.is_active ?? true,
        tags: product.tags?.join(", ") || "",
        images: product.images || [],
        variants: product.variants || {},
      });
    }
  }, [product]);

  useEffect(() => {
    const nextErrors: Record<string, string> = {};
    if (formData.negotiation_mode === 'range') {
      const min = formData.negotiation_min_price === '' ? NaN : Number(formData.negotiation_min_price);
      const max = formData.negotiation_max_price === '' ? NaN : Number(formData.negotiation_max_price);
      if (!Number.isFinite(min)) nextErrors.negotiation_min_price = 'Min price is required';
      else if (min <= 0) nextErrors.negotiation_min_price = 'Min price must be greater than 0';
      if (!Number.isFinite(max)) nextErrors.negotiation_max_price = 'Max price is required';
      else if (max <= 0) nextErrors.negotiation_max_price = 'Max price must be greater than 0';
      if (Number.isFinite(min) && Number.isFinite(max) && min > max) nextErrors.negotiation_min_price = 'Min must be less than or equal to Max';
    } else {
      // remove negotiation errors
      delete fieldErrors.negotiation_min_price;
      delete fieldErrors.negotiation_max_price;
    }
    setFieldErrors((prev) => {
      const base = Object.keys(prev).reduce((acc: Record<string, string>, k) => {
        if (!['negotiation_min_price', 'negotiation_max_price'].includes(k)) acc[k] = prev[k];
        return acc;
      }, {} as Record<string,string>);
      return { ...base, ...nextErrors };
    });
  }, [formData.negotiation_mode, formData.negotiation_min_price, formData.negotiation_max_price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedPrice = Number(formData.price);

      const negotiationMin = formData.negotiation_min_price === "" ? undefined : Number(formData.negotiation_min_price);
      const negotiationMax = formData.negotiation_max_price === "" ? undefined : Number(formData.negotiation_max_price);

      if (formData.negotiation_mode === "range") {
        if (!Number.isFinite(negotiationMin as number) || !Number.isFinite(negotiationMax as number)) {
          toast.error("Set both min and max prices for negotiation range");
          setIsSubmitting(false);
          return;
        }
        if ((negotiationMin as number) > (negotiationMax as number)) {
          toast.error("Negotiation min price cannot exceed max price");
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        currency: formData.currency,
        category: formData.category || undefined,
        negotiation_mode: formData.negotiation_mode,
        negotiation_min_price: formData.negotiation_mode === "range" ? (negotiationMin as number) : undefined,
        negotiation_max_price: formData.negotiation_mode === "range" ? (negotiationMax as number) : undefined,
        sku: formData.sku || undefined,
        stock_count: formData.stock_count === -1 ? undefined : formData.stock_count,
        availability: formData.availability,
        is_active: formData.is_active,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        variants: Object.keys(formData.variants).length > 0 ? formData.variants : undefined,
      };

      if (product) {
        await updateMutation.mutateAsync({ productId: product.id, payload });
        toast.success("Product updated successfully");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Product created successfully");
      }
      router.push("/app/products");
    } catch (error: any) {
      console.error("Form submission error:", error);
      if (error && error.status) {
        const fields = parseApiFieldErrors(error);
        if (Object.keys(fields).length) setFieldErrors((prev) => ({ ...prev, ...fields }));
        console.error('API error details:', { status: error.status, body: error.body });
        toast.error(getUserFriendlyErrorMessage(error, { action: product ? 'updating product' : 'creating product', resource: 'product' }));
      } else {
        toast.error('Failed to submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success("Product deleted successfully");
      router.push("/app/products");
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return null;
}
