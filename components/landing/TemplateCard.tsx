"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import RingIcon from "@/components/icons/RingIcon";
import LiveTemplatePreview from "./LiveTemplatePreview";

export type TemplateCardData = {
  key: string;
  name: string;
  desc: string;
  image: string;
  premium: boolean;
};

export default function TemplateCard({ template }: { template: TemplateCardData }) {
  return (
    <div className="group flex flex-col items-center rounded-3xl border border-zinc-200 bg-white p-8 transition hover:shadow-xl hover:shadow-rose-100">
      <Link
        href={`/preview/${template.key}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Lihat pratinjau template ${template.name}`}
        className="relative w-60"
      >
        <LiveTemplatePreview templateKey={template.key} />
      </Link>
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-lg font-semibold text-zinc-900">{template.name}</h3>
          {template.premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950">
              <RingIcon className="h-3 w-3" /> Premium
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-zinc-500">{template.desc}</p>
      </div>
      <Link
        href={`/preview/${template.key}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600"
      >
        <Eye className="h-4 w-4" />
        Lihat Pratinjau
      </Link>
    </div>
  );
}
