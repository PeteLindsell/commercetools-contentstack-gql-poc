import { fetchSkeletonMessage } from "@/lib/bff-client";

export default async function WalkingSkeletonPage() {
  const message = await fetchSkeletonMessage();

  return (
    <main>
      <h1>Storefront walking skeleton</h1>
      <p data-testid="skeleton-message">{message}</p>
    </main>
  );
}
