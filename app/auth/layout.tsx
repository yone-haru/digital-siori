export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-paper min-h-screen sm:min-h-0 sm:rounded-[48px] sm:shadow-[0_24px_80px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.10)] flex flex-col">
        {children}
      </div>
    </div>
  );
}
