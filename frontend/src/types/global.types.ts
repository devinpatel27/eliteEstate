export type Status = 'active' | 'inactive';

export interface SelectOption {
  label: string;
  value: string;
}

export interface TableMeta {
  onRefresh?: () => void;
}
