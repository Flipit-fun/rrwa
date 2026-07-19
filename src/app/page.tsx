import HomeClient from "./HomeClient";
import { getProperties } from "./actions/properties";

export default async function Home() {
  const properties = await getProperties();
  return <HomeClient properties={properties} />;
}
