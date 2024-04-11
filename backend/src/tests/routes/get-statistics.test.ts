import {
  createContextAndStartServer,
  Stage,
  stopServerAndCloseMySqlContext,
} from '../helpers/context';
import request from 'supertest';
import { setupTestDatabase, clearTestDatabase } from '../helpers/migrations';
import { AirdropStatus, User } from '../../models/user';
import { env } from '../../config/env';
import { generateAdminAuthToken } from '../../lib/jwt';
import { getWallet } from '../helpers/wallets';
let stage: Stage;
let token;

describe('get statistics', () => {
  beforeAll(async () => {
    stage = await createContextAndStartServer();
    token = generateAdminAuthToken(env.ADMIN_WALLET[0]);
    await setupTestDatabase();
    await new User({}, stage.context)
      .fake()
      .populate({
        wallet: (await getWallet()).address,
      })
      .create();
    await new User({}, stage.context)
      .fake()
      .populate({
        wallet: (await getWallet()).address,
        airdrop_status: AirdropStatus.PENDING,
      })
      .create();
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
        airdrop_status: AirdropStatus.AIRDROP_COMPLETED,
      })
      .create();
    await new User({}, stage.context)
      .fake()
      .populate({
        wallet: (await getWallet()).address,
        airdrop_status: AirdropStatus.AIRDROP_ERROR,
      })
      .create();
  });

  afterAll(async () => {
    await clearTestDatabase();
    await stopServerAndCloseMySqlContext(stage);
  });

  test('gets statistics', async () => {
    const res = await request(stage.app)
      .get('/users/statistics')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      total: 5,
      unconfirmed: 2,
      pending: 1,
      airdropped: 1,
      threwError: 1,
    });
  });
});
