import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - NeoCRM",
  description: "Faça login no NeoCRM",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
