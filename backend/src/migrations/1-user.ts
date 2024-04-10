export async function upgrade(
  queryFn: (query: string, values?: any[]) => Promise<Array<any>>,
) {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`user\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`wallet\` VARCHAR(80) NOT NULL,
      \`tx_hash\` VARCHAR(80) NULL DEFAULT NULL,
      \`airdrop_status\` INT NOT NULL,
      \`status\` INT NULL,
      \`createTime\` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
      \`updateTime\` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`));
  `);

  await queryFn(`
    CREATE UNIQUE INDEX \`wallet_UNIQUE\` ON \`user\` (\`wallet\` ASC) VISIBLE;
  `);
}
export async function downgrade(
  queryFn: (query: string, values?: any[]) => Promise<Array<any>>,
) {
  await queryFn(`
    DROP TABLE IF EXISTS \`user\` ;
  `);
}
