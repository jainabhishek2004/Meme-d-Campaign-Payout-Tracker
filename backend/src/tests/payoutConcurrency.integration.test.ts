import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import Campaign from '../models/Campaign';
import Submission from '../models/Submission';
import { updateViews } from '../controllers/submissionController';

jest.setTimeout(300_000);

let replicaSet: MongoMemoryReplSet;

async function callUpdateViews(submissionId: string, views: number) {
  let statusCode = 200;
  let body: any;
  let handlerError: unknown;

  await updateViews(
    { params: { id: submissionId }, body: { views } } as any,
    {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        body = data;
        return this;
      },
    } as any,
    (error?: unknown) => {
      handlerError = error;
    }
  );

  if (handlerError) throw handlerError;
  return { statusCode, body };
}

async function createCampaignWithPosts(totalBudget: number, postCount: number) {
  const brand = new mongoose.Types.ObjectId();
  const campaign = await Campaign.create({
    brand,
    name: 'Concurrency test',
    platform: 'Instagram',
    totalBudget,
    milestones: [{ viewThreshold: 1000, payout: 500 }],
  });

  const submissions = await Promise.all(
    Array.from({ length: postCount }, (_, index) => Submission.create({
      creator: new mongoose.Types.ObjectId(),
      campaign: campaign._id,
      postLink: `https://instagram.com/p/test-${index}`,
    }))
  );

  return { campaign, submissions };
}

beforeAll(async () => {
  replicaSet = await MongoMemoryReplSet.create({ binary: { version: '8.2.6' }, replSet: { count: 1 } });
  await mongoose.connect(replicaSet.getUri(), { dbName: 'memed-payout-integration' });
  await Promise.all([Campaign.init(), Submission.init()]);
});

afterEach(async () => {
  await Promise.all([Campaign.deleteMany({}), Submission.deleteMany({})]);
  jest.restoreAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  await replicaSet.stop();
});

describe('payout transaction concurrency (MongoDB replica set)', () => {
  it('charges a same-submission milestone increase only once for simultaneous updates', async () => {
    const { campaign, submissions: [submission] } = await createCampaignWithPosts(1000, 1);

    const responses = await Promise.all([
      callUpdateViews(submission._id.toString(), 1000),
      callUpdateViews(submission._id.toString(), 1000),
    ]);

    expect(responses.map((response) => response.statusCode)).toEqual([200, 200]);
    const [savedCampaign, savedSubmission] = await Promise.all([
      Campaign.findById(campaign._id),
      Submission.findById(submission._id),
    ]);
    expect(savedCampaign?.budgetSpent).toBe(500);
    expect(savedSubmission?.currentPayout).toBe(500);
  });

  it('caps payouts when separate submissions compete for the same remaining budget', async () => {
    const { campaign, submissions } = await createCampaignWithPosts(500, 2);

    const responses = await Promise.all(
      submissions.map((submission) => callUpdateViews(submission._id.toString(), 1000))
    );

    expect(responses.map((response) => response.statusCode)).toEqual([200, 200]);
    const [savedCampaign, savedSubmissions] = await Promise.all([
      Campaign.findById(campaign._id),
      Submission.find({ campaign: campaign._id }),
    ]);
    expect(savedCampaign?.budgetSpent).toBe(500);
    expect(savedSubmissions.reduce((sum, submission) => sum + submission.currentPayout, 0)).toBe(500);
  });

  it('rolls back the campaign budget if the submission database write fails', async () => {
    const { campaign, submissions: [submission] } = await createCampaignWithPosts(1000, 1);
    jest.spyOn(Submission.collection, 'findOneAndUpdate')
      .mockRejectedValueOnce(new Error('injected submission database write failure'));

    await expect(callUpdateViews(submission._id.toString(), 1000))
      .rejects.toThrow('injected submission database write failure');

    const [savedCampaign, savedSubmission] = await Promise.all([
      Campaign.findById(campaign._id),
      Submission.findById(submission._id),
    ]);
    expect(savedCampaign?.budgetSpent).toBe(0);
    expect(savedSubmission?.currentPayout).toBe(0);
  });
});
