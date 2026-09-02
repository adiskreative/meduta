"use client";

import Link from "next/link";
import { Sparkles, Eye, Smartphone } from "lucide-react";

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
      <PhoneMockup src={template.image} />
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-lg font-semibold text-zinc-900">{template.name}</h3>
          {template.premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950">
              <Sparkles className="h-3 w-3" /> Premium
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-zinc-500">{template.desc}</p>
      </div>
      <Link
        href={`/preview/${template.key}`}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
      >
        <Eye className="h-4 w-4" />
        Lihat Pratinjau
      </Link>
    </div>
  );
}

function PhoneMockup({ src }: { src: string }) {
  return (
    <div className="relative w-52">
      <div className="relative z-10 overflow-hidden rounded-[2.25rem] border-[10px] border-zinc-900 bg-black shadow-2xl">
        <div className="absolute left-1/2 top-0 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-zinc-900" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Pratinjau template undangan"
          className="aspect-[9/19] w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <Smartphone className="absolute -left-4 -top-4 z-20 h-7 w-7 text-zinc-400" />
    </div>
  );
}
