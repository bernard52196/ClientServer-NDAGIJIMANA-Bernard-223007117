"use client";

type CommunityLoadingProps = {
  message?: string;
};

export default function CommunityLoading({
  message = "LOADING YOUR DASHBOARD...",
}: CommunityLoadingProps) {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 23, 42, 0.35), rgba(15, 23, 42, 0.50)), url('/images/community-bg.jpg')",
      }}
    >
      <div className="text-center text-white">
        <h1 className="mb-3 text-4xl font-extrabold">
          Community<span className="text-emerald-400">Save</span>
        </h1>

        <p className="mb-8 text-lg text-slate-100">
          Building stronger communities through savings.
        </p>

        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/40 border-t-emerald-400" />

        <p className="mt-5 animate-pulse text-sm font-semibold tracking-widest">
          {message}
        </p>
      </div>
    </main>
  );
}
