export const metadata = {
  title: "Web Based Wallet",
}

export default function layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      {children}
    </main>
  )
};
