import { CronJob } from "cron";
import { AirdropStatus } from "./models/user";
import { SqlModelStatus } from "./models/base-sql-model";
import { MysqlConnectionManager } from "./lib/mysql-connection-manager";
import { env } from "./config/env";
import { LogType, writeLog } from "./lib/logger";
import { LogLevel, Nft } from "@apillon/sdk";

export class Cron {
  private cronJobs: CronJob[] = [];

  constructor() {
    this.cronJobs.push(new CronJob("* * * * *", this.airdrop, null, false));
  }

  async start() {
    for (const cronJob of this.cronJobs) {
      cronJob.start();
    }
  }

  async stop() {
    for (const cronJob of this.cronJobs) {
      cronJob.stop();
    }
    await MysqlConnectionManager.destroyInstance();
  }

  async airdrop() {
    const mysql = await MysqlConnectionManager.getInstance();

    const collection = new Nft({
      key: env.APILLON_KEY,
      secret: env.APILLON_SECRET,
      logLevel: LogLevel.VERBOSE,
    }).collection(env.COLLECTION_UUID);

    // process up to 20 wallets per minute
    for (let i = 0; i < 20; i++) {
      const conn = await mysql.start();

      try {
        const res = await conn.execute(
          `SELECT * FROM user WHERE
          airdrop_status = ${AirdropStatus.PENDING}
          AND status = ${SqlModelStatus.ACTIVE}
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        ;
       `
        );
        const user = res[0][0] as any;

        if (!user) {
          await conn.rollback();
          break;
        }

        const response = await collection.mint({
          receivingAddress: user.wallet,
          quantity: 1,
        });

        const sql = `
        UPDATE user SET
        airdrop_status = ${
          response.success
            ? AirdropStatus.AIRDROP_COMPLETED
            : AirdropStatus.AIRDROP_ERROR
        },
        tx_hash = '${response.transactionHash}'
        WHERE wallet = '${user.wallet}'`;

        await conn.execute(sql);
        await conn.commit();
      } catch (e) {
        console.log(e);
        writeLog(LogType.ERROR, e, "cron.ts", "airdrop");
        await conn.rollback();
      }
    }

    MysqlConnectionManager.destroyInstance();
  }
}
