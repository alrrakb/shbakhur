import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const CANONICAL_DOMAIN = 'https://shbakhur.com';

export default function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  const breadcrumbListSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const element: Record<string, any> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
      };

      if (item.href) {
        const fullUrl = item.href.startsWith('http')
          ? item.href
          : `${CANONICAL_DOMAIN}${item.href.startsWith('/') ? item.href : `/${item.href}`}`;
        element.item = fullUrl;
      }

      return element;
    }),
  };

  return (
    <>
      {/* Google Structured Data: BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListSchema) }}
      />

      <nav aria-label="مسار التنقل" className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-2 text-sm" itemScope itemType="https://schema.org/BreadcrumbList">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex items-center gap-2"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                <meta itemProp="position" content={String(index + 1)} />
                {item.href ? (
                  <Link
                    href={item.href}
                    itemProp="item"
                    className="text-gray-500 hover:text-luxury-gold transition-colors"
                  >
                    <span itemProp="name">{item.label}</span>
                  </Link>
                ) : (
                  <span itemProp="name" className="text-luxury-gold font-medium">
                    {item.label}
                  </span>
                )}
                {index < items.length - 1 && (
                  <span className="text-gray-600 select-none" aria-hidden="true">/</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
}
