import { routeMetadata } from "@/config/metadata";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = routeMetadata("register");

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your CampusOne account"
      description="Demo signup for frontend experience."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
