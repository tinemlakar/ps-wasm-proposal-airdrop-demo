import {
  createContextAndStartServer,
  Stage,
  stopServerAndCloseMySqlContext,
} from '../helpers/context';
import * as request from 'supertest';
import { setupTestDatabase, clearTestDatabase } from '../helpers/migrations';
import { env } from '../../config/env';
import { generateAdminAuthToken } from '../../lib/jwt';
import { getWallet } from '../helpers/wallets';
import { AirdropStatus, User } from '../../models/user';
let stage: Stage;
let token;

describe('create user', () => {
  beforeAll(async () => {
    token = generateAdminAuthToken(env.ADMIN_WALLET[0]);
    stage = await createContextAndStartServer();
    await setupTestDatabase();
    await new User({}, stage.context)
      .fake()
      .populate({
        wallet: (await getWallet()).address,
        airdrop_status: AirdropStatus.UNCONFIRMED,
      })
      .create();

    await new User({}, stage.context)
      .fake()
      .populate({
        wallet: (await getWallet()).address,
        airdrop_status: AirdropStatus.UNCONFIRMED,
      })
      .create();
  });

  afterAll(async () => {
    await clearTestDatabase();
    await stopServerAndCloseMySqlContext(stage);
  });

  test('confirm user', async () => {
    const res = await request(stage.app)
      .post('/users/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(200);
    const dbRes = await stage.context.mysql.paramExecute(
      `SELECT * FROM user where airdrop_status = ${AirdropStatus.PENDING}`,
    );
    expect(dbRes.length).toBe(2);
  });
});
