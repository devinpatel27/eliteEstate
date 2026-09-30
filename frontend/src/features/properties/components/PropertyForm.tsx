'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Building2,
  ChevronDown,
  ImageIcon,
  Loader2,
  MapPin,
  IndianRupee,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { propertyService } from '../services/property.service';
import { amenityService } from '../services/amenity.service';
import { masterService } from '@/features/leads/services/master.service';
import { Property, CreatePropertyData } from '../types/property.types';
import { MasterItem } from '@/features/leads/types/lead.types';
import {
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  FURNISHED_STATUSES,
  INDIAN_STATES,
} from '@/lib/constants';
import { cn, getImageUrl } from '@/lib/utils';

const COUNT_OPTIONS = ['0', '1', '2', '3', '4', '5', '6+'] as const;

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  purpose: z.enum(['buy', 'sell', 'rent']),
  propertyType: z.string().min(1, 'Property type is required'),
  status: z.enum(['available', 'sold', 'rented', 'reserved', 'under_negotiation']).optional(),
  expectedPrice: z.coerce.number().min(0).optional(),
  rentAmount: z.coerce.number().min(0).optional(),
  securityDeposit: z.coerce.number().min(0).optional(),
  maintenanceCharges: z.coerce.number().min(0).optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  landmark: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  publicLocationLabel: z.string().optional(),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  balconies: z.coerce.number().min(0).optional(),
  parking: z.coerce.number().min(0).optional(),
  superBuiltUpArea: z.coerce.number().min(0).optional(),
  carpetArea: z.coerce.number().min(0).optional(),
  furnishedStatus: z.enum(['fully', 'semi', 'unfurnished']).optional(),
  amenities: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  slug: z.string().optional(),
  publishOnWebsite: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  showPrice: z.boolean().optional(),
  hideExactLocation: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PropertyFormProps {
  property?: Property;
  onSuccess?: (property: Property) => void;
}

function countToSelectValue(value?: number): string {
  if (value === undefined || value === null) return '';
  if (value >= 6) return '6+';
  return String(value);
}

function selectValueToCount(value: string): number | undefined {
  if (!value) return undefined;
  if (value === '6+') return 6;
  return Number(value);
}

function FormSection({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="crm-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40"
      >
        <span className="flex items-center gap-2 text-base font-semibold">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t px-4 pb-4 pt-3">{children}</div>
        </div>
      </div>
    </Card>
  );
}

