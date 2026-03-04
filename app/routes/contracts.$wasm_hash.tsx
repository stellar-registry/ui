import { Link, data } from "react-router";
import { type Route } from "./+types/contracts.$wasm_hash";
import { Badge } from "~/components/badge";
import { Button } from "~/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/card";
import { getContracts } from "~/lib/api";
import styles from "./contracts.$wasm_hash.module.css";

const STELLAR_EXPERT = "https://stellar.expert/explorer/public";

export async function loader({ params }: Route.LoaderArgs) {
  const contracts = await getContracts();
  const contract = contracts.find((c) => c.wasm_hash === params.wasm_hash);
  if (!contract) throw data("Contract not found", { status: 404 });
  return { contract };
}

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Contract Not Found" }];
  return [
    { title: `${loaderData.contract.wasm_name} — Stellar Contract Registry` },
  ];
}

export default function ContractDetail({ loaderData }: Route.ComponentProps) {
  const { contract } = loaderData;

  return (
    <main className={styles.main}>
      <div className={styles.backNav}>
        <Link to="/" className={styles.backLink}>
          ← Back to registry
        </Link>
      </div>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{contract.wasm_name}</h1>
        <Badge variant="secondary">{contract.version}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={styles.cardTitle}>Contract Details</CardTitle>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          <div>
            <p className={styles.fieldLabel}>Author</p>
            <a
              href={`${STELLAR_EXPERT}/account/${contract.author}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.fieldLink}
            >
              {contract.author}
            </a>
          </div>

          <div>
            <p className={styles.fieldLabel}>WASM Hash</p>
            <a
              href={`${STELLAR_EXPERT}/contract/${contract.wasm_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.fieldLink}
            >
              {contract.wasm_hash}
            </a>
          </div>

          <div>
            <p className={styles.fieldLabel}>Version</p>
            <p className={styles.fieldValue}>{contract.version}</p>
          </div>
        </CardContent>
      </Card>

      <div className={styles.actions}>
        <Button asChild variant="outline" size="sm">
          <a
            href={`${STELLAR_EXPERT}/account/${contract.author}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Author on Explorer
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href={`${STELLAR_EXPERT}/contract/${contract.wasm_hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Contract on Explorer
          </a>
        </Button>
      </div>
    </main>
  );
}
