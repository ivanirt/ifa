import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/odus";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = loadCatalog();
    const count = Object.values(catalog.records).reduce((n, map) => n + Object.keys(map).length, 0);
    return NextResponse.json({ ok: true, sources: catalog.sources, odus: count });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "catalog" },
      { status: 500 },
    );
  }
}
