"use client";

import { useEffect } from "react";

/**
 * Pelapor tinggi konten untuk mode ?shot=1 (pembuatan thumbnail statis):
 * menuliskan scrollHeight dokumen ke document.title sehingga Chrome
 * headless (--dump-dom) bisa membacanya untuk menentukan tinggi canvas
 * screenshot full-halaman secara presisi.
 */
export default function ShotReporter() {
  useEffect(() => {
    const report = () => {
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0,
      );
      document.title = `SHOT:${h}`;
    };
    report();
    window.addEventListener("load", report);
    const t1 = setTimeout(report, 1500);
    const t2 = setTimeout(report, 4000);
    return () => {
      window.removeEventListener("load", report);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return null;
}
