import { Studio } from "@/components/Studio";
import { loadBiblia } from "@/lib/biblia";
import { loadCatalog, sourceLabel } from "@/lib/odus";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const catalog = loadCatalog();
  const sources = catalog.sources.map((id) => ({ id, label: sourceLabel(id) }));
  const biblia = loadBiblia();

  return <Studio sources={sources} records={catalog.records} biblia={biblia} />;
}
