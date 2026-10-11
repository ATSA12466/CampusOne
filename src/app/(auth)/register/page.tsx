import { routeMetadata } from "@/config/metadata";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";
import { authRouteOptions } from "@/features/auth/route-options";
export const metadata = routeMetadata("register");
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const options = await authRouteOptions(searchParams);
  return (
    <AuthLayout
      title="Start your next chapter."
      description="A name, a little curiosity, and a campus full of possibilities."
      story="register"
    >
      <RegisterForm {...options} />
    </AuthLayout>
  );
}
