import { presenceValidator } from "@rawmodel/validators";
import {
  PopulateStrategy,
  SerializedStrategy,
  SystemErrorCode,
  ValidatorErrorCode,
} from "../config/values";
import { enumInclusionValidator, uniqueFieldValue } from "../lib/validators";
import { BaseSqlModel, prop } from "./base-sql-model";
import { integerParser, stringParser } from "@rawmodel/parsers";
import { Context } from "../context";
import { SqlError } from "../lib/errors";
import { getQueryParams, selectAndCountQuery } from "../lib/sql-utils";

export enum AirdropStatus {
  UNCONFIRMED = 1,
  PENDING = 2,
  AIRDROP_COMPLETED = 3,
  AIRDROP_ERROR = 4,
}

export class User extends BaseSqlModel {
  /**
   * wallet
   */
  protected _tableName = "user";

  /**
   * wallet
   */
  @prop({
    parser: { resolver: stringParser() },
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PROFILE_WALLET_NOT_PRESENT,
      },
      {
        resolver: uniqueFieldValue("user", "wallet"),
        code: ValidatorErrorCode.PROFILE_WALLET_ALREADY_TAKEN,
      },
    ],
    populatable: [PopulateStrategy.DB, PopulateStrategy.ADMIN],
    serializable: [
      SerializedStrategy.DB,
      SerializedStrategy.PROFILE,
      SerializedStrategy.ADMIN,
    ],
    fakeValue: null,
  })
  public wallet: string;

  /**
   * tx hash
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateStrategy.DB],
    serializable: [SerializedStrategy.DB, SerializedStrategy.ADMIN],
    fakeValue: null,
  })
  public tx_hash: string;

  /**
   * airdrop status
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateStrategy.DB],
    serializable: [SerializedStrategy.DB, SerializedStrategy.ADMIN],
    validators: [
      {
        resolver: enumInclusionValidator(AirdropStatus),
        code: ValidatorErrorCode.DATA_MODEL_INVALID_STATUS,
      },
    ],
    defaultValue: AirdropStatus.UNCONFIRMED,
    fakeValue() {
      return AirdropStatus.UNCONFIRMED;
    },
  })
  public airdrop_status: number;

  /**
   * Class constructor.
   * @param data Input data.
   * @param context Context.
   */
  public constructor(data?: any, context?: Context) {
    super(data, { context });
  }

  public async create() {
    const conn = await this.db().start();

    try {
      await this.insert(SerializedStrategy.DB, conn);
      await this.db().commit(conn);
    } catch (err) {
      await this.db().rollback(conn);
      throw new SqlError(
        err,
        this.getContext(),
        SystemErrorCode.DATABASE_ERROR,
        "user/create"
      );
    }
  }

  public async confirmAll() {
    const conn = await this.db().start();

    try {
      await conn.execute(
        `UPDATE user SET airdrop_status = ${AirdropStatus.PENDING} WHERE
          airdrop_status = ${AirdropStatus.UNCONFIRMED}
        ;
       `
      );
      await this.db().commit(conn);
    } catch (err) {
      await this.db().rollback(conn);
      throw new SqlError(
        err,
        this.getContext(),
        SystemErrorCode.DATABASE_ERROR,
        "user/confirm"
      );
    }
  }

  public async populateByWallet(wallet: string) {
    const data = await this.db().paramQuery(
      `
      SELECT * FROM ${this._tableName}
      WHERE wallet = @wallet
    `,
      { wallet }
    );

    if (data && data.length) {
      return this.populate(data[0], PopulateStrategy.DB);
    } else {
      return this.reset();
    }
  }

  /**
   * returns airdrop user statistics.
   */
  public async getStatistics() {
    const data = await this.db().paramQuery(
      `
      SELECT 
      count(*) as total,
        SUM(IF(airdrop_status = 1, 1, 0)) as unconfirmed,
        SUM(IF(airdrop_status = 2, 1, 0)) as pending,
        SUM(IF(airdrop_status = 3, 1, 0)) as airdropped,
        SUM(IF(airdrop_status = 4, 1, 0)) as threwError
    FROM user;
    `
    );
    if (data && data.length) {
      return data[0];
    } else {
      throw new Error();
    }
  }

  /**
   * returns list of matched users
   * @param urlQuery search/paging/order parameters
   */
  public async getList(urlQuery) {
    // set default values or null for all params that we pass to sql query
    const defaultParams = {
      id: null,
      wallet: null,
      status: null,
    };

    // map url query with sql fields
    const fieldMap = {
      id: "u.id",
      wallet: "u.wallet",
      status: "u.status",
    };
    const { params, filters } = getQueryParams(
      defaultParams,
      "u",
      fieldMap,
      urlQuery
    );
    if (filters.limit === -1) {
      filters.limit = null;
    }

    let serializedStrategy = SerializedStrategy.ADMIN;
    const sqlQuery = {
      qSelect: `
        SELECT
          u.id, u.wallet,
          u.tx_hash, u.status,
          u.createTime, u.updateTime,
          u.airdrop_status
        `,
      qFrom: `
        FROM user u
        WHERE
          (@id IS NULL OR u.id = @id)
          AND (@wallet IS NULL OR u.wallet LIKE CONCAT('%', @wallet, '%'))
          AND (@status IS NULL OR u.status = @status)
        `,
      qGroup: `
        `,
      qFilter: `
        ORDER BY ${
          filters.orderArr
            ? `${filters.orderArr.join(", ") || "u.updateTime DESC"}`
            : "u.updateTime DESC"
        }
        ${
          filters.limit !== null
            ? `LIMIT ${filters.limit} OFFSET ${filters.offset}`
            : ""
        };
      `,
    };

    const { items, total } = await selectAndCountQuery(
      this.db(),
      sqlQuery,
      params,
      "u.id"
    );
    const conn = await this.db().db.getConnection();
    try {
      const populatedItems = await Promise.all(
        items.map(async (item) => {
          const u = new User({}, this.getContext()).populate(
            item,
            PopulateStrategy.DB
          );
          return u.serialize(serializedStrategy);
        })
      );
      return { items: populatedItems, total };
    } catch (e) {
      throw e;
    } finally {
      await conn.release();
    }
  }
}
