'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2, Globe, Star, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Property } from '../types/property.types';
import { formatDate, getImageUrl } from '@/lib/utils';
import { PROPERTY_PURPOSES, PROPERTY_STATUSES } from '@/lib/constants';

interface ColumnOptions {
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  onRefresh: () => void;
  onDelete: (property: Property) => void;
  onTogglePublish: (property: Property) => void;
  onToggleFeature: (property: Property) => void;
}

const formatPurpose = (purpose: string) =>
  PROPERTY_PURPOSES.find((p) => p.value === purpose)?.label || purpose;

const formatStatus = (status: string) =>
  PROPERTY_STATUSES.find((s) => s.value === status)?.label || status;

const formatPrice = (property: Property) => {
  if (property.purpose === 'rent') {
    return property.rentAmount ? `₹${property.rentAmount.toLocaleString('en-IN')}/mo` : '—';
  }
  return property.expectedPrice ? `₹${property.expectedPrice.toLocaleString('en-IN')}` : '—';
};

export function getPropertyColumns(options: ColumnOptions): ColumnDef<Property>[] {
  return [
    {
      accessorKey: 'propertyCode',
      header: 'Code',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium">{row.original.propertyCode}</span>
      ),
    },
    {
      id: 'image',
      header: 'Image',
      cell: ({ row }) => {
        const img = row.original.featuredImage;
        const src = getImageUrl(img?.thumbPath || img?.path);
        return src ? (
          <div className="relative h-10 w-14 overflow-hidden rounded-lg border">
            <Image src={src} alt="" fill className="object-cover" sizes="56px" />
          </div>
        ) : (
          <div className="flex h-10 w-14 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
            N/A
          </div>
        );
      },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <Link
          href={`/properties/${row.original._id}?edit=true`}
          className="max-w-[200px] truncate font-medium text-primary hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: 'purpose',
      header: 'Purpose',
      cell: ({ row }) => <Badge variant="outline">{formatPurpose(row.original.purpose)}</Badge>,
    },
    {
      id: 'propertyType',
      header: 'Type',
      cell: ({ row }) => row.original.propertyType?.name || '—',
    },
    {
      id: 'price',
      header: 'Price',
      cell: ({ row }) => formatPrice(row.original),
    },
    {
      id: 'area',
      header: 'Area',
      cell: ({ row }) => row.original.area || row.original.city || '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="secondary">{formatStatus(row.original.status)}</Badge>
      ),
    },
    {
      id: 'published',
      header: 'Published',
      cell: ({ row }) => (
        <Badge variant={row.original.publishOnWebsite ? 'default' : 'outline'}>
          {row.original.publishOnWebsite ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      id: 'featured',
      header: 'Featured',
      cell: ({ row }) => (
        <Badge variant={row.original.isFeatured ? 'default' : 'outline'}>
          {row.original.isFeatured ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => {
        const property = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            {options.canEdit && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Edit">
                <Link href={`/properties/${property._id}?edit=true`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="More actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/properties/${property._id}`}>
                    <Eye className="mr-2 h-4 w-4" /> View
                  </Link>
                </DropdownMenuItem>
                {options.canEdit && (
                  <DropdownMenuItem asChild>
                    <Link href={`/properties/${property._id}?edit=true`}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Link>
                  </DropdownMenuItem>
                )}
              {options.canPublish && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => options.onTogglePublish(property)}>
                    <Globe className="mr-2 h-4 w-4" />
                    {property.publishOnWebsite ? 'Unpublish' : 'Publish'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => options.onToggleFeature(property)}>
                    <Star className="mr-2 h-4 w-4" />
                    {property.isFeatured ? 'Unfeature' : 'Feature'}
                  </DropdownMenuItem>
                </>
              )}
              {options.canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => options.onDelete(property)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
