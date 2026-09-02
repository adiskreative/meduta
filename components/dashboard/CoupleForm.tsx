"use client";

import { useActionState } from "react";
import { Save, Eye } from "lucide-react";
import { saveCouple, CoupleState } from "@/lib/actions/couple";

type PersonValues = {
  name?: string;
  nickname?: string;
  childOf?: string;
  parentName?: string;
  bio?: string;
  instagram?: string;
  photoUrl?: string;
};

export default function CoupleForm({
  invitationId,
  groom,
  bride,
}: {
  invitationId: string;
  groom: PersonValues;
  bride: PersonValues;
}) {
  const boundAction = saveCouple.bind(null, invitationId);
  const [state, formAction, isPending] = useActionState<CoupleState | undefined, FormData>(
    boundAction,
    undefined,
  );

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 ${
      hasError ? "border-red-400" : "border-zinc-300"
    }`;

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            state.success
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PersonCard
          title="Mempelai Pria"
          subtitle="Data calon pengantin pria"
          prefix="groom"
          values={groom}
          errors={state?.errors}
          inputClass={inputClass}
        />
        <PersonCard
          title="Mempelai Wanita"
          subtitle="Data calon pengantin wanita"
          prefix="bride"
          values={bride}
          errors={state?.errors}
          inputClass={inputClass}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Menyimpan..." : "Simpan Data Mempelai"}
        </button>

        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <Eye className="h-4 w-4" />
          Preview
        </a>
      </div>
    </form>
  );
}

function PersonCard({
  title,
  subtitle,
  prefix,
  values,
  errors,
  inputClass,
}: {
  title: string;
  subtitle: string;
  prefix: "groom" | "bride";
  values: PersonValues;
  errors?: CoupleState["errors"];
  inputClass: (hasError: boolean) => string;
}) {
  const fields: { name: keyof PersonValues; label: string }[] = [
    { name: "name", label: "Nama lengkap" },
    { name: "nickname", label: "Nama panggilan" },
    { name: "childOf", label: "Anak ke-" },
    { name: "parentName", label: "Nama orang tua" },
    { name: "instagram", label: "Instagram (opsional)" },
    { name: "photoUrl", label: "URL foto profil" },
  ];

  function fieldError(field: string): boolean {
    return !!errors?.[`${prefix}.${field}` as keyof NonNullable<CoupleState["errors"]>];
  }
  function fieldErrorText(field: string): string | undefined {
    return errors?.[`${prefix}.${field}` as keyof NonNullable<CoupleState["errors"]>]?.[0];
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mb-5 text-sm text-zinc-500">{subtitle}</p>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={`${prefix}.${field.name}`}
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              {field.label}
            </label>
            <input
              id={`${prefix}.${field.name}`}
              name={`${prefix}.${field.name}`}
              type="text"
              defaultValue={values[field.name] ?? ""}
              className={inputClass(fieldError(field.name))}
            />
            {fieldErrorText(field.name) && (
              <p className="mt-1 text-xs text-red-600">{fieldErrorText(field.name)}</p>
            )}
          </div>
        ))}

        <div>
          <label
            htmlFor={`${prefix}.bio`}
            className="mb-1.5 block text-sm font-medium text-zinc-700"
          >
            Bio singkat (opsional)
          </label>
          <textarea
            id={`${prefix}.bio`}
            name={`${prefix}.bio`}
            rows={3}
            defaultValue={values.bio ?? ""}
            className={inputClass(!!errors?.[`${prefix}.bio`])}
          />
        </div>
      </div>
    </div>
  );
}