import { useState } from "react";
import { Link } from "react-router";
import { type Route } from "./+types/_index";
import { Badge } from "~/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/card";
import { Input } from "~/components/input";
import { getContracts } from "~/lib/api";
import { type Contract } from "~/lib/types";
import styles from "./_index.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Stellar Contract Registry" },
    { name: "description", content: "Browse deployed Stellar smart contracts" },
  ];
}

export async function loader() {
  const contracts = await getContracts();
  return { contracts };
}

function ContractCard({ contract }: { contract: Contract }) {
  return (
    <Link to={`/contracts/${contract.wasm_hash}`} className={styles.cardLink}>
      <Card className={styles.card}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.cardName}>{contract.wasm_name}</CardTitle>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          <p className={styles.cardAuthor}>{contract.author}</p>
          <Badge variant="secondary">{contract.version}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <span className={styles.headerTitle}>Stellar Contract Registry</span>
      </div>
    </header>
  );
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { contracts } = loaderData;
  const [query, setQuery] = useState("");

  const filtered = query
    ? contracts.filter(
        (c) =>
          c.wasm_name.toLowerCase().includes(query.toLowerCase()) ||
          c.author.toLowerCase().includes(query.toLowerCase()),
      )
    : contracts;

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.heading}>Contract Registry</h1>
          <p className={styles.subheading}>Browse deployed Stellar smart contracts</p>
        </div>

        <div className={styles.searchWrapper}>
          <Input
            placeholder="Search by name or author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <p className={styles.emptyState}>No contracts found.</p>
        ) : (
          <div className={styles.grid}>
            {filtered.map((contract) => (
              <ContractCard key={contract.wasm_hash} contract={contract} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
