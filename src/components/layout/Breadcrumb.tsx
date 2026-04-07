'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-2 text-sm">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-luxury-gold transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-luxury-gold">{item.label}</span>
              )}
              {index < items.length - 1 && (
                <span className="text-gray-600">/</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
