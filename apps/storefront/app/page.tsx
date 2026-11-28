import { fetchHomepage } from "@/lib/bff-client";

export default async function HomepagePage() {
  const homepage = await fetchHomepage();

  if (!homepage) {
    return (
      <main>
        <p>No Homepage content is published.</p>
      </main>
    );
  }

  return (
    <main>
      {homepage.headline ? <h1>{homepage.headline}</h1> : null}
      {homepage.body ? <p>{homepage.body}</p> : null}
      {homepage.imageUrl ? (
        // Editorial file from Contentstack; hostname is not known at build time.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={homepage.imageUrl} alt="" />
      ) : null}
    </main>
  );
}
