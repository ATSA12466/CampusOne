import { routeMetadata } from "@/config/metadata";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { authRouteOptions } from "@/features/auth/route-options";
export const metadata = routeMetadata("sign-in");
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const options = await authRouteOptions(searchParams);
  return (
    <AuthLayout
      title="Good to see you."
      description="Your people and your plans, in one place. Open your student-life workspace."
      story="signin"
    >
      <SignInForm {...options} />
    </AuthLayout>
  );
}
