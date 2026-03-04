import { data } from "react-router";
import { type Route } from "./+types/contracts.$wasm_hash";
import { Badge } from "~/components/badge";
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
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{contract.wasm_name}</h1>
        <Badge variant="secondary">{contract.version}</Badge>
      </div>

      <div className={styles.layout}>
        <div className={styles.fields}>
          <div className={styles.field}>
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

          <div className={styles.field}>
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

          <div className={styles.field}>
            <p className={styles.fieldLabel}>Version</p>
            <p className={styles.fieldValue}>{contract.version}</p>
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sidebarPanel}>
            <a
              href={`${STELLAR_EXPERT}/account/${contract.author}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sidebarLink}
            >
              <span>View Author</span>
              <span className={styles.sidebarLinkArrow}>↗</span>
            </a>
            <a
              href={`${STELLAR_EXPERT}/contract/${contract.wasm_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sidebarLink}
            >
              <span>View Contract</span>
              <span className={styles.sidebarLinkArrow}>↗</span>
            </a>
          </div>
        </aside>
      </div>
    </main>
  );
}
