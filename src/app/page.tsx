import { db } from "./db";
import { ElementVotes, Elements } from "./db/schema";
import { eq, sql } from 'drizzle-orm'
import { ElementComponent } from "./components/element";

export const dynamic = 'force-dynamic';

const getData = async () => {
  const elements = await db.
    select({
      votes: sql<number>`COALESCE(COUNT(DISTINCT ${ElementVotes.userId}), 0)`,
      name: Elements.name,
      atomicNumber: Elements.atomicNumber,
      symbol: Elements.symbol
    })
    .from(Elements)
    .leftJoin(ElementVotes, eq(Elements.atomicNumber, ElementVotes.elementId))
    .groupBy(sql`${Elements.name},${Elements.atomicNumber}`)
    .orderBy(sql`COALESCE(COUNT(DISTINCT ${ElementVotes.userId}), 0) DESC`)

  return elements;
};

export default async function Home() {
  const elements = await getData();

  return (
    <main className="min-h-screen bg-[#1A1A1A]">
      <div className="py-8">
        <h1 className="text-3xl font-bold text-center text-white">Forklane</h1>
        <p className="text-lg text-center text-gray-400 mt-2">Discover open-source software</p>
      </div>
      <div className="flex items-center justify-center px-4">
        <ul className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {
            elements.map(el => {
              return (
                <ElementComponent key={el.atomicNumber} atomicNumber={el.atomicNumber} symbol={el.symbol} name={el.name}>
                  <small className="pt-4 text-xs text-gray-800">Votes: {el.votes}</small>
                </ElementComponent>
              )
            })
          }
        </ul>
      </div>
    </main>
  );
}
