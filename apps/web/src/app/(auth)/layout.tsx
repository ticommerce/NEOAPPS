import Link from "next/link";
import { site } from "@/config/site";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-display text-xl font-bold">
        <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
          R
        </span>
        {site.name}
      </Link>
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 sm:p-8">{children}</div>
    </main>
  );
}
