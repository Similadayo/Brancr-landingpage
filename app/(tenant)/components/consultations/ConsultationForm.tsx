'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateService, useUpdateService, useDeleteService, type Service } from '../../hooks/useServices';
import { TrashIcon, ArrowLeftIcon } from '../icons';
import ConfirmModal from '@/app/components/ConfirmModal';
import { toast } from 'react-hot-toast';
import { getUserFriendlyErrorMessage, parseApiFieldErrors } from '@/lib/error-messages';
import Link from 'next/link';
import Select from '../ui/Select';

type ConsultationFormProps = { consultation?: Service | null };

export default function ConsultationForm({ consultation }: ConsultationFormProps) {
  const router = useRouter();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  const [formData, setFormData] = useState({
    name: consultation?.name || '',
    description: consultation?.description || '',
    pricing_type: consultation?.pricing.type || 'fixed',
    pricing_amount: (consultation?.pricing as any)?.amount !== undefined ? String((consultation?.pricing as any)?.amount) : '',
    duration: consultation?.duration || '',
    category: consultation?.category || '',
    is_active: consultation?.is_active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});

  useEffect(() => {
    if (consultation) setFormData({
      name: consultation.name || '',
      description: consultation.description || '',
      pricing_type: consultation.pricing.type || 'fixed',
      pricing_amount: (consultation.pricing as any)?.amount !== undefined ? String((consultation.pricing as any)?.amount) : '',
      duration: consultation.duration || '',
      category: consultation.category || '',
      is_active: consultation.is_active ?? true,
    });
  }, [consultation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsedAmount = formData.pricing_amount === '' ? undefined : Number(formData.pricing_amount);
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        pricing: { type: formData.pricing_type as any, amount: parsedAmount },
        duration: formData.duration || undefined,
        category: formData.category || undefined,
        is_active: formData.is_active,
      } as any;

      if (consultation) {
        await updateMutation.mutateAsync({ serviceId: consultation.id, payload });
        toast.success('Consultation updated');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Consultation created');
      }
      router.push('/app/consultations');
    } catch (err: any) {
      console.error('Submit error:', err);
      if (err && err.status) {
        const fields = parseApiFieldErrors(err);
        if (Object.keys(fields).length) setFieldErrors((prev) => ({ ...prev, ...fields }));
        toast.error(getUserFriendlyErrorMessage(err, { action: consultation ? 'updating consultation' : 'creating consultation', resource: 'consultation' }));
      } else {
        toast.error('Failed to submit');
      }
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!consultation) return;
    try {
      await deleteMutation.mutateAsync(consultation.id);
      toast.success('Consultation deleted');
      router.push('/app/consultations');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/app/consultations" className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{consultation ? 'Edit Consultation' : 'Add Consultation'}</h1>
          <p className="mt-1 text-sm text-gray-600">{consultation ? 'Update' : 'Create a new consultation offering'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Name *</label>
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>

          <details className="group rounded-xl border border-gray-100 bg-gray-50 p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">Optional</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Duration</label>
                <input value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Category</label>
                <input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
              </div>

            </div>
          </details>

          <details className="group rounded-xl border border-gray-100 bg-gray-50 p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900">Advanced</summary>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-700">Pricing Type</label>
              <div className="mt-1 sm:w-56">
                <Select id="consultation-pricing-type" value={formData.pricing_type} onChange={(v)=> setFormData({ ...formData, pricing_type: String(v) })} options={[{ value: 'fixed', label: 'Fixed' }, { value: 'hourly', label: 'Hourly' }]} searchable={false} />
              </div>

              {formData.pricing_type === 'fixed' && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700">Amount (NGN)</label>
                  <input value={formData.pricing_amount} onChange={(e) => setFormData({ ...formData, pricing_amount: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
                </div>
              )}
            </div>
          </details>

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={formData.is_active} onChange={(e)=> setFormData({ ...formData, is_active: e.target.checked })} className="h-4 w-4" />
            <label className="text-sm font-medium text-gray-700">Consultation is active</label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
            <Link href="/app/consultations" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary">Cancel</Link>
            <button type="submit" disabled={isSubmitting || Object.keys(fieldErrors).length > 0} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">{isSubmitting ? 'Saving...' : consultation ? 'Update Consultation' : 'Create Consultation'}</button>
          </div>
        </div>
      </form>

      {consultation && (
        <div className="mt-4">
          <button onClick={()=> setShowDeleteConfirm(true)} className="rounded-md border border-rose-200 px-3 py-2 text-rose-600">Delete</button>
          {showDeleteConfirm && (
            <ConfirmModal open={true} title="Delete consultation" description="Are you sure?" confirmText="Delete" onConfirm={()=> { setShowDeleteConfirm(false); void handleDelete(); }} onCancel={() => setShowDeleteConfirm(false)} />
          )}
        </div>
      )}
    </div>
  );
}