export function PropertyForm({ property, onSuccess }: PropertyFormProps) {
  const router = useRouter();
  const [propertyTypes, setPropertyTypes] = useState<MasterItem[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<MasterItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentProperty, setCurrentProperty] = useState<Property | undefined>(property);
  const [openSections, setOpenSections] = useState({
    basic: true,
    price: true,
    location: false,
    details: false,
    amenities: false,
    media: true,
    seo: false,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: property?.title || '',
      description: property?.description || '',
      purpose: property?.purpose || 'buy',
      propertyType: property?.propertyType?._id || '',
      status: property?.status || 'available',
      expectedPrice: property?.expectedPrice,
      rentAmount: property?.rentAmount,
      securityDeposit: property?.securityDeposit,
      maintenanceCharges: property?.maintenanceCharges,
      country: property?.country || 'India',
      state: property?.state || '',
      city: property?.city || '',
      area: property?.area || '',
      landmark: property?.landmark || '',
      latitude: property?.latitude,
      longitude: property?.longitude,
      publicLocationLabel: property?.publicLocationLabel || '',
      bedrooms: property?.bedrooms,
      bathrooms: property?.bathrooms,
      balconies: property?.balconies,
      parking: property?.parking,
      superBuiltUpArea: property?.superBuiltUpArea,
      carpetArea: property?.carpetArea,
      furnishedStatus: property?.furnishedStatus,
      amenities: property?.amenities?.map((a) => a._id) || [],
      metaTitle: property?.metaTitle || '',
      metaDescription: property?.metaDescription || '',
      slug: property?.slug || '',
      publishOnWebsite: property?.publishOnWebsite ?? false,
      isFeatured: property?.isFeatured ?? false,
      showPrice: property?.showPrice ?? true,
      hideExactLocation: property?.hideExactLocation ?? true,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const purpose = watch('purpose');
  const selectedAmenities = watch('amenities') || [];
  const isRent = purpose === 'rent';
  const prop = currentProperty || property;
  const canUpload = Boolean(prop?._id);

  useEffect(() => {
    Promise.all([
      masterService.listPropertyTypes(true),
      amenityService.list(true),
    ]).then(([typesRes, amenitiesRes]) => {
      if (typesRes.success) setPropertyTypes(typesRes.data || []);
      if (amenitiesRes.success) setAmenitiesList(amenitiesRes.data || []);
    });
  }, []);

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      const payload: CreatePropertyData = { ...data };
      const res = prop?._id
        ? await propertyService.update(prop._id, payload)
        : await propertyService.create(payload);

      if (res.success && res.data) {
        toast.success(prop?._id ? 'Property updated' : 'Property created — you can now upload photos');
        setCurrentProperty(res.data);
        onSuccess?.(res.data);
        setOpenSections((prev) => ({ ...prev, media: true }));
        if (!prop?._id) {
          window.history.replaceState(null, '', `/properties/${res.data._id}`);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpload = async (
    file: File,
    mediaType: 'featured' | 'gallery' | 'video' | 'floorplan'
  ) => {
    const propId = prop?._id;
    if (!propId) {
      toast.error('Save the property first before uploading media');
      return;
    }
    setUploading(true);
    try {
      const res = await propertyService.uploadMedia(propId, file, mediaType);
      if (res.success && res.data) {
        setCurrentProperty(res.data);
        toast.success('Media uploaded');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    const propId = prop?._id;
    if (!propId) return;
    try {
      const res = await propertyService.deleteMedia(propId, mediaId);
      if (res.success && res.data) {
        setCurrentProperty(res.data);
        toast.success('Media removed');
      }
    } catch {
      toast.error('Failed to remove media');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-4 pb-4">
      <Card className="crm-card p-4">
        <Label className="text-sm font-semibold">Property Purpose *</Label>
        <p className="mb-3 mt-1 text-xs text-muted-foreground">
          Choose purpose first — price fields will adjust automatically.
        </p>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_PURPOSES.map((p) => (
            <label
              key={p.value}
              className={cn(
                'cursor-pointer rounded-xl border px-5 py-2.5 text-sm font-medium transition-all',
                purpose === p.value
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-background hover:border-primary/40'
              )}
            >
              <input
                type="radio"
                className="sr-only"
                value={p.value}
                checked={purpose === p.value}
                onChange={() => setValue('purpose', p.value as FormValues['purpose'])}
              />
              {p.label}
            </label>
          ))}
        </div>
      </Card>

      <FormSection
        title="Basic Information"
        icon={Building2}
        open={openSections.basic}
        onToggle={() => toggleSection('basic')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Property Title *</Label>
            <Input {...register('title')} className="mt-1" placeholder="e.g. 3 BHK Apartment in Satellite" />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>
          {property?.propertyCode && (
            <div>
              <Label>Property Code</Label>
              <Input value={property.propertyCode} disabled className="mt-1" />
            </div>
          )}
          <div>
            <Label>Property Type *</Label>
            <Select value={watch('propertyType')} onValueChange={(v) => setValue('propertyType', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {propertyTypes.map((t) => (
                  <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.propertyType && <p className="mt-1 text-xs text-destructive">{errors.propertyType.message}</p>}
          </div>
          <div>
            <Label>Status</Label>
            <Select value={watch('status')} onValueChange={(v) => setValue('status', v as FormValues['status'])}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea {...register('description')} className="mt-1 min-h-[80px]" placeholder="Short property description..." />
          </div>
        </div>
      </FormSection>

      <FormSection
        title={isRent ? 'Rent & Charges' : 'Sale Price'}
        icon={IndianRupee}
        open={openSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {isRent ? (
            <>
              <div>
                <Label>Rent Amount (₹) *</Label>
                <Input type="number" {...register('rentAmount')} className="mt-1" placeholder="Monthly rent" />
              </div>
              <div>
                <Label>Security Deposit (₹)</Label>
                <Input type="number" {...register('securityDeposit')} className="mt-1" />
              </div>
              <div>
                <Label>Maintenance Charges (₹)</Label>
                <Input type="number" {...register('maintenanceCharges')} className="mt-1" />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <Label>Expected Price (₹)</Label>
              <Input type="number" {...register('expectedPrice')} className="mt-1" placeholder="Asking price" />
            </div>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Location"
        icon={MapPin}
        open={openSections.location}
        onToggle={() => toggleSection('location')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Country</Label><Input {...register('country')} className="mt-1" /></div>
          <div>
            <Label>State</Label>
            <Select value={watch('state') || ''} onValueChange={(v) => setValue('state', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>City</Label><Input {...register('city')} className="mt-1" /></div>
          <div><Label>Area</Label><Input {...register('area')} className="mt-1" /></div>
          <div><Label>Landmark</Label><Input {...register('landmark')} className="mt-1" /></div>
          <div className="sm:col-span-2">
            <Label>Public Location Label (shown on website)</Label>
            <Input {...register('publicLocationLabel')} placeholder="e.g. Near SG Highway, Ahmedabad" className="mt-1" />
          </div>
          <details className="sm:col-span-2 rounded-lg border px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">Internal coordinates (optional)</summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div><Label>Latitude</Label><Input type="number" step="any" {...register('latitude')} className="mt-1" /></div>
              <div><Label>Longitude</Label><Input type="number" step="any" {...register('longitude')} className="mt-1" /></div>
            </div>
          </details>
        </div>
      </FormSection>

      <FormSection
        title="Property Details"
        icon={Building2}
        open={openSections.details}
        onToggle={() => toggleSection('details')}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {(['bedrooms', 'bathrooms', 'balconies', 'parking'] as const).map((field) => (
            <div key={field}>
              <Label className="capitalize">{field}</Label>
              <Select
                value={countToSelectValue(watch(field))}
                onValueChange={(v) => setValue(field, selectValueToCount(v))}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {COUNT_OPTIONS.map((n) => (
                    <SelectItem key={n} value={n}>{n === '6+' ? '6+' : n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div><Label>Super Built-up (sqft)</Label><Input type="number" {...register('superBuiltUpArea')} className="mt-1" /></div>
          <div><Label>Carpet Area (sqft)</Label><Input type="number" {...register('carpetArea')} className="mt-1" /></div>
          <div>
            <Label>Furnished Status</Label>
            <Select value={watch('furnishedStatus') || ''} onValueChange={(v) => setValue('furnishedStatus', v as FormValues['furnishedStatus'])}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {FURNISHED_STATUSES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Amenities"
        open={openSections.amenities}
        onToggle={() => toggleSection('amenities')}
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {amenitiesList.map((amenity) => (
            <label key={amenity._id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedAmenities.includes(amenity._id)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selectedAmenities, amenity._id]
                    : selectedAmenities.filter((id) => id !== amenity._id);
                  setValue('amenities', next);
                }}
              />
              {amenity.name}
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Photos & Media"
        icon={ImageIcon}
        open={openSections.media}
        onToggle={() => toggleSection('media')}
      >
        {!canUpload ? (
          <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            <Upload className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="font-medium text-foreground">Save the property first</p>
            <p className="mt-1">Click &quot;Create Property&quot; below, then upload featured image, gallery photos, floor plans, and videos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(['featured', 'gallery', 'floorplan'] as const).map((type) => (
                <MediaUploadButton
                  key={type}
                  accept="image/*"
                  label={type === 'featured' ? 'Featured image' : type === 'gallery' ? 'Gallery photo' : 'Floor plan'}
                  disabled={uploading}
                  onSelect={(file) => handleMediaUpload(file, type)}
                />
              ))}
              <MediaUploadButton
                accept="video/*"
                label="Video"
                disabled={uploading}
                onSelect={(file) => handleMediaUpload(file, 'video')}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              {prop?.featuredImage && (
                <MediaThumb item={prop.featuredImage} onDelete={() => prop.featuredImage?._id && handleDeleteMedia(prop.featuredImage._id)} />
              )}
              {prop?.gallery?.map((g) => (
                <MediaThumb key={g._id} item={g} onDelete={() => g._id && handleDeleteMedia(g._id)} />
              ))}
              {prop?.floorPlans?.map((f) => (
                <MediaThumb key={f._id} item={f} onDelete={() => f._id && handleDeleteMedia(f._id)} />
              ))}
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        title="SEO & Website"
        open={openSections.seo}
        onToggle={() => toggleSection('seo')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Meta Title</Label><Input {...register('metaTitle')} className="mt-1" /></div>
          <div><Label>Slug</Label><Input {...register('slug')} placeholder="auto-generated from title" className="mt-1" /></div>
          <div className="sm:col-span-2"><Label>Meta Description</Label><Textarea {...register('metaDescription')} className="mt-1 min-h-[60px]" /></div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { key: 'publishOnWebsite' as const, label: 'Publish on Website' },
            { key: 'isFeatured' as const, label: 'Featured Property' },
            { key: 'showPrice' as const, label: 'Show Price' },
            { key: 'hideExactLocation' as const, label: 'Hide Exact Location' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Label className="text-sm">{label}</Label>
              <Switch checked={watch(key)} onCheckedChange={(v) => setValue(key, v)} />
            </div>
          ))}
        </div>
      </FormSection>

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" className="crm-btn-primary gap-2" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {prop?._id ? 'Update Property' : 'Create Property'}
        </Button>
        {canUpload && (
          <Button type="button" variant="secondary" onClick={() => router.push('/properties')}>
            Done
          </Button>
        )}
      </div>
    </form>
  );
}

function MediaUploadButton({
  accept,
  label,
  disabled,
  onSelect,
}: {
  accept: string;
  label: string;
  disabled?: boolean;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        {label}
      </Button>
    </>
  );
}

function MediaThumb({ item, onDelete }: { item: { _id?: string; path: string; thumbPath?: string }; onDelete: () => void }) {
  const src = getImageUrl(item.thumbPath || item.path);
  if (!src) return null;
  return (
    <div className="relative h-20 w-28 overflow-hidden rounded-lg border">
      <Image src={src} alt="" fill className="object-cover" sizes="112px" />
      <button type="button" onClick={onDelete} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
