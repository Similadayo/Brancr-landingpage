'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon, CheckCircleIcon, XIcon } from '../icons';

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
};

type BaseProps<T extends string> = {
  id?: string;
  name?: string;
  options: Array<SelectOption<T>>;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
  buttonClassName?: string;
};

type SingleProps<T extends string> = BaseProps<T> & {
  multiple?: false;
  value: T | '';
  onChange: (value: T | '') => void;
};

type MultiProps<T extends string> = BaseProps<T> & {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
};

export type SelectProps<T extends string = string> = SingleProps<T> | MultiProps<T>;

export default function Select<T extends string = string>(props: SelectProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const searchable = props.searchable !== false;

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.options;
    return props.options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [props.options, query]);

  const selectedLabels = useMemo(() => {
    if (props.multiple) {
      const selected = new Set(props.value);
      return props.options.filter((o) => selected.has(o.value)).map((o) => o.label);
    }

    if (props.value === undefined || props.value === null) return [];
    const found = props.options.find((o) => o.value === props.value);
    return found ? [found.label] : [];
  }, [props.multiple, props.options, props.value]);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (!containerRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);

    const t = setTimeout(() => {
      if (searchable) {
        searchRef.current?.focus();
      } else {
        listRef.current?.focus();
      }
    }, 0);

    return () => clearTimeout(t);
  }, [open, searchable]);

  const isSelected = (value: T) => {
    if (props.multiple) return props.value.includes(value);
    return props.value === value;
  };

  const commitSingle = (value: T | '') => {
    if (props.multiple) return;
    props.onChange(value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const toggleMulti = (value: T) => {
    if (!props.multiple) return;
    const next = props.value.includes(value)
      ? props.value.filter((v) => v !== value)
      : [...props.value, value];
    props.onChange(next);
  };

  const clearMulti = () => {
    if (!props.multiple) return;
    props.onChange([]);
  };

  const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (props.disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((v) => !v);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      return;
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, filteredOptions.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filteredOptions[activeIndex];
      if (!opt || opt.disabled) return;
      if (props.multiple) {
        toggleMulti(opt.value);
      } else {
        commitSingle(opt.value);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${props.className || ''}`}>
      <button
        ref={buttonRef}
        name={props.name}
        type="button"
        disabled={props.disabled}
        onClick={() => !props.disabled && setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        className={`group relative flex w-full items-center justify-between gap-2 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 ${
          props.buttonClassName ?? ''
        }`}
        style={props.buttonClassName?.includes('bg-transparent') ? { backgroundColor: 'transparent', border: 'none' } : undefined}
      >
        <div className="min-w-0 flex-1">
          {props.multiple ? (
            props.value.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {props.value
                  .map((v) => props.options.find((o) => o.value === v))
                  .filter(Boolean)
                  .map((opt) => (
                    <span
                      key={(opt as SelectOption<T>).value}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                    >
                      {(opt as SelectOption<T>).label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleMulti((opt as SelectOption<T>).value);
                        }}
                        className="text-primary hover:text-red-600 transition"
                        aria-label={`Remove ${(opt as SelectOption<T>).label}`}
                        title={`Remove ${(opt as SelectOption<T>).label}`}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            ) : (
              <span className="text-gray-400">{props.placeholder ?? 'Select...'}</span>
            )
          ) : selectedLabels.length > 0 ? (
            <span className="block truncate">{selectedLabels[0]}</span>
          ) : (
            <span className="text-gray-400">{props.placeholder ?? 'Select...'}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {props.multiple && props.value.length > 0 && !props.disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clearMulti();
              }}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Clear selection"
              title="Clear"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
          <ChevronDownIcon
            className={`h-4 w-4 transition ${props.buttonClassName?.includes('text-white') ? 'text-white/90' : 'text-gray-400'} ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 min-w-[200px] max-w-[400px] dark:border-gray-600 dark:bg-gray-800">
          {searchable && (
            <div className="border-b border-gray-100 p-2">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                aria-label="Search options"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
          )}

          <div
            ref={listRef}
            tabIndex={-1}
            onKeyDown={onListKeyDown}
            className="max-h-60 overflow-auto p-1.5 focus:outline-none"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2.5 text-sm text-gray-500">No results</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const selected = isSelected(opt.value);
                const active = idx === activeIndex;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      if (opt.disabled) return;
                      if (props.multiple) {
                        toggleMulti(opt.value);
                      } else {
                        commitSingle(opt.value);
                      }
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      selected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : active
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-transparent text-gray-700'
                    } ${!selected && !active ? 'hover:bg-gray-50' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{opt.label}</div>
                      {opt.description ? (
                        <div className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                          {opt.description}
                        </div>
                      ) : null}
                    </div>
                    {selected ? (
                      <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-primary" />
                    ) : (
                      <span className="h-4 w-4 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
