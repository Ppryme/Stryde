import SignUpClient from "@/app/sign-up/SignUpClient";

export default async function SignUpPage({
  searchParams,
}) {
  const params = await searchParams;

  return (
    <SignUpClient
      authError={params?.error}
    />
  );
}
