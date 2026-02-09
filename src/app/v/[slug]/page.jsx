import { headers } from "next/headers";
import HomeClient from "./HomeClient";

export default async function Page(props) {
  const { slug } = await props.params;

  const h = await headers();
  const host = h.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/generated-sites/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <p className="text-2xl font-bold">Not found</p>
          <p className="opacity-70 text-sm">This Valentine page doesn’t exist.</p>
        </div>
      </div>
    );
  }

  const data = await res.json();
  return <HomeClient data={data} />;
}
