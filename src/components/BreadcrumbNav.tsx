import { Fragment } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { cn } from "@/lib/utils";

export interface BreadcrumbItemData {
  /** Display text (e.g., "Inicio", "Panaderías y Pastelerías") */
  label: string;
  /** URL path (omit for current page) */
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItemData[];
  /** Class for the outer wrapper (has bg-muted/30 border-b) */
  className?: string;
  /** Class for the inner container (defaults to "container mx-auto px-4 py-3") */
  containerClassName?: string;
}

/**
 * Reusable breadcrumb component that renders both:
 * 1. Visible breadcrumbs using Shadcn/ui components
 * 2. BreadcrumbList JSON-LD structured data for SEO
 */
export function BreadcrumbNav({ items, className, containerClassName }: BreadcrumbNavProps) {
  // Generate BreadcrumbList JSON-LD schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      // Only include item URL if it's not the current page (has href)
      ...(item.href && { item: `${SITE_CONFIG.url}${item.href}` }),
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className={cn("bg-muted/30 border-b border-border", className)}>
        <div className={cn("container mx-auto px-4 py-3", containerClassName)}>
          <Breadcrumb>
            <BreadcrumbList>
              {items.map((item, index) => (
                <Fragment key={index}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link to={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </>
  );
}
