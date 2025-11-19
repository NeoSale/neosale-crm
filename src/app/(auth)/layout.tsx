import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - NeoSale CRM",
  description: "Faça login no NeoSale CRM",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
