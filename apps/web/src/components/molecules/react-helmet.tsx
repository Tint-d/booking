import { useEffect } from "react";
import { Helmet } from "react-helmet";

export interface ReactHelmetProps {
  title?: string;
  description?: string;
  faviconUrl?: string;
  openGraphTags?: Array<{ property: string; content: string }>;
}

interface ReactHelmetComponentProps {
  metadata: ReactHelmetProps;
}

/**
 * Apply title and favicon directly to document so they show reliably in client-side SPAs.
 */
function applyMetadataToDocument(metadata: ReactHelmetProps) {
  if (metadata.title != null) {
    document.title = metadata.title;
  }
  if (metadata.faviconUrl != null) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = metadata.faviconUrl;
    link.type = "image/jpeg";
  }
}

/**
 * Renders document head tags from a metadata object (title, description, favicon, og tags).
 * Also applies title and favicon via useEffect so they appear even when react-helmet is slow.
 */
export function ReactHelmet({ metadata }: ReactHelmetComponentProps) {
  const { title, description, faviconUrl, openGraphTags } = metadata;

  useEffect(() => {
    applyMetadataToDocument(metadata);
  }, [metadata.title, metadata.faviconUrl, metadata]);

  return (
    <Helmet>
      {title != null && <title>{title}</title>}
      {description != null && (
        <meta name="description" content={description} />
      )}
      {faviconUrl != null && (
        <link rel="icon" type="image/jpeg" href={faviconUrl} />
      )}
      {openGraphTags?.map((tag) => (
        <meta key={tag.property} property={tag.property} content={tag.content} />
      ))}
    </Helmet>
  );
}
